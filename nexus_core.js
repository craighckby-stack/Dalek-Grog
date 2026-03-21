const Lane = {
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  RetryLanes:          0b0000111100000000000000000000000,
  SelectiveLane:       0b0011000000000000000000000000000,
  IdleLane:            0b0100000000000000000000000000000,
  OffscreenLane:       0b1000000000000000000000000000000,
};

const WorkPriority = {
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
};

const FiberFlags = {
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
};

const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4,
  Trace: 5,
};

const DiagnosticMessages = {
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
};

class NexusSchema {
  static validate(schema, data) {
    if (!schema) return data;
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
      }
    }
    if (errors.length > 0) throw new Error(`Schema Validation Failed: ${errors.join(', ')}`);
    return data;
  }
}

class DiagnosticEmitter {
  #listeners = new Set();
  #activeSpans = new Map();

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  startSpan(name, metadata = {}) {
    const spanId = Math.random().toString(36).substr(2, 9);
    const startTime = performance.now();
    this.#activeSpans.set(spanId, { name, startTime, metadata });
    this.emit(DiagnosticMessages.TRACE_SPAN_START, name);
    return spanId;
  }

  endSpan(spanId) {
    const span = this.#activeSpans.get(spanId);
    if (!span) return;
    const duration = performance.now() - span.startTime;
    this.emit(DiagnosticMessages.TRACE_SPAN_END, span.name, duration.toFixed(4));
    this.#activeSpans.delete(spanId);
    return duration;
  }

  emit(diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg)));

    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted,
      id: Math.random().toString(36).substr(2, 9),
      args,
      traceId: Array.from(this.#activeSpans.keys()).pop() || null
    };
    this.#listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (e) {}
    });
  }
}

class LaneManager {
  static getHighestPriorityLane(lanes) {
    return lanes & -lanes;
  }
  static includesLane(set, subset) {
    return (set & subset) !== Lane.NoLanes;
  }
  static mergeLanes(a, b) {
    return a | b;
  }
  static removeLanes(set, subset) {
    return set & ~subset;
  }
  static isSyncLane(lanes) {
    return (lanes & Lane.SyncLane) !== Lane.NoLanes;
  }
}

class NexusInterceptor {
  constructor({ name, before = null, after = null, onError = null }) {
    this.name = name;
    this.before = before;
    this.after = after;
    this.onError = onError;
  }
}

class NexusAction {
  constructor(name, logic, options = {}) {
    this.name = name;
    this.logic = logic;
    this.inputSchema = options.inputSchema || null;
    this.outputSchema = options.outputSchema || null;
    this.interceptors = options.interceptors || [];
    this.metadata = options.metadata || {};
  }

  async execute(context, input) {
    const diagnostics = context.host.diagnostics;
    const spanId = diagnostics.startSpan(`Action:${this.name}`);
    let currentInput = input;

    try {
      for (const interceptor of this.interceptors) {
        if (interceptor.before) {
          currentInput = await interceptor.before(context, currentInput) || currentInput;
        }
      }

      const validatedInput = NexusSchema.validate(this.inputSchema, currentInput);
      let result = await this.logic(context, validatedInput);
      let validatedOutput = NexusSchema.validate(this.outputSchema, result);

      for (const interceptor of [...this.interceptors].reverse()) {
        if (interceptor.after) {
          validatedOutput = await interceptor.after(context, validatedOutput) || validatedOutput;
        }
      }

      return validatedOutput;
    } catch (error) {
      diagnostics.emit(DiagnosticMessages.PHASE_TRANSITION_ERROR, "ActionExecution", this.name, error.message);
      for (const interceptor of this.interceptors) {
        if (interceptor.onError) {
          await interceptor.onError(context, error);
        }
      }
      throw error;
    } finally {
      diagnostics.endSpan(spanId);
    }
  }
}

class NexusFlow {
  constructor(name, actions = [], options = {}) {
    this.name = name;
    this.actions = actions;
    this.options = options;
  }

  async run(context, initialInput) {
    const startTime = performance.now();
    const diagnostics = context.host.diagnostics;
    const flowSpan = diagnostics.startSpan(`Flow:${this.name}`);
    let state = initialInput;

    try {
      for (const action of this.actions) {
        state = await action.execute(context, state);
      }
      const duration = performance.now() - startTime;
      diagnostics.emit(DiagnosticMessages.FLOW_EXECUTION_COMPLETE, this.name, duration.toFixed(2));
      return state;
    } finally {
      diagnostics.endSpan(flowSpan);
    }
  }
}