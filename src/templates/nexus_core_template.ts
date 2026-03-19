export const NEXUS_CORE_TEMPLATE = `
const Lane = {
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  IdleLane:            0b0100000000000000000000000000000,
};

const WorkPriority = {
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
};

const FiberFlags = {
  NoFlags:   0b0000000000000000,
  Placement: 0b0000000000000010,
  Update:    0b0000000000000100,
  Deletion:  0b0000000000001000,
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
};

class DiagnosticEmitter {
  #listeners = new Set();

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  emit(diagnostic, ...args) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(new RegExp(\`\\\\{\${i}\\\\}\`, 'g'), String(arg)));

    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted,
      id: Math.random().toString(36).substr(2, 9),
      args
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

class NexusObjectPool {
  #pool = [];
  #limit;
  #ctor;
  #name;
  #diagnostics;

  constructor(ctor, name, diagnostics, limit = 1000) {
    this.#ctor = ctor;
    this.#name = name;
    this.#diagnostics = diagnostics;
    this.#limit = limit;
  }

  acquire(...args) {
    if (this.#pool.length > 0) {
      const instance = this.#pool.pop();
      if (typeof instance.initialize === 'function') {
        instance.initialize(...args);
      } else {
        // Fallback if no initialize method
        Object.assign(instance, new this.#ctor(...args));
      }
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
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  }
}

function taskInterceptor(callback, host, task) {
  return (didTimeout) => {
    const start = performance.now();
    host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, \`Task:\${task.id}\`);
    try {
      const result = callback(didTimeout);
      const duration = performance.now() - start;
      if (duration > 10) {
        host.diagnostics.emit(DiagnosticMessages.METRIC_SUMMARY, task.id, duration.toFixed(2));
      }
      return result;
    } catch (error) {
      throw error;
    }
  };
}

class NexusScheduler {
  #taskQueue = new MinHeap();
  #isHostCallbackScheduled = false;
  #isPerformingWork = false;
  #yieldInterval = 5;
  #deadline = 0;

  constructor(host) {
    this.host = host;
  }

  scheduleCallback(priority, callback, options = {}) {
    const currentTime = performance.now();
    const timeout = this.#getTimeoutByPriority(priority);
    
    const newTask = {
      id: Math.random().toString(36).substr(2, 9),
      callback,
      priority,
      startTime: currentTime,
      expirationTime: currentTime + timeout,
      lane: options.lane || Lane.DefaultLane,
    };

    // Intercept the callback for telemetry
    newTask.callback = taskInterceptor(callback, this.host, newTask);

    this.#taskQueue.push(newTask);

    if (!this.#isHostCallbackScheduled && !this.#isPerformingWork) {
      this.#isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }

    return newTask;
  }

  #getTimeoutByPriority(priority) {
    switch (priority) {
      case WorkPriority.ImmediatePriority: return -1;
      case WorkPriority.UserBlockingPriority: return 250;
      case WorkPriority.NormalPriority: return 5000;
      case WorkPriority.LowPriority: return 10000;
      case WorkPriority.IdlePriority: return 1073741823;
      default: return 5000;
    }
  }

  #requestHostCallback() {
    setTimeout(() => this.#workLoop(), 0);
  }

  shouldYield() {
    return performance.now() >= this.#deadline;
  }

  #workLoop() {
    this.#isPerformingWork = true;
    this.#isHostCallbackScheduled = false;
    this.#deadline = performance.now() + this.#yieldInterval;

    try {
      while (this.#taskQueue.length > 0) {
        if (this.shouldYield()) {
          this.host.diagnostics.emit(DiagnosticMessages.SCHEDULER_YIELD, Math.round(performance.now() - (this.#deadline - this.#yieldInterval)));
          break;
        }

        const currentTask = this.#taskQueue.peek();
        const didUserCallbackTimeout = currentTask.expirationTime <= performance.now();
        const continuation = currentTask.callback(didUserCallbackTimeout);

        if (typeof continuation === 'function') {
          currentTask.callback = continuation;
        } else {
          if (this.#taskQueue.peek() === currentTask) {
            this.#taskQueue.pop();
          }
        }
      }

      if (this.#taskQueue.length > 0) {
        this.#isHostCallbackScheduled = true;
        this.#requestHostCallback();
      }
    } finally {
      this.#isPerformingWork = false;
    }
  }
}

class NexusFiber {
  constructor(name, action, priority, lane = Lane.DefaultLane) {
    this.initialize(name, action, priority, lane);
  }

  initialize(name, action, priority, lane = Lane.DefaultLane) {
    this.name = name;
    this.action = action;
    this.priority = priority;
    this.lanes = lane;
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.alternate = null;
    this.memoizedState = null;
    this.updateQueue = [];
    this.flags = FiberFlags.NoFlags;
    this.nextEffect = null;
    this.memoizedProps = {};
    this.pendingProps = {};
  }

  cleanup() {
    this.return = null;
    this.child = null;
    this.sibling = null;
    this.alternate = null;
    this.memoizedState = null;
    this.updateQueue = [];
    this.flags = FiberFlags.NoFlags;
    this.nextEffect = null;
  }
}

class NexusReconciler {
  #program;
  #workInProgress = null;
  #currentLanes = Lane.NoLanes;

  constructor(program) {
    this.#program = program;
  }

  receiveUpdate(lanes) {
    this.#currentLanes = LaneManager.mergeLanes(this.#currentLanes, lanes);
  }

  performWorkOnRoot(root, lanes) {
    this.#workInProgress = root;
    
    while (this.#workInProgress !== null && !this.#program.host.scheduler.shouldYield()) {
      this.#workInProgress = this.performUnitOfWork(this.#workInProgress);
    }

    if (this.#workInProgress === null) {
      this.commitRoot(root);
      return null;
    } else {
      return () => this.performWorkOnRoot(root, lanes);
    }
  }

  performUnitOfWork(unitOfWork) {
    const current = unitOfWork.alternate;
    let next = this.beginWork(current, unitOfWork, this.#currentLanes);
    
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    
    if (next === null) {
      next = this.completeUnitOfWork(unitOfWork);
    }
    
    return next;
  }

  beginWork(current, workInProgress, renderLanes) {
    this.#program.host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, \`BeginWork: \${workInProgress.name}\`);
    this.#program.prepare(workInProgress);

    if (typeof workInProgress.action === 'function') {
      try {
        const result = workInProgress.action(this.#program);
      } catch (e) {
        this.#program.host.diagnostics.emit(DiagnosticMessages.PHASE_TRANSITION_ERROR, "BeginWork", workInProgress.name, e.message);
        throw e;
      }
    }

    return workInProgress.child;
  }

  completeUnitOfWork(unitOfWork) {
    let completedWork = unitOfWork;
    
    do {
      const current = completedWork.alternate;
      const returnFiber = completedWork.return;

      this.completeWork(current, completedWork, this.#currentLanes);

      const sibling = completedWork.sibling;
      if (sibling !== null) {
        return sibling;
      }

      completedWork = returnFiber;
    } while (completedWork !== null);

    return null;
  }

  completeWork(current, workInProgress, renderLanes) {
    this.#program.host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, \`CompleteWork: \${workInProgress.name}\`);
  }

  commitRoot(root) {
    this.#program.host.diagnostics.emit(DiagnosticMessages.WORK_COMMIT, "Root", LaneManager.getHighestPriorityLane(this.#currentLanes));
    this.#commitFiber(root);
  }

  #commitFiber(fiber) {
    if (!fiber) return;
    
    if (fiber.alternate) {
      fiber.memoizedState = fiber.alternate.memoizedState;
      fiber.alternate = null;
    }

    this.#commitFiber(fiber.child);
    this.#commitFiber(fiber.sibling);
  }
}

class CancellationToken {
  #isCancelled = false;
  #listeners = new Set();

  get isCancellationRequested() { return this.#isCancelled; }

  cancel() {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#listeners.forEach(fn => { try { fn(); } catch (e) {} });
    this.#listeners.clear();
  }

  onCancellationRequested(fn) {
    if (this.#isCancelled) { fn(); return () => {}; }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  throwIfCancelled() {
    if (this.#isCancelled) {
      const error = new Error(DiagnosticMessages.PIPELINE_CANCELED.message);
      error.code = DiagnosticMessages.PIPELINE_CANCELED.code;
      throw error;
    }
  }
}

class Host {
  #config;
  #diagnostics = new DiagnosticEmitter();
  #scheduler;

  constructor(config = {}) {
    this.#config = config;
    this.#scheduler = new NexusScheduler(this);
    this.#diagnostics.subscribe(entry => this.#logToConsole(entry));
  }

  get scheduler() { return this.#scheduler; }
  get diagnostics() { return this.#diagnostics; }

  #logToConsole(entry) {
    const categories = Object.keys(DiagnosticCategory);
    const categoryName = categories[entry.category].toUpperCase();
    const logString = \`[Nexus] [\${entry.id}] [\${entry.code}] [\${categoryName}] \${entry.message}\`;
    
    if (entry.category === DiagnosticCategory.Error) console.error(logString);
    else if (entry.category === DiagnosticCategory.Warning) console.warn(logString);
    else if (this.#config.debug) console.log(logString);
  }
}

class NexusProgram {
  #host;
  #token;
  #results = {};
  #currentFiber = null;
  #hookIndex = 0;

  constructor(host, token) {
    this.#host = host;
    this.#token = token;
  }

  get host() { return this.#host; }
  get token() { return this.#token; }
  get results() { return this.#results; }
  
  prepare(fiber) {
    this.#currentFiber = fiber;
    this.#hookIndex = 0;
  }

  useState(initialValue) {
    const fiber = this.#currentFiber;
    if (!fiber.memoizedState) {
      fiber.memoizedState = [];
    }
    
    const index = this.#hookIndex++;
    if (fiber.memoizedState.length <= index) {
      fiber.memoizedState[index] = initialValue;
    }
    
    return [
      fiber.memoizedState[index],
      (newValue) => {
        fiber.memoizedState[index] = newValue;
      }
    ];
  }
}

class NexusCore {
  #host;
  #reconciler;
  #token;
  #status = 'IDLE';
  #rootFiber = null;
  #fiberPool;

  constructor(config = {}) {
    this.#host = new Host(config);
    const program = new NexusProgram(this.#host, new CancellationToken());
    this.#reconciler = new NexusReconciler(program);
    this.#token = new CancellationToken();
    this.#fiberPool = new NexusObjectPool(NexusFiber, "FiberPool", this.#host.diagnostics);
    this.#initializeRoot();
  }

  #initializeRoot() {
    this.#rootFiber = this.#fiberPool.acquire("ROOT", null, WorkPriority.NormalPriority, Lane.SyncLane);
    
    const setupFiber = this.#fiberPool.acquire("SETUP", (prog) => {
      prog.host.diagnostics.emit(DiagnosticMessages.BOOTSTRAP_START);
    }, WorkPriority.ImmediatePriority, Lane.SyncLane);
    
    this.#rootFiber.child = setupFiber;
    setupFiber.return = this.#rootFiber;
  }

  async start() {
    if (this.#status !== 'IDLE') return;
    this.#status = 'RUNNING';
    
    return new Promise((resolve, reject) => {
      this.#host.scheduler.scheduleCallback(WorkPriority.NormalPriority, () => {
        try {
          const continuation = this.#reconciler.performWorkOnRoot(this.#rootFiber, Lane.SyncLane);
          if (continuation === null) {
            this.#status = 'SUCCESS';
            this.#host.diagnostics.emit(DiagnosticMessages.SYSTEM_READY, "1.1.0", "NEXUS_CORE");
            resolve(true);
          }
          return continuation;
        } catch (e) {
          this.#status = 'FAULT';
          reject(e);
        }
      });
    });
  }

  abort() { this.#token.cancel(); }
}

export default NexusCore;
`;
