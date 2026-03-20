/**
 * Fiber-based reconciliation engine using bitmask priority lanes and multi-phase diagnostics.
 */

const Lane = {
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  RetryLane:           0b0000000100000000000000000000000,
  SelectiveLane:       0b0000001000000000000000000000000,
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
  ContentReset:    0b0000000000010000,
  Callback:        0b0000000000100000,
  Ref:             0b0000000001000000,
  Snapshot:        0b0000000010000000,
  Passive:         0b0000000100000000,
  Incomplete:      0b0000001000000000,
  ShouldCapture:   0b0000010000000000,
  ForceUpdate:     0b0000100000000000,
  Inferred:        0b0001000000000000,
  Synthesized:     0b0010000000000000,
  Hydrating:       0b0100000000000000,
  Visibility:      0b1000000000000000,
};

const SyntaxKind = {
  HostRoot: 0,
  FunctionComponent: 1,
  ClassComponent: 2,
  HostComponent: 3,
  HostText: 4,
  Fragment: 5,
  ContextConsumer: 6,
  ContextProvider: 7,
  ForwardRef: 8,
  Profiler: 9,
  SuspenseComponent: 10,
  MemoComponent: 11,
  SimpleMemoComponent: 12,
  LazyComponent: 13,
  Portal: 14,
  Scope: 15,
};

const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4,
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
  FIBER_REUSE: { code: 9002, category: DiagnosticCategory.Telemetry, message: "Fiber recycled from pool: {0}" },
  CIRCULAR_DEPENDENCY: { code: 9003, category: DiagnosticCategory.Error, message: "Circular dependency detected at Fiber: {0}" },
  SCHEDULER_OVERLOAD: { code: 9004, category: DiagnosticCategory.Warning, message: "Task queue depth exceeded threshold ({0}). High latency expected." },
  HOST_IO_ERROR: { code: 9005, category: DiagnosticCategory.Error, message: "Host environment I/O error: {0}" },
  SYMBOL_NOT_FOUND: { code: 9006, category: DiagnosticCategory.Error, message: "Symbol '{0}' could not be resolved in the current scope." },
};

class CancellationToken {
  #isCancelled = false;
  #reason = null;
  #parentToken = null;

  constructor(parentToken = null) {
    this.#parentToken = parentToken;
  }

  cancel(reason = "Operation cancelled") {
    this.#isCancelled = true;
    this.#reason = reason;
  }

  isCancellationRequested() {
    return this.#isCancelled || (this.#parentToken?.isCancellationRequested() ?? false);
  }

  throwIfCancelled() {
    if (this.isCancellationRequested()) {
      const error = new Error(this.#reason || "OperationCanceledException");
      error.name = "OperationCanceledException";
      throw error;
    }
  }

  static None = new (class extends CancellationToken {
    isCancellationRequested() { return false; }
    cancel() {}
  })();
}

class NexusSymbolTable {
  #symbols = new Map();
  #parent = null;

  constructor(parent = null) {
    this.#parent = parent;
  }

  declare(name, fiber) {
    if (this.#symbols.has(name)) return false;
    this.#symbols.set(name, fiber);
    return true;
  }

  resolve(name) {
    if (this.#symbols.has(name)) return this.#symbols.get(name);
    return this.#parent ? this.#parent.resolve(name) : null;
  }

  clear() {
    this.#symbols.clear();
  }
}

class DiagnosticEmitter {
  #listeners = new Set();
  #history = [];

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  emit(diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => {
      formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg));
    });

    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted,
      id: Math.random().toString(36).substring(2, 11),
      args,
      relatedInformation: []
    };

    this.#history.push(payload);
    if (this.#history.length > 1000) this.#history.shift();

    for (const listener of this.#listeners) {
      try { listener(payload); } catch (e) {}
    }
  }

  chainRelated(parentDiagnostic, relatedMessage, ...args) {
    parentDiagnostic.relatedInformation.push({ message: relatedMessage, args });
  }

  getDiagnostics() { return [...this.#history]; }
  clear() { this.#history = []; }
}

class LaneManager {
  static getHighestPriorityLane(lanes) { return lanes & -lanes; }
  static includesLane(set, subset) { return (set & subset) !== Lane.NoLanes; }
  static mergeLanes(a, b) { return a | b; }
  static removeLanes(set, subset) { return set & ~subset; }
  static isSyncLane(lanes) { return (lanes & Lane.SyncLane) !== Lane.NoLanes; }
  static pickArbitraryLane(lanes) { return 1 << (31 - Math.clz32(lanes)); }

  static getExpirationTime(lane, currentTime) {
    switch (lane) {
      case Lane.SyncLane: return currentTime + 500;
      case Lane.InputContinuousLane: return currentTime + 1000;
      case Lane.DefaultLane: return currentTime + 5000;
      case Lane.IdleLane: return currentTime + 10000;
      default: return currentTime + 5000;
    }
  }
}

class NexusFiber {
  constructor(id, tag, type, props) {
    this.initialize(id, tag, type, props);
    this.alternate = null;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.memoizedState = null;
    this.dependencies = null;
    this.updateQueue = null;
    this.stateNode = null;
    this.symbolTable = new NexusSymbolTable();
    this.scopeDepth = 0;
  }

  initialize(id, tag, type, props) {
    this.id = id;
    this.tag = tag;
    this.type = type;
    this.pendingProps = props;
    this.memoizedProps = null;
    this.flags = FiberFlags.NoFlags;
    this.lanes = Lane.NoLanes;
    this.childLanes = Lane.NoLanes;
    this.actualDuration = 0;
    this.actualStartTime = -1;
    this.treeBaseDuration = 0;
    this.deletions = null;
    this.index = 0;
    this.key = id;
  }

  cleanup() {
    this.pendingProps = null;
    this.memoizedProps = null;
    this.memoizedState = null;
    this.alternate = null;
    this.child = null;
    this.sibling = null;
    this.return = null;
    this.dependencies = null;
    this.updateQueue = null;
    this.stateNode = null;
    this.flags = FiberFlags.NoFlags;
    this.lanes = Lane.NoLanes;
    this.childLanes = Lane.NoLanes;
    this.deletions = null;
    this.symbolTable.clear();
  }
}

class NexusObjectPool {
  #pool = [];
  #limit;
  #ctor;
  #name;
  #diagnostics;

  constructor(ctor, name, diagnostics, limit = 10000) {
    this.#ctor = ctor;
    this.#name = name;
    this.#diagnostics = diagnostics;
    this.#limit = limit;
  }

  acquire(...args) {
    if (this.#pool.length > 0) {
      const instance = this.#pool.pop();
      if (instance.initialize) instance.initialize(...args);
      this.#diagnostics.emit(DiagnosticMessages.FIBER_REUSE, this.#name);
      return instance;
    }
    return new this.#ctor(...args);
  }

  release(instance) {
    if (this.#pool.length < this.#limit) {
      if (instance.cleanup) instance.cleanup();
      this.#pool.push(instance);
    } else {
      this.#diagnostics.emit(DiagnosticMessages.POOL_EXHAUSTED, this.#name);
    }
  }
}