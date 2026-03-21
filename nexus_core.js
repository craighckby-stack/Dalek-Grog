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
      try { fn(reason); } catch (e) {}
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
}

class NexusSchema {
  static validate(schema, data) {
    if (!schema) return data;
    if (!data || typeof data !== 'object') {
      throw new Error("Validation target must be an object.");
    }

    const errors = [];
    for (const [key, requirement] of Object.entries(schema)) {
      const value = data[key];
      
      if (requirement.required && (value === undefined || value === null)) {
        errors.push(`Missing required property: ${key}`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (requirement.type && typeof value !== requirement.type) {
          errors.push(`Type mismatch for ${key}: expected ${requirement.type}, got ${typeof value}`);
        }
        if (requirement.validator && !requirement.validator(value)) {
          errors.push(`Custom validation failed for property: ${key}`);
        }
        if (requirement.schema && typeof value === 'object') {
          try {
            this.validate(requirement.schema, value);
          } catch (e) {
            errors.push(`Nested validation failed for ${key}: ${e.message}`);
          }
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Schema Validation Failed: ${errors.join(', ')}`);
    }
    return data;
  }
}

class DiagnosticEmitter {
  #listeners = new Set();
  #activeSpans = new Map();
  #history = [];
  #maxHistory = 1000;

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  startSpan(name, metadata = {}) {
    const spanId = `span_${Math.random().toString(36).substring(2, 11)}`;
    const span = { 
      name, 
      startTime: performance.now(), 
      metadata, 
      id: spanId, 
      parentSpanId: Array.from(this.#activeSpans.keys()).pop() || null
    };
    this.#activeSpans.set(spanId, span);
    this.emit(DiagnosticMessages.TRACE_SPAN_START, name);
    return spanId;
  }

  endSpan(spanId) {
    const span = this.#activeSpans.get(spanId);
    if (!span) return 0;
    const duration = performance.now() - span.startTime;
    this.emit(DiagnosticMessages.TRACE_SPAN_END, span.name, duration.toFixed(4));
    this.#activeSpans.delete(spanId);
    return duration;
  }

  emit(diagnostic, ...args) {
    let message = diagnostic.message;
    args.forEach((arg, i) => {
      message = message.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg));
    });

    const payload = {
      timestamp: Date.now(),
      perfMark: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message,
      id: `diag_${Math.random().toString(36).substring(2, 11)}`,
      args,
      traceId: Array.from(this.#activeSpans.keys()).pop() || null
    };

    this.#history.push(payload);
    if (this.#history.length > this.#maxHistory) this.#history.shift();
    
    this.#listeners.forEach(fn => {
      try { fn(payload); } catch (e) {}
    });
  }

  getHistory() { return [...this.#history]; }
  getActiveSpans() { return new Map(this.#activeSpans); }
}

class LaneManager {
  static getHighestPriorityLane(lanes) { return lanes & -lanes; }
  static includesLane(set, subset) { return (set & subset) === subset; }
  static mergeLanes(a, b) { return a | b; }
  static removeLanes(set, subset) { return set & ~subset; }
}