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
};

class CancellationToken {
  #isCancelled = false;
  #reason = null;

  cancel(reason = "Operation cancelled") {
    this.#isCancelled = true;
    this.#reason = reason;
  }

  isCancellationRequested() {
    return this.#isCancelled;
  }

  throwIfCancelled() {
    if (this.#isCancelled) {
      const error = new Error(this.#reason);
      error.name = "OperationCanceledException";
      throw error;
    }
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
      try {
        listener(payload);
      } catch (e) {}
    }
  }

  getDiagnostics() {
    return [...this.#history];
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

  static pickArbitraryLane(lanes) {
    return 1 << (31 - Math.clz32(lanes));
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
  }

  initialize(id, tag, type, props) {
    this.id = id;
    this.tag = tag;
    this.type = type;
    this.props = props;
    this.flags = FiberFlags.NoFlags;
    this.lanes = Lane.NoLanes;
    this.childLanes = Lane.NoLanes;
    this.actualDuration = 0;
    this.actualStartTime = -1;
  }

  cleanup() {
    this.props = null;
    this.memoizedState = null;
    this.alternate = null;
    this.child = null;
    this.sibling = null;
    this.return = null;
    this.dependencies = null;
    this.updateQueue = null;
    this.flags = FiberFlags.NoFlags;
    this.lanes = Lane.NoLanes;
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
      this.#diagnostics.emit(DiagnosticMessages.FIBER_REUSE, this.#name);
      instance.initialize(...args);
      return instance;
    }
    this.#diagnostics.emit(DiagnosticMessages.POOL_EXHAUSTED, this.#name);
    return new this.#ctor(...args);
  }

  release(instance) {
    if (this.#pool.length < this.#limit) {
      if (typeof instance.cleanup === 'function') instance.cleanup();
      this.#pool.push(instance);
    }
  }
}

class MinHeap {
  #heap = [];

  push(node) {
    this.#heap.push(node);
    this.#siftUp(this.#heap.length - 1);
  }

  peek() {
    return this.#heap[0] || null;
  }

  pop() {
    if (this.#heap.length === 0) return null;
    const first = this.#heap[0];
    const last = this.#heap.pop();
    if (this.#heap.length > 0) {
      this.#heap[0] = last;
      this.#siftDown(0);
    }
    return first;
  }

  get length() { return this.#heap.length; }

  #siftUp(index) {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.#compare(this.#heap[index], this.#heap[parentIndex]) < 0) {
        this.#swap(index, parentIndex);
        index = parentIndex;
      } else break;
    }
  }

  #siftDown(index) {
    const length = this.#heap.length;
    while (true) {
      let smallest = index;
      const left = (index << 1) + 1;
      const right = (index << 1) + 2;
      if (left < length && this.#compare(this.#heap[left], this.#heap[smallest]) < 0) smallest = left;
      if (right < length && this.#compare(this.#heap[right], this.#heap[smallest]) < 0) smallest = right;
      if (smallest !== index) {
        this.#swap(index, smallest);
        index = smallest;
      } else break;
    }
  }

  #swap(i, j) {
    const temp = this.#heap[i];
    this.#heap[i] = this.#heap[j];
    this.#heap[j] = temp;
  }

  #compare(a, b) {
    const diff = a.expirationTime - b.expirationTime;
    return diff !== 0 ? diff : (a.id < b.id ? -1 : (a.id > b.id ? 1 : 0));
  }
}

class NexusPipeline {
  #host;
  #phases = [];
  #currentPhaseIndex = -1;

  constructor(host) {
    this.#host = host;
  }

  addPhase(name, executionLogic) {
    this.#phases.push({ name, execute: executionLogic });
    return this;
  }

  async run(rootFiber) {
    this.#host.diagnostics.emit(DiagnosticMessages.BOOTSTRAP_START);
    
    for (let i = 0; i < this.#phases.length; i++) {
      const phase = this.#phases[i];
      this.#currentPhaseIndex = i;
      this.#host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, phase.name);

      try {
        this.#host.cancellationToken.throwIfCancelled();
        await phase.execute(rootFiber, this.#host);
      } catch (error) {
        if (error.name === "OperationCanceledException") {
          this.#host.diagnostics.emit(DiagnosticMessages.PIPELINE_CANCELED);
          break;
        }
        const prevPhase = i > 0 ? this.#phases[i-1].name : "START";
        this.#host.diagnostics.emit(DiagnosticMessages.PHASE_TRANSITION_ERROR, prevPhase, phase.name, error.message);
        throw error;
      }
    }
  }
}