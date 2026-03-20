const LIFECYCLE_STATES = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  BOOTING: 'BOOTING',
  READY: 'READY',
  SUSPENDED: 'SUSPENDED',
  TERMINATING: 'TERMINATING',
  FAILED: 'FAILED',
  MAINTENANCE: 'MAINTENANCE',
  DEGRADED: 'DEGRADED',
  RECOVERING: 'RECOVERING',
  SHUTTING_DOWN: 'SHUTTING_DOWN',
  EVOLVING: 'EVOLVING',
  CIRCUIT_OPEN: 'CIRCUIT_OPEN',
  HALF_OPEN: 'HALF_OPEN'
});

class NexusError extends Error {
  constructor(message, code, context = {}, retryable = false, retryAfter = 0) {
    super(message);
    this.name = 'NexusError';
    this.code = code;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.timestamp = new Date().toISOString();
    this.id = crypto.randomUUID();
    this.context = {
      ...context,
      system: {
        arch: process.arch,
        platform: process.platform,
        version: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid
      }
    };
    this.stackTrace = this.stack ? this.stack.split('\n').map(line => line.trim()) : [];
    Object.seal(this);
  }

  static from(error, code = 'INTERNAL_ERROR', retryable = false) {
    if (error instanceof NexusError) return error;
    return new NexusError(error.message, code, {
      originalName: error.name,
      originalMessage: error.message,
      stack: error.stack
    }, retryable);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      stack: this.stackTrace
    };
  }
}

class NexusTelemetry {
  constructor(config = {}) {
    this.spans = new Map();
    this.exporters = [];
    this.samplingRate = config.samplingRate ?? 1.0;
    this.maxBufferSize = config.maxBufferSize ?? 1000;
    this.buffer = [];
  }

  addExporter(exporter) {
    if (typeof exporter?.export !== 'function') {
      throw new NexusError('Invalid Telemetry Exporter', 'TELEMETRY_ERROR');
    }
    this.exporters.push(exporter);
  }

  recordSpan(span) {
    if (Math.random() > this.samplingRate) return;
    
    this.spans.set(span.spanId, span);
    this.buffer.push(span);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }

    this.exporters.forEach(e => {
      try {
        e.export(span);
      } catch (err) {
        console.error('Telemetry Export Failed', err);
      }
    });
  }

  flush() {
    const data = [...this.buffer];
    this.buffer = [];
    return data;
  }

  getTrace(correlationId) {
    return Array.from(this.spans.values()).filter(s => s.correlationId === correlationId);
  }
}

const globalTelemetry = new NexusTelemetry();

class NexusContext {
  constructor(correlationId = crypto.randomUUID(), parent = null) {
    this.correlationId = correlationId;
    this.parent = parent;
    this.startTime = performance.now();
    this.spanId = crypto.randomUUID().substring(0, 8);
    this.metadata = new Map(parent ? parent.metadata : []);
    this.attributes = new Map();
    this.breadcrumbs = parent ? [...parent.breadcrumbs] : [];
    this.logs = [];
    this.children = [];
    this.resources = [];
    this.isAborted = false;
    this.abortReason = null;
    
    if (parent) parent.children.push(this);
  }

  setAttribute(key, value) {
    this.attributes.set(key, value);
    return this;
  }

  set(key, value) {
    this.metadata.set(key, value);
    return this;
  }

  get(key) {
    return this.metadata.get(key) || this.attributes.get(key);
  }

  trackResource(cleanupFn) {
    if (typeof cleanupFn !== 'function') {
      throw new NexusError('Cleanup must be a function', 'RESOURCE_ERROR');
    }
    this.resources.push(cleanupFn);
  }

  async dispose() {
    for (const cleanup of this.resources.reverse()) {
      try {
        await cleanup();
      } catch (e) {
        this.log(`Resource cleanup failed: ${e.message}`, 'error');
      }
    }
  }

  createChild(name) {
    const child = new NexusContext(this.correlationId, this);
    child.breadcrumbs.push(name);
    return child;
  }

  log(message, level = 'info', data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      elapsed: (performance.now() - this.startTime).toFixed(4),
      correlationId: this.correlationId,
      spanId: this.spanId,
      path: this.breadcrumbs.join(' > '),
      level,
      message,
      attributes: Object.fromEntries(this.attributes),
      ...data
    };
    this.logs.push(entry);
    
    const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.correlationId}:${entry.spanId}] [${entry.path}] ${message}`;
    
    switch(level) {
      case 'error': console.error(formatted, data); break;
      case 'warn':  console.warn(formatted, data); break;
      case 'debug': if (process.env.DEBUG) console.debug(formatted, data); break;
      default:      console.log(formatted);
    }
  }

  getDuration() {
    return performance.now() - this.startTime;
  }

  serialize() {
    const serialized = {
      correlationId: this.correlationId,
      spanId: this.spanId,
      path: this.breadcrumbs,
      metadata: Object.fromEntries(this.metadata),
      attributes: Object.fromEntries(this.attributes),
      metrics: {
        duration: this.getDuration(),
        childCount: this.children.length,
        resourceCount: this.resources.length
      },
      logs: this.logs
    };
    globalTelemetry.recordSpan(serialized);
    return serialized;
  }

  abort(reason = 'Manual abort') {
    this.isAborted = true;
    this.abortReason = reason;
    this.log(`Context aborted: ${reason}`, 'warn');
  }
}

class SchemaValidator {
  static validate(schema, data, path = 'root') {
    if (!schema) return true;
    
    for (const [key, requirement] of Object.entries(schema)) {
      const value = data[key];
      const currentPath = `${path}.${key}`;

      if (requirement.required && (value === undefined || value === null)) {
        throw new NexusError(`Missing required field: ${currentPath}`, 'VALIDATION_ERROR', { path: currentPath });
      }

      if (value !== undefined && value !== null) {
        if (requirement.type) {
          const actualType = Array.isArray(value) ? 'array' : typeof value;
          if (actualType !== requirement.type) {
            throw new NexusError(`Type mismatch at ${currentPath}: expected ${requirement.type}, got ${actualType}`, 'TYPE_ERROR');
          }
        }

        if (requirement.type === 'object' && requirement.properties) {
          this.validate(requirement.properties, value, currentPath);
        }

        if (requirement.type === 'array' && requirement.items && Array.isArray(value)) {
          value.forEach((item, i) => {
            this.validate({ item: requirement.items }, { item }, `${currentPath}[${i}]`);
          });
        }

        if (requirement.enum && !requirement.enum.includes(value)) {
          throw new NexusError(`Value ${value} at ${currentPath} not in enum`, 'VALIDATION_ERROR');
        }

        if (requirement.regex && typeof value === 'string' && !requirement.regex.test(value)) {
           throw new NexusError(`Value at ${currentPath} fails pattern match`, 'VALIDATION_ERROR');
        }

        if (typeof requirement.validate === 'function' && !requirement.validate(value)) {
          throw new NexusError(`Custom validation failed: ${currentPath}`, 'VALIDATION_ERROR');
        }
      }
    }
    return true;
  }
}

class NexusRegistry {
  constructor() {
    this.actions = new Map();
    this.plugins = new Map();
    this.observers = [];
    this.services = new Map();
  }

  registerAction(action) {
    this.actions.set(action.name, action);
    this.notifyObservers('actionRegistered', { name: action.name });
  }

  registerService(name, service) {
    this.services.set(name, service);
    this.notifyObservers('serviceRegistered', { name });
  }

  getService(name) {
    return this.services.get(name);
  }

  registerPlugin(name, plugin) {
    if (this.plugins.has(name)) {
      throw new NexusError(`Plugin ${name} already registered`, 'REGISTRY_ERROR');
    }
    this.plugins.set(name, plugin);
    plugin.init(this);
    this.notifyObservers('pluginInitialized', { name });
  }

  subscribe(observer) {
    if (typeof observer.update !== 'function') {
      throw new NexusError('Observer requires update() method', 'REGISTRY_ERROR');
    }
    this.observers.push(observer);
  }

  notifyObservers(event, data) {
    this.observers.forEach(obs => {
      try {
        obs.update(event, data);
      } catch (e) {
        console.error(`Observer failure on event ${event}`, e);
      }
    });
  }

  getAction(name) {
    const action = this.actions.get(name);
    if (!action) throw new NexusError(`Action ${name} not found`, 'NOT_FOUND');
    return action;
  }
}