const LIFECYCLE_STATES = Object.freeze({
  UNINITIALIZED: 'UNINITIALIZED',
  BOOTING: 'BOOTING',
  READY: 'READY',
  SUSPENDED: 'SUSPENDED',
  TERMINATING: 'TERMINATING',
  FAILED: 'FAILED',
  MAINTENANCE: 'MAINTENANCE',
  DEGRADED: 'DEGRADED'
});

class NexusError extends Error {
  constructor(message, code, context = {}) {
    super(message);
    this.name = 'NexusError';
    this.code = code;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

class NexusContext {
  constructor(correlationId = crypto.randomUUID(), parent = null) {
    this.correlationId = correlationId;
    this.parent = parent;
    this.startTime = performance.now();
    this.metadata = new Map(parent ? parent.metadata : []);
    this.logs = [];
    this.spanId = crypto.randomUUID().substring(0, 8);
    this.breadcrumbs = parent ? [...parent.breadcrumbs] : [];
    this.isAborted = false;
  }

  set(key, value) {
    this.metadata.set(key, value);
    return this;
  }

  get(key) {
    return this.metadata.get(key);
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
      ...data
    };
    this.logs.push(entry);
    
    const formatted = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.correlationId}:${entry.spanId}] [${entry.path}] ${message}`;
    if (level === 'error') console.error(formatted, data); 
    else if (level === 'warn') console.warn(formatted, data);
    else console.log(formatted);
  }

  getDuration() {
    return performance.now() - this.startTime;
  }

  serialize() {
    return {
      correlationId: this.correlationId,
      metadata: Object.fromEntries(this.metadata),
      spanId: this.spanId,
      path: this.breadcrumbs
    };
  }

  abort() {
    this.isAborted = true;
    this.log('Context execution aborted', 'warn');
  }
}

class SchemaValidator {
  static validate(schema, data) {
    if (!schema) return true;
    for (const [key, requirement] of Object.entries(schema)) {
      if (requirement.required && (data[key] === undefined || data[key] === null)) {
        throw new NexusError(`Missing required field: ${key}`, 'VALIDATION_ERROR');
      }
      if (requirement.type && typeof data[key] !== requirement.type) {
        throw new NexusError(`Invalid type for ${key}: expected ${requirement.type}`, 'TYPE_ERROR');
      }
    }
    return true;
  }
}

class AbstractAction {
  constructor(name, config = {}) {
    this.name = name;
    this.config = {
      inputSchema: null,
      outputSchema: null,
      maxRetries: 0,
      retryDelay: 100,
      ...config
    };
    this.middlewares = [];
    this.interceptors = {
      before: [],
      after: [],
      onError: []
    };
  }

  use(middleware) {
    if (typeof middleware !== 'function') throw new Error('Middleware must be a function');
    this.middlewares.push(middleware);
    return this;
  }

  addInterceptor(phase, fn) {
    if (this.interceptors[phase]) {
      this.interceptors[phase].push(fn);
    }
    return this;
  }

  async execute(input, context) {
    const executionCtx = context ? context.createChild(this.name) : new NexusContext();
    executionCtx.log(`Starting execution: ${this.name}`, 'debug');

    try {
      SchemaValidator.validate(this.config.inputSchema, input);

      for (const interceptor of this.interceptors.before) {
        input = await interceptor(input, executionCtx) || input;
      }

      const pipeline = [...this.middlewares, this.run.bind(this)];
      let index = 0;

      const next = async (currentInput) => {
        if (executionCtx.isAborted) throw new NexusError('Execution aborted', 'ABORTED');
        if (index < pipeline.length) {
          const fn = pipeline[index++];
          return await fn(currentInput, executionCtx, next);
        }
        return currentInput;
      };

      let result = await this._executeWithRetry(input, executionCtx, next);

      SchemaValidator.validate(this.config.outputSchema, result);

      for (const interceptor of this.interceptors.after) {
        result = await interceptor(result, executionCtx) || result;
      }

      executionCtx.log(`Action ${this.name} completed successfully`, 'info', { duration: executionCtx.getDuration().toFixed(2) });
      return result;
    } catch (error) {
      executionCtx.log(`Action ${this.name} failed: ${error.message}`, 'error', { errorCode: error.code });
      for (const interceptor of this.interceptors.onError) {
        await interceptor(error, executionCtx);
      }
      throw error;
    }
  }

  async _executeWithRetry(input, context, nextFn) {
    let attempts = 0;
    while (attempts <= this.config.maxRetries) {
      try {
        return await nextFn(input);
      } catch (err) {
        attempts++;
        if (attempts > this.config.maxRetries) throw err;
        const delay = this.config.retryDelay * Math.pow(2, attempts - 1);
        context.log(`Retrying action ${this.name} (Attempt ${attempts}/${this.config.maxRetries}) after ${delay}ms`, 'warn');
        await new Promise(r => setTimeout(r, delay));
      }
    }
  }

  async run(input, context) {
    throw new Error(`Method "run" not implemented for action: ${this.name}`);
  }
}

class StrategyModule extends AbstractAction {
  async run(event, context) {
    context.log(`Processing strategy module payload: ${this.name}`);
    return {
      status: 'processed',
      module: this.name,
      payload: event,
      processedAt: Date.now()
    };
  }
}

const withTelemetry = (action) => {
  action.addInterceptor('before', async (input, ctx) => {
    ctx.set('telemetry_start', performance.now());
  });

  action.addInterceptor('after', async (result, ctx) => {
    const start = ctx.get('telemetry_start');
    const duration = performance.now() - start;
    ctx.log(`[TELEMETRY_END] ${action.name}`, 'info', { 
      duration_ms: duration.toFixed(3),
      memory_usage: process.memoryUsage ? process.memoryUsage().heapUsed : 'N/A'
    });
  });

  return action;
};

class EventBridge {
  constructor() {
    this.handlers = new Map();
    this.history = [];
    this.maxHistory = 1000;
    this.deadLetterQueue = [];
    this.retryConfig = { attempts: 3, backoff: 100 };
  }

  subscribe(topic, handler, options = { priority: 0 }) {
    if (!this.handlers.has(topic)) {
      this.handlers.set(topic, []);
    }
    const subscribers = this.handlers.get(topic);
    subscribers.push({ handler, priority: options.priority });
    subscribers.sort((a, b) => b.priority - a.priority);

    return () => this.unsubscribe(topic, handler);
  }

  unsubscribe(topic, handler) {
    if (this.handlers.has(topic)) {
      const filtered = this.handlers.get(topic).filter(sub => sub.handler !== handler);
      this.handlers.set(topic, filtered);
    }
  }

  async publish(topic, payload, context) {
    const publishCtx = context ? context.createChild(`Bridge:${topic}`) : new NexusContext();
    
    this.history.push({ topic, timestamp: Date.now(), id: crypto.randomUUID() });
    if (this.history.length > this.maxHistory) this.history.shift();

    const subscribers = this.handlers.get(topic) || [];
    return Promise.all(subscribers.map(sub => sub.handler(payload, publishCtx)));
  }
}