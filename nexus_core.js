const Lane = Object.freeze({
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  RetryLanes:          0b0000111100000000000000000000000,
  SelectiveLane:       0b0011000000000000000000000000000,
  IdleLane:            0b0100000000000000000000000000000,
  OffscreenLane:       0b1000000000000000000000000000000,
});

const WorkPriority = Object.freeze({
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
});

const FiberFlags = Object.freeze({
  NoFlags:         0b0000000000000000,
  Placement:       0b0000000000000010,
  Update:          0b0000000000000100,
  Deletion:        0b0000000000001000,
  Ref:             0b0000000000010000,
  Snapshot:        0b0000000000100000,
  Passive:         0b0000000001000000,
  Hydrating:       0b0000000010000000,
  Visibility:      0b0000000100000000,
  Incomplete:      0b0000100000000000,
  ShouldCapture:   0b0001000000000000,
  ForceUpdate:     0b0010000000000000,
  Concurrent:      0b0100000000000000,
  Static:          0b1000000000000000,
  LifecycleMask:   0b1111111111111110,
});

const InternalStateFlags = Object.freeze({
  None: 0,
  Initialized: 1 << 0,
  Running: 1 << 1,
  Paused: 1 << 2,
  Disposed: 1 << 3,
  Errored: 1 << 4,
  Stale: 1 << 5,
});

const DiagnosticCategory = Object.freeze({
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4,
  Trace: 5,
});

const DiagnosticMessages = Object.freeze({
  PHASE_ENTER: { code: 1000, category: DiagnosticCategory.Message, message: "Entering phase: {0}" },
  BOOTSTRAP_START: { code: 1001, category: DiagnosticCategory.Message, message: "Bootstrap sequence initiated." },
  CONFIG_VALIDATION_FAILED: { code: 2001, category: DiagnosticCategory.Error, message: "Configuration audit failed: Missing property '{0}'" },
  PIPELINE_CANCELED: { code: 3001, category: DiagnosticCategory.Warning, message: "Pipeline execution preempted via CancellationToken." },
  PHASE_TRANSITION_ERROR: { code: 4001, category: DiagnosticCategory.Error, message: "Phase transition error from {0} to {1}: {2}" },
  SYSTEM_READY: { code: 5001, category: DiagnosticCategory.Message, message: "System ready. Version: {0}. Path: {1}" },
  METRIC_SUMMARY: { code: 6001, category: DiagnosticCategory.Suggestion, message: "Unit '{0}' processed in {1}ms." },
  SCHEDULER_YIELD: { code: 7001, category: DiagnosticCategory.Telemetry, message: "Scheduler yielding control. Execution time: {0}ms" },
  WORK_COMMIT: { code: 8001, category: DiagnosticCategory.Message, message: "Work root committed. Total units: {0}. Lanes: {1}" },
  POOL_EXHAUSTED: { code: 9001, category: DiagnosticCategory.Warning, message: "Object pool '{0}' exhausted. Allocating new instance." },
  TRACE_SPAN_START: { code: 10001, category: DiagnosticCategory.Trace, message: "[SPAN START] {0}" },
  TRACE_SPAN_END: { code: 10002, category: DiagnosticCategory.Trace, message: "[SPAN END] {0} duration={1}ms" },
  INTERCEPTOR_FAULT: { code: 11001, category: DiagnosticCategory.Error, message: "Interceptor '{0}' failed during execution: {1}" },
  FLOW_EXECUTION_COMPLETE: { code: 12001, category: DiagnosticCategory.Message, message: "Flow '{0}' execution finished in {1}ms" },
  SCHEMA_TYPE_MISMATCH: { code: 13001, category: DiagnosticCategory.Error, message: "Type mismatch for {0}: expected {1}, got {2}" },
  SCHEDULER_OVERLOAD: { code: 14001, category: DiagnosticCategory.Warning, message: "Scheduler overload detected. Backpressure applied to lane {0}." },
});

class NexusCancellationToken {
  #isCancelled = false;
  #reason = null;
  #listeners = new Set();
  #controller = new AbortController();

  cancel(reason = "Operation cancelled") {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#reason = reason;
    this.#controller.abort(reason);
    this.#listeners.forEach(fn => {
      try { fn(reason); } catch (e) { }
    });
    this.#listeners.clear();
  }

  onCancellation(fn) {
    if (this.#isCancelled) {
      fn(this.#reason);
      return () => {};
    }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.#isCancelled) {
      const err = new Error(`CancellationRequested: ${this.#reason}`);
      err.name = "CanceledError";
      throw err;
    }
  }

  get isCancelled() { return this.#isCancelled; }
  get reason() { return this.#reason; }
  get signal() { return this.#controller.signal; }

  static link(parentToken) {
    const child = new NexusCancellationToken();
    parentToken.onCancellation((r) => child.cancel(r));
    return child;
  }

  static timeout(ms) {
    const token = new NexusCancellationToken();
    const timer = setTimeout(() => token.cancel(`Timeout of ${ms}ms exceeded`), ms);
    token.onCancellation(() => clearTimeout(timer));
    return token;
  }
}

class NexusSchema {
  static validate(schema, data) {
    if (!schema) return data;
    if (data === null || typeof data !== 'object') {
      throw new Error("Validation target must be a non-null object.");
    }

    const errors = [];
    const validatedData = Array.isArray(data) ? [] : {};

    for (const key in schema) {
      const req = schema[key];
      let val = data[key];

      if ((val === undefined || val === null) && req.default !== undefined) {
        val = typeof req.default === 'function' ? req.default() : req.default;
      }

      if (req.required && (val === undefined || val === null)) {
        errors.push(`Missing required property: ${key}`);
        continue;
      }

      if (val !== undefined && val !== null) {
        if (req.type) {
          const actualType = Array.isArray(val) ? 'array' : typeof val;
          if (actualType !== req.type) {
            if (req.coerce) {
              val = this.#coerce(val, req.type);
            } else {
              errors.push(`Type mismatch for ${key}: expected ${req.type}, got ${actualType}`);
            }
          }
        }

        if (typeof req.validator === 'function') {
          try {
            if (!req.validator(val)) errors.push(`Custom validation failed for: ${key}`);
          } catch (e) {
            errors.push(`Validator exception for ${key}: ${e.message}`);
          }
        }

        if (req.schema && typeof val === 'object') {
          try {
            val = this.validate(req.schema, val);
          } catch (e) {
            errors.push(`Nested validation failed for ${key}: ${e.message}`);
          }
        }
      }
      validatedData[key] = val;
    }

    if (errors.length > 0) {
      const err = new Error(`Schema Validation Failed: ${errors.join(', ')}`);
      err.details = errors;
      throw err;
    }
    return validatedData;
  }

  static #coerce(value, type) {
    switch (type) {
      case 'string': return String(value);
      case 'number': return Number(value);
      case 'boolean': return Boolean(value);
      case 'date': return new Date(value);
      default: return value;
    }
  }

  static define(definition) {
    return Object.freeze(definition);
  }
}

class NexusTelemetry {
  #listeners = new Set();
  #activeSpans = new Map();
  #history = [];
  #maxHistory = 5000;

  constructor() {
    this.id = `telemetry_${Math.random().toString(36).substring(2, 11)}`;
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  startSpan(name, metadata = {}) {
    const spanId = `span_${Math.random().toString(36).substring(2, 11)}`;
    const parentId = Array.from(this.#activeSpans.keys()).pop() || null;
    const span = {
      id: spanId,
      parentId,
      name,
      startTime: performance.now(),
      metadata: { ...metadata },
      attributes: new Map()
    };
    this.#activeSpans.set(spanId, span);
    this.#emit(DiagnosticMessages.TRACE_SPAN_START, [name]);
    return spanId;
  }

  endSpan(spanId, finalMetadata = {}) {
    const span = this.#activeSpans.get(spanId);
    if (!span) return;
    span.endTime = performance.now();
    span.duration = span.endTime - span.startTime;
    Object.assign(span.metadata, finalMetadata);
    this.#history.push(span);
    if (this.#history.length > this.#maxHistory) this.#history.shift();
    this.#activeSpans.delete(spanId);
    this.#emit(DiagnosticMessages.TRACE_SPAN_END, [span.name, span.duration.toFixed(2)]);
    return span;
  }

  #emit(template, args) {
    const message = template.message.replace(/{(\d+)}/g, (match, i) => args[i] !== undefined ? args[i] : match);
    const event = {
      code: template.code,
      category: template.category,
      message,
      timestamp: Date.now(),
      telemetryId: this.id
    };
    this.#listeners.forEach(fn => fn(event));
  }

  getHistory() { return [...this.#history]; }
}

class NexusObjectPool {
  #factory;
  #pool = [];
  #maxSize;
  #name;
  #telemetry;

  constructor(name, factory, maxSize = 100, telemetry = null) {
    this.#name = name;
    this.#factory = factory;
    this.#maxSize = maxSize;
    this.#telemetry = telemetry;
  }

  acquire(...args) {
    if (this.#pool.length > 0) {
      return this.#pool.pop();
    }
    return this.#factory(...args);
  }

  release(instance) {
    if (this.#pool.length < this.#maxSize) {
      this.#pool.push(instance);
    }
  }
}