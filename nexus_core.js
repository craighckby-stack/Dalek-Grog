import { AsyncLocalStorage } from 'node:async_hooks';
import { EventEmitter } from 'node:events';
import crypto from 'node:crypto';
import { performance } from 'node:perf_hooks';

/**
 * NEXUS CORE - ARCHITECTURAL DNA: Google/Genkit + Evolution Engine
 * 
 * This module implements a high-performance, resilient execution core for autonomous systems.
 * It utilizes AsyncLocalStorage for context propagation, a middleware-driven action registry,
 * and a robust telemetry system with circuit-breaker integration.
 */

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

const ERROR_CATEGORIES = Object.freeze({
  INFRASTRUCTURE: 'INFRASTRUCTURE',
  VALIDATION: 'VALIDATION',
  TIMEOUT: 'TIMEOUT',
  CONCURRENCY: 'CONCURRENCY',
  SECURITY: 'SECURITY',
  LOGIC: 'LOGIC',
  EXTERNAL_SERVICE: 'EXTERNAL_SERVICE',
  CIRCUIT_BREAKER: 'CIRCUIT_BREAKER'
});

const EXECUTION_STRATEGIES = Object.freeze({
  SEQUENTIAL: 'SEQUENTIAL',
  PARALLEL: 'PARALLEL',
  RACE: 'RACE',
  FALLBACK: 'FALLBACK'
});

/**
 * Advanced Nexus Error with causal chaining and system-state snapshots.
 */
class NexusError extends Error {
  constructor(message, code, context = {}, options = {}) {
    super(message);
    const { 
      retryable = false, 
      retryAfter = 0, 
      category = ERROR_CATEGORIES.LOGIC, 
      severity = 'high', 
      cause = null 
    } = options;
    
    this.name = 'NexusError';
    this.code = code;
    this.category = category;
    this.severity = severity;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.timestamp = new Date().toISOString();
    this.id = crypto.randomUUID();
    this.cause = cause;
    
    this.context = {
      ...context,
      system: {
        arch: process.arch,
        platform: process.platform,
        version: process.version,
        memory: process.memoryUsage(),
        uptime: process.uptime(),
        pid: process.pid,
        cpuUsage: process.cpuUsage()
      }
    };
    
    this.stackTrace = this.stack ? this.stack.split('\n').map(line => line.trim()) : [];
    Object.seal(this);
  }

  static from(error, code = 'INTERNAL_ERROR', options = {}) {
    if (error instanceof NexusError) return error;
    return new NexusError(
      error.message,
      code,
      {
        originalName: error.name,
        originalMessage: error.message,
        stack: error.stack
      },
      { ...options, cause: error, category: options.category || ERROR_CATEGORIES.INFRASTRUCTURE }
    );
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      severity: this.severity,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      retryAfter: this.retryAfter,
      stack: this.stackTrace,
      cause: this.cause instanceof Error ? this.cause.message : this.cause
    };
  }
}

/**
 * Observer Pattern: Telemetry Engine with automated buffering and backpressure awareness.
 */
class NexusTelemetry extends EventEmitter {
  constructor(config = {}) {
    super();
    this.spans = new Map();
    this.exporters = [];
    this.samplingRate = config.samplingRate ?? 1.0;
    this.maxBufferSize = config.maxBufferSize ?? 1000;
    this.buffer = [];
    this.metrics = new Map();
    this.counters = new Map();
    this.lastFlush = Date.now();
    
    // Self-optimization: Periodic flush if buffer doesn't fill
    this.flushInterval = setInterval(() => this.flush(), 30000).unref();
  }

  addExporter(exporter) {
    if (typeof exporter?.export !== 'function') {
      throw new NexusError('Invalid Telemetry Exporter', 'TELEMETRY_ERROR', { exporter }, { category: ERROR_CATEGORIES.VALIDATION });
    }
    this.exporters.push(exporter);
    this.emit('exporterAdded', { type: exporter.constructor.name });
  }

  recordSpan(span) {
    if (this.samplingRate < 1.0 && Math.random() > this.samplingRate) return;

    const spanData = {
      ...span,
      recordedAt: new Date().toISOString(),
      version: '2.1.0-evolved'
    };

    this.spans.set(span.spanId, spanData);
    this.buffer.push(spanData);
    this.emit('spanRecorded', spanData);

    if (this.buffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  incrementCounter(name, value = 1, labels = {}) {
    const key = `${name}${JSON.stringify(labels)}`;
    const current = this.counters.get(key) || { value: 0, labels, firstSeen: Date.now() };
    current.value += value;
    current.lastUpdated = Date.now();
    this.counters.set(key, current);
    this.emit('metricUpdated', { name, ...current });
  }

  recordMetric(name, value, labels = {}) {
    if (!this.metrics.has(name)) this.metrics.set(name, []);
    const series = this.metrics.get(name);
    series.push({ value, timestamp: Date.now(), labels });
    
    // Performance: Circular buffer logic
    if (series.length > 1000) series.shift();
    this.emit('observation', { name, value, labels });
  }

  flush() {
    if (this.buffer.length === 0) return [];
    
    const data = [...this.buffer];
    this.buffer = [];
    this.lastFlush = Date.now();

    this.exporters.forEach(e => {
      try {
        e.export(data);
      } catch (err) {
        process.stderr.write(`[NexusTelemetry] Export Failed: ${err.message}\n`);
      }
    });

    this.emit('flushed', data.length);
    return data;
  }

  getTrace(correlationId) {
    return Array.from(this.spans.values())
      .filter(s => s.correlationId === correlationId)
      .sort((a, b) => new Date(a.recordedAt) - new Date(b.recordedAt));
  }

  shutdown() {
    clearInterval(this.flushInterval);
    return this.flush();
  }
}

const globalTelemetry = new NexusTelemetry();
const contextStorage = new AsyncLocalStorage();

/**
 * Execution Context: Manages state, logs, resources, and cancellation across async boundaries.
 */
class NexusContext {
  constructor(options = {}) {
    const { 
      correlationId = crypto.randomUUID(), 
      parent = null, 
      name = 'anonymous_op', 
      timeout = 0 
    } = options;
    
    this.correlationId = correlationId;
    this.parent = parent;
    this.name = name;
    this.startTime = performance.now();
    this.spanId = crypto.randomUUID().substring(0, 8);
    this.metadata = new Map(parent ? parent.metadata : []);
    this.attributes = new Map();
    this.breadcrumbs = parent ? [...parent.breadcrumbs, name] : [name];
    this.logs = [];
    this.children = [];
    this.resources = [];
    this.isAborted = false;
    this.abortReason = null;
    this.abortController = new AbortController();
    this.status = 'active';

    if (timeout > 0) {
      this.timer = setTimeout(() => {
        this.abort(`Context deadline exceeded (${timeout}ms)`);
      }, timeout).unref();
    }

    if (parent) parent.children.push(this);
  }

  static current() {
    return contextStorage.getStore();
  }

  /**
   * Decorator Pattern: Wraps a function in context-aware execution.
   */
  async run(fn) {
    return contextStorage.run(this, async () => {
      try {
        const result = await fn(this);
        this.status = 'completed';
        return result;
      } catch (error) {
        this.status = 'errored';
        const nErr = NexusError.from(error, 'CONTEXT_EXECUTION_FAILED', { name: this.name });
        this.log(`Execution error: ${nErr.message}`, 'error', { error: nErr.toJSON() });
        throw nErr;
      } finally {
        if (this.timer) clearTimeout(this.timer);
        await this.dispose();
      }
    });
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
      throw new NexusError('Cleanup must be a function', 'RESOURCE_ERROR', {}, { category: ERROR_CATEGORIES.VALIDATION });
    }
    this.resources.push(cleanupFn);
  }

  async dispose() {
    const results = await Promise.allSettled(
      this.resources.reverse().map(async (cleanup) => {
        try {
          return await cleanup();
        } catch (e) {
          this.log(`Resource cleanup failed: ${e.message}`, 'error');
          throw e;
        }
      })
    );
    this.serialize();
    return results;
  }

  createChild(name, options = {}) {
    return new NexusContext({
      correlationId: this.correlationId,
      parent: this,
      name,
      ...options
    });
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

    // Enhanced log distribution
    switch(level) {
      case 'error':
        console.error(formatted, data);
        globalTelemetry.incrementCounter('nexus_errors_total', 1, { path: entry.path, code: data.error?.code });
        break;
      case 'warn':
        console.warn(formatted, data);
        globalTelemetry.incrementCounter('nexus_warnings_total', 1, { path: entry.path });
        break;
      case 'debug':
        if (process.env.DEBUG || this.get('debug_mode')) console.debug(formatted, data);
        break;
      default:
        if (this.get('silent_mode')) break;
        console.log(formatted);
    }
  }

  serialize() {
    const serialized = {
      name: this.name,
      correlationId: this.correlationId,
      spanId: this.spanId,
      path: this.breadcrumbs,
      metadata: Object.fromEntries(this.metadata),
      attributes: Object.fromEntries(this.attributes),
      metrics: {
        duration: performance.now() - this.startTime,
        childCount: this.children.length,
        resourceCount: this.resources.length
      },
      status: this.status,
      logs: this.logs,
      isAborted: this.isAborted,
      abortReason: this.abortReason
    };
    globalTelemetry.recordSpan(serialized);
    return serialized;
  }

  abort(reason = 'Manual abort') {
    if (this.isAborted) return;
    this.isAborted = true;
    this.abortReason = reason;
    this.status = 'aborted';
    this.abortController.abort(reason);
    this.log(`Context aborted: ${reason}`, 'warn');
    
    // Propagate to children
    this.children.forEach(child => child.abort(`Parent aborted: ${reason}`));
  }
}

/**
 * Middleware Pipeline: Functional composition for action execution.
 */
class MiddlewarePipeline {
  constructor() {
    this.middlewares = [];
  }

  use(fn) {
    if (typeof fn !== 'function') throw new Error('Middleware must be a function');
    this.middlewares.push(fn);
    return this;
  }

  async execute(context, input, next) {
    let index = -1;
    const dispatch = async (i) => {
      if (i <= index) throw new Error('next() called multiple times');
      index = i;
      let fn = this.middlewares[i];
      if (i === this.middlewares.length) fn = next;
      if (!fn) return;
      try {
        return await fn(context, input, () => dispatch(i + 1));
      } catch (err) {
        throw NexusError.from(err, 'MIDDLEWARE_ERROR', { middlewareIndex: i });
      }
    };
    return dispatch(0);
  }
}

/**
 * Factory + Registry Pattern: Central hub for defining and executing system logic.
 * Inspired by Google Genkit Action Registry.
 */
class NexusRegistry {
  constructor() {
    this.actions = new Map();
    this.plugins = new Map();
    this.schemas = new Map();
    this.state = LIFECYCLE_STATES.UNINITIALIZED;
    this.events = new EventEmitter();
    this.globalMiddleware = new MiddlewarePipeline();
  }

  /**
   * Define a runnable action with metadata and local middleware.
   */
  defineAction(config, handler) {
    const { name, metadata = {}, middleware = [] } = config;
    
    if (this.actions.has(name)) {
      throw new NexusError(`Action ${name} already defined`, 'REGISTRY_CONFLICT');
    }

    const localPipeline = new MiddlewarePipeline();
    middleware.forEach(m => localPipeline.use(m));

    const actionFn = async (input, overrideCtx = null) => {
      const ctx = overrideCtx || NexusContext.current() || new NexusContext({ name: `action:${name}` });
      
      return ctx.run(async (currentCtx) => {
        currentCtx.log(`Invoking action: ${name}`, 'info', { input });
        
        // Execute through Global -> Local -> Handler pipeline
        return this.globalMiddleware.execute(currentCtx, input, async (c1, i1, n1) => {
          return localPipeline.execute(c1, i1, async (c2, i2) => {
            const start = performance.now();
            const result = await handler(i2, c2);
            globalTelemetry.recordMetric('action_duration', performance.now() - start, { action: name });
            return result;
          });
        });
      });
    };

    const actionMetadata = {
      name,
      handler: actionFn,
      config,
      registeredAt: new Date().toISOString()
    };

    this.actions.set(name, actionMetadata);
    this.events.emit('actionDefined', name);
    return actionFn;
  }

  use(middleware) {
    this.globalMiddleware.use(middleware);
    return this;
  }

  async registerPlugin(plugin) {
    const { name, init } = plugin;
    if (this.plugins.has(name)) return;
    
    try {
      await init(this);
      this.plugins.set(name, plugin);
      this.events.emit('pluginRegistered', name);
    } catch (err) {
      throw NexusError.from(err, 'PLUGIN_INIT_FAILED', { plugin: name });
    }
  }

  getAction(name) {
    const action = this.actions.get(name);
    if (!action) throw new NexusError(`Action ${name} not found`, 'NOT_FOUND');
    return action.handler;
  }
}

/**
 * Singleton Nexus Core Instance
 */
class NexusCore extends EventEmitter {
  constructor() {
    super();
    this.registry = new NexusRegistry();
    this.telemetry = globalTelemetry;
    this.state = LIFECYCLE_STATES.UNINITIALIZED;
  }

  async boot() {
    this.state = LIFECYCLE_STATES.BOOTING;
    this.emit('booting');
    
    // Standard middleware for telemetry
    this.registry.use(async (ctx, input, next) => {
      ctx.setAttribute('boot_id', this.bootId);
      return next();
    });

    this.bootId = crypto.randomBytes(4).toString('hex');
    this.state = LIFECYCLE_STATES.READY;
    this.emit('ready', { bootId: this.bootId });
    return this;
  }

  async shutdown() {
    this.state = LIFECYCLE_STATES.SHUTTING_DOWN;
    await this.telemetry.shutdown();
    this.state = LIFECYCLE_STATES.TERMINATING;
    this.emit('shutdown');
  }
}

const nexus = new NexusCore();

export {
  LIFECYCLE_STATES,
  ERROR_CATEGORIES,
  EXECUTION_STRATEGIES,
  NexusError,
  NexusTelemetry,
  NexusContext,
  NexusRegistry,
  NexusCore,
  globalTelemetry,
  nexus as default
};