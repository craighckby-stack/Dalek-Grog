/**
 * NEXUS_CORE v1.1.0: The Nervous System
 * Provides the base event-driven architecture for the Dalek Caan system.
 * Incorporates high-performance reconciliation, fiber-based scheduling, and object pooling.
 */

// --- OLD CORE CLASSES (Maintained for backward compatibility) ---

export class EventBus {
  private listeners: Map<string, Function[]> = new Map();

  async emit(event: string, data?: any): Promise<void> {
    const handlers = this.listeners.get(event) || [];
    await Promise.all(handlers.map(h => h(data)));
  }

  subscribe(event: string, handler: Function): void {
    const handlers = this.listeners.get(event) || [];
    this.listeners.set(event, [...handlers, handler]);
  }

  unsubscribe(event: string, handler: Function): void {
    const handlers = this.listeners.get(event) || [];
    this.listeners.set(event, handlers.filter(h => h !== handler));
  }
}

export class EventDispatcher {
  protected eventBus: EventBus;

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus;
  }

  async publish(event: string, data?: any): Promise<void> {
    await this.eventBus.emit(event, data);
  }

  subscribe(event: string, handler: Function): void {
    this.eventBus.subscribe(event, handler);
  }
}

export interface Disposable {
  dispose(): void | Promise<void>;
}

export enum DisposeMode {
  TRANSACTIONAL = 'transactional',
  BATCH = 'batch',
  STREAMING = 'streaming'
}

export interface NexusTask {
  id: string;
  type: string;
  priority: number;
  data: any;
  clone: () => NexusTask;
}

export class NexusTaskHeap {
  private heap: NexusTask[] = [];
  insert(task: NexusTask) {
    this.heap.push(task);
    this.heap.sort((a, b) => b.priority - a.priority);
  }
  peekN(n: number) { return this.heap.slice(0, n); }
  insertMany(tasks: NexusTask[]) {
    tasks.forEach(t => this.insert(t));
  }
  clear() { this.heap = []; }
}

export class NexusPatch {
  constructor(public id: string, public changes: any) {}
  toTask(): NexusTask {
    return {
      id: this.id,
      type: "PATCH",
      priority: 1000,
      data: this.changes,
      clone: () => new NexusPatch(this.id, { ...this.changes }).toTask()
    };
  }
}

export class NexusArchitecturalLinter {
  static check(oldSource: string, newSource: string): string[] {
    const diagnostics: string[] = [];
    if (!oldSource || !newSource) return ["Source Missing"];

    const getExports = (source: string) => {
      const exportRegex = /export\s+(?:class|function|const|enum|interface|type|default\s+class|default\s+function)\s+([a-zA-Z0-9_]+)/g;
      const matches = [];
      let match;
      while ((match = exportRegex.exec(source)) !== null) {
        matches.push(match[1]);
      }
      const namedExportRegex = /export\s+\{([\s\S]*?)\}/g;
      while ((match = namedExportRegex.exec(source)) !== null) {
        const names = match[1].split(',').map(n => n.trim().split(/\s+/).pop());
        names.forEach(n => n && matches.push(n));
      }
      return new Set(matches);
    };

    const oldExports = getExports(oldSource);
    const newExports = getExports(newSource);

    for (const exp of oldExports) {
      if (!newExports.has(exp)) {
        diagnostics.push(`EXPORT_LOSS: Public API surface has been truncated. Export '${exp}' was removed.`);
      }
    }

    return diagnostics;
  }

  static checkSymbolTable(symbolTable: any): string[] {
    const diagnostics: string[] = [];
    if (!symbolTable) return ["Symbol Table Missing"];
    return diagnostics;
  }
}

export class NexusComplexityAnalyzer {
  static analyze(source: string): { nodes: number, complexity: number } {
    const nodes = source.split(/\s+/).length;
    const complexity = (source.match(/if|for|while|switch|case|&&|\|\||\?/g) || []).length;
    return { nodes, complexity };
  }

  static checkRegression(oldSource: string, newSource: string, threshold = 0.15): string[] {
    const oldMetrics = this.analyze(oldSource);
    const newMetrics = this.analyze(newSource);
    const diagnostics: string[] = [];
    const effectiveThreshold = oldMetrics.nodes > 1000 ? Math.max(threshold, 0.25) : threshold;
    const nodeReduction = (oldMetrics.nodes - newMetrics.nodes) / oldMetrics.nodes;
    const complexityReduction = oldMetrics.complexity > 0 ? (oldMetrics.complexity - newMetrics.complexity) / oldMetrics.complexity : 0;
    if (nodeReduction > effectiveThreshold && complexityReduction > 0.1) {
      diagnostics.push(`CONTENT_LOSS: Significant logic reduction detected (Critical). (${(nodeReduction * 100).toFixed(1)}% reduction).`);
    }
    return diagnostics;
  }
}

export class NexusDiagnosticReporter {
  static report(code: number, message: string, addLog: (m: string, c: string) => void) {
    addLog(`[DIAGNOSTIC ${code}] ${message}`, "var(--color-dalek-red)");
  }
}

export class NexusCompilerHost {
  clone(options: { readOnly: boolean }) {
    return {
      simulate: async (patch: NexusPatch) => {
        return { symbolTable: { patched: true } };
      }
    };
  }
}

// --- NEW CONCURRENT CORE (Grog's Evolution) ---

export const Lane = {
  NoLanes:             0b0000000000000000000000000000000,
  SyncLane:            0b0000000000000000000000000000001,
  InputContinuousLane: 0b0000000000000000000000000000010,
  DefaultLane:         0b0000000000000000000000000000100,
  TransitionLanes:     0b0000000011111111111111111111000,
  RetryLanes:          0b0000111100000000000000000000000,
  SelectiveUpdateLane: 0b0011000000000000000000000000000,
  IdleLane:            0b0100000000000000000000000000000,
  OffscreenLane:       0b1000000000000000000000000000000,
};

export const WorkPriority = {
  ImmediatePriority: 1,
  UserBlockingPriority: 2,
  NormalPriority: 3,
  LowPriority: 4,
  IdlePriority: 5,
};

export const FiberFlags = {
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
  Hydrating:       0b0000100000000000,
  Visibility:      0b0001000000000000,
};

export const DiagnosticCategory = {
  Warning: 0,
  Error: 1,
  Suggestion: 2,
  Message: 3,
  Telemetry: 4,
};

export const DiagnosticMessages = {
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
  LANE_CONFLICT: { code: 9002, category: DiagnosticCategory.Warning, message: "Lane conflict detected during merge: {0} vs {1}" },
};

export class DiagnosticEmitter {
  #listeners = new Set<(payload: any) => void>();
  #history: any[] = [];
  #maxHistory = 1000;

  subscribe(fn: (payload: any) => void) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  emit(diagnostic: any, ...args: any[]) {
    let formatted = diagnostic.message;
    args.forEach((arg, i) => formatted = formatted.replace(new RegExp(`\\{${i}\\}`, 'g'), String(arg)));

    const payload = {
      timestamp: performance.now(),
      code: diagnostic.code,
      category: diagnostic.category,
      message: formatted,
      id: Math.random().toString(36).substring(2, 9),
      args,
      stack: new Error().stack
    };

    this.#history.push(payload);
    if (this.#history.length > this.#maxHistory) this.#history.shift();

    this.#listeners.forEach(listener => {
      try {
        listener(payload);
      } catch (e) {
        console.error("Diagnostic listener failure", e);
      }
    });
  }

  getHistory() {
    return [...this.#history];
  }
}

export class LaneManager {
  static getHighestPriorityLane(lanes: number) {
    return lanes & -lanes;
  }
  static includesLane(set: number, subset: number) {
    return (set & subset) !== Lane.NoLanes;
  }
  static mergeLanes(a: number, b: number) {
    return a | b;
  }
  static removeLanes(set: number, subset: number) {
    return set & ~subset;
  }
  static isSyncLane(lanes: number) {
    return (lanes & Lane.SyncLane) !== Lane.NoLanes;
  }
  static getLanesPriority(lanes: number) {
    if ((lanes & Lane.SyncLane) !== Lane.NoLanes) return WorkPriority.ImmediatePriority;
    if ((lanes & Lane.InputContinuousLane) !== Lane.NoLanes) return WorkPriority.UserBlockingPriority;
    return WorkPriority.NormalPriority;
  }
}

export class NexusObjectPool<T> {
  #pool: T[] = [];
  #limit: number;
  #ctor: new (...args: any[]) => T;
  #name: string;
  #diagnostics: DiagnosticEmitter;
  #totalAllocated = 0;

  constructor(ctor: new (...args: any[]) => T, name: string, diagnostics: DiagnosticEmitter, limit = 1000) {
    this.#ctor = ctor;
    this.#name = name;
    this.#diagnostics = diagnostics;
    this.#limit = limit;
  }

  acquire(...args: any[]): T {
    if (this.#pool.length > 0) {
      const instance = this.#pool.pop()!;
      if (typeof (instance as any).initialize === 'function') {
        (instance as any).initialize(...args);
      } else {
        Object.assign(instance, new this.#ctor(...args));
      }
      return instance;
    }
    this.#totalAllocated++;
    if (this.#totalAllocated > this.#limit) {
       this.#diagnostics.emit(DiagnosticMessages.POOL_EXHAUSTED, this.#name);
    }
    return new this.#ctor(...args);
  }

  release(instance: T) {
    if (this.#pool.length < this.#limit) {
      if (typeof (instance as any).cleanup === 'function') (instance as any).cleanup();
      this.#pool.push(instance);
    }
  }

  get stats() {
    return { name: this.#name, size: this.#pool.length, allocated: this.#totalAllocated, limit: this.#limit };
  }
}

class MinHeap {
  #heap: any[] = [];
  push(node: any) { this.#heap.push(node); this.#siftUp(this.#heap.length - 1); }
  peek() { return this.#heap[0] || null; }
  pop() {
    if (this.#heap.length === 0) return null;
    const first = this.#heap[0];
    const last = this.#heap.pop();
    if (this.#heap.length > 0) { this.#heap[0] = last; this.#siftDown(0); }
    return first;
  }
  get length() { return this.#heap.length; }
  #siftUp(index: number) {
    while (index > 0) {
      const parentIndex = (index - 1) >> 1;
      if (this.#compare(this.#heap[index], this.#heap[parentIndex]) < 0) {
        this.#swap(index, parentIndex); index = parentIndex;
      } else break;
    }
  }
  #siftDown(index: number) {
    const length = this.#heap.length;
    while (true) {
      let smallest = index;
      const left = (index << 1) + 1; const right = (index << 1) + 2;
      if (left < length && this.#compare(this.#heap[left], this.#heap[smallest]) < 0) smallest = left;
      if (right < length && this.#compare(this.#heap[right], this.#heap[smallest]) < 0) smallest = right;
      if (smallest !== index) { this.#swap(index, smallest); index = smallest; } else break;
    }
  }
  #swap(i: number, j: number) { const temp = this.#heap[i]; this.#heap[i] = this.#heap[j]; this.#heap[j] = temp; }
  #compare(a: any, b: any) {
    const diff = a.expirationTime - b.expirationTime;
    if (diff !== 0) return diff;
    return a.id < b.id ? -1 : (a.id > b.id ? 1 : 0);
  }
}

function taskInterceptor(callback: Function, host: Host, task: any) {
  return (didTimeout: boolean) => {
    const start = performance.now();
    host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, `Task:${task.id}:${task.priority}`);
    try {
      const result = callback(didTimeout);
      const duration = performance.now() - start;
      if (duration > 10) host.diagnostics.emit(DiagnosticMessages.METRIC_SUMMARY, task.id, duration.toFixed(2));
      return result;
    } catch (error: any) {
      host.diagnostics.emit(DiagnosticMessages.PHASE_TRANSITION_ERROR, "TaskExecution", task.id, error.message);
      throw error;
    }
  };
}

export class NexusScheduler {
  #taskQueue = new MinHeap();
  #isHostCallbackScheduled = false;
  #isPerformingWork = false;
  #yieldInterval = 5;
  #deadline = 0;
  #messageChannel = new MessageChannel();

  constructor(private host: Host) {
    this.#messageChannel.port1.onmessage = () => this.#workLoop();
  }

  scheduleCallback(priority: number, callback: Function, options: any = {}) {
    const currentTime = performance.now();
    const timeout = this.#getTimeoutByPriority(priority);
    const newTask = {
      id: Math.random().toString(36).substring(2, 9),
      callback, priority, startTime: currentTime,
      expirationTime: currentTime + timeout,
      lane: options.lane || Lane.DefaultLane,
    };
    newTask.callback = taskInterceptor(callback, this.host, newTask);
    this.#taskQueue.push(newTask);
    if (!this.#isHostCallbackScheduled && !this.#isPerformingWork) {
      this.#isHostCallbackScheduled = true;
      this.#requestHostCallback();
    }
    return newTask;
  }

  #getTimeoutByPriority(priority: number) {
    switch (priority) {
      case WorkPriority.ImmediatePriority: return -1;
      case WorkPriority.UserBlockingPriority: return 250;
      case WorkPriority.NormalPriority: return 5000;
      case WorkPriority.LowPriority: return 10000;
      case WorkPriority.IdlePriority: return 1073741823;
      default: return 5000;
    }
  }

  #requestHostCallback() { this.#messageChannel.port2.postMessage(null); }

  shouldYield() {
    if (typeof (navigator as any) !== 'undefined' && (navigator as any).scheduling && (navigator as any).scheduling.isInputPending) {
        if ((navigator as any).scheduling.isInputPending()) return true;
    }
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
          if (this.#taskQueue.peek() === currentTask) this.#taskQueue.pop();
        }
      }
      if (this.#taskQueue.length > 0) {
        this.#isHostCallbackScheduled = true;
        this.#requestHostCallback();
      }
    } finally { this.#isPerformingWork = false; }
  }
}

export class NexusFiber {
  name!: string; action!: Function; priority!: number; lanes!: number;
  return: NexusFiber | null = null; child: NexusFiber | null = null; sibling: NexusFiber | null = null; alternate: NexusFiber | null = null;
  memoizedState: any = null; updateQueue: any[] = []; flags: number = FiberFlags.NoFlags; subtreeFlags: number = FiberFlags.NoFlags;
  nextEffect: NexusFiber | null = null; memoizedProps: any = {}; pendingProps: any = {}; stateNode: any = null; dependencies: any = null;
  actualStartTime: number = 0; actualDuration: number = 0;

  constructor(name: string, action: Function, priority: number, lane = Lane.DefaultLane) {
    this.initialize(name, action, priority, lane);
  }

  initialize(name: string, action: Function, priority: number, lane = Lane.DefaultLane) {
    this.name = name; this.action = action; this.priority = priority; this.lanes = lane;
    this.return = null; this.child = null; this.sibling = null; this.alternate = null; this.memoizedState = null; this.updateQueue = [];
    this.flags = FiberFlags.NoFlags; this.subtreeFlags = FiberFlags.NoFlags; this.nextEffect = null; this.memoizedProps = {};
    this.pendingProps = {}; this.stateNode = null; this.dependencies = null; this.actualStartTime = performance.now(); this.actualDuration = 0;
  }

  cleanup() {
    this.return = null; this.child = null; this.sibling = null; this.alternate = null; this.memoizedState = null; this.updateQueue = [];
    this.flags = FiberFlags.NoFlags; this.subtreeFlags = FiberFlags.NoFlags; this.nextEffect = null; this.stateNode = null; this.dependencies = null;
  }
}

export class NexusReconciler {
  #workInProgress: NexusFiber | null = null;
  #currentLanes = Lane.NoLanes;
  #renderExpirationTime = -1;

  constructor(private program: NexusProgram) {}

  receiveUpdate(lanes: number) { this.#currentLanes = LaneManager.mergeLanes(this.#currentLanes, lanes); }

  performWorkOnRoot(root: NexusFiber, lanes: number): any {
    this.#workInProgress = root;
    this.#renderExpirationTime = performance.now() + 5000;
    while (this.#workInProgress !== null && !this.program.host.scheduler.shouldYield()) {
      this.#workInProgress = this.performUnitOfWork(this.#workInProgress);
    }
    if (this.#workInProgress === null) { this.commitRoot(root); return null; }
    else { return () => this.performWorkOnRoot(root, lanes); }
  }

  performUnitOfWork(unitOfWork: NexusFiber): NexusFiber | null {
    const current = unitOfWork.alternate;
    let next = this.beginWork(current, unitOfWork, this.#currentLanes);
    unitOfWork.memoizedProps = unitOfWork.pendingProps;
    if (next === null) next = this.completeUnitOfWork(unitOfWork);
    return next;
  }

  beginWork(current: NexusFiber | null, workInProgress: NexusFiber, renderLanes: number): NexusFiber | null {
    this.program.host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, `BeginWork: ${workInProgress.name}`);
    this.program.prepare(workInProgress);
    if (typeof workInProgress.action === 'function') {
      try { workInProgress.action(this.program); } catch (e: any) {
        this.program.host.diagnostics.emit(DiagnosticMessages.PHASE_TRANSITION_ERROR, "BeginWork", workInProgress.name, e.message);
        throw e;
      }
    }
    return workInProgress.child;
  }

  completeUnitOfWork(unitOfWork: NexusFiber): NexusFiber | null {
    let completedWork: NexusFiber | null = unitOfWork;
    do {
      const current = completedWork.alternate;
      const returnFiber: NexusFiber | null = completedWork.return;
      this.completeWork(current, completedWork, this.#currentLanes);
      const sibling: NexusFiber | null = completedWork.sibling;
      if (sibling !== null) return sibling;
      completedWork = returnFiber;
    } while (completedWork !== null);
    return null;
  }

  completeWork(current: NexusFiber | null, workInProgress: NexusFiber, renderLanes: number) {
    this.program.host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, `CompleteWork: ${workInProgress.name}`);
    let subtreeFlags = FiberFlags.NoFlags;
    let child = workInProgress.child;
    while (child !== null) {
      subtreeFlags |= child.subtreeFlags;
      subtreeFlags |= child.flags;
      child = child.sibling;
    }
    workInProgress.subtreeFlags |= subtreeFlags;
  }

  commitRoot(root: NexusFiber) {
    this.program.host.diagnostics.emit(DiagnosticMessages.WORK_COMMIT, "Root", LaneManager.getHighestPriorityLane(this.#currentLanes));
    this.#commitMutationEffects(root);
    this.#commitLayoutEffects(root);
  }

  #commitMutationEffects(fiber: NexusFiber | null) {
    if (!fiber) return;
    if (fiber.flags & FiberFlags.Placement) { /* Handle placement */ }
    if (fiber.subtreeFlags & (FiberFlags.Placement | FiberFlags.Update | FiberFlags.Deletion)) {
        this.#commitMutationEffects(fiber.child);
        this.#commitMutationEffects(fiber.sibling);
    }
  }

  #commitLayoutEffects(fiber: NexusFiber | null) {
     if (!fiber) return;
     if (fiber.alternate) { fiber.memoizedState = fiber.alternate.memoizedState; fiber.alternate = null; }
    this.#commitLayoutEffects(fiber.child);
    this.#commitLayoutEffects(fiber.sibling);
  }
}

export class CancellationToken {
  #isCancelled = false;
  #listeners = new Set<() => void>();
  get isCancellationRequested() { return this.#isCancelled; }
  cancel() {
    if (this.#isCancelled) return;
    this.#isCancelled = true;
    this.#listeners.forEach(fn => { try { fn(); } catch (e) {} });
    this.#listeners.clear();
  }
  onCancellationRequested(fn: () => void) {
    if (this.#isCancelled) { fn(); return () => {}; }
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }
  throwIfCancelled() {
    if (this.#isCancelled) {
      const error: any = new Error(DiagnosticMessages.PIPELINE_CANCELED.message);
      error.code = DiagnosticMessages.PIPELINE_CANCELED.code;
      throw error;
    }
  }
}

export class Host {
  #config: any;
  #diagnostics = new DiagnosticEmitter();
  #scheduler: NexusScheduler;
  constructor(config = {}) {
    this.#config = { debug: false, maxFiberPool: 5000, ...config };
    this.#scheduler = new NexusScheduler(this);
    this.#diagnostics.subscribe(entry => this.#logToConsole(entry));
  }
  get scheduler() { return this.#scheduler; }
  get diagnostics() { return this.#diagnostics; }
  get config() { return this.#config; }
  #logToConsole(entry: any) {
    const categories = Object.keys(DiagnosticCategory);
    const categoryName = categories[entry.category].toUpperCase();
    const logString = `[Nexus] [${entry.id}] [${entry.code}] [${categoryName}] ${entry.message}`;
    if (entry.category === DiagnosticCategory.Error) console.error(logString);
    else if (entry.category === DiagnosticCategory.Warning) console.warn(logString);
    else if (this.#config.debug) console.log(logString);
  }
}

export class NexusProgram {
  #results: any = {};
  #currentFiber: NexusFiber | null = null;
  #hookIndex = 0;
  constructor(public host: Host, public token: CancellationToken) {}
  get results() { return this.#results; }
  prepare(fiber: NexusFiber) { this.#currentFiber = fiber; this.#hookIndex = 0; }
  useState<T>(initialValue: T): [T, (newValue: T) => void] {
    const fiber = this.#currentFiber!;
    if (!fiber.memoizedState) fiber.memoizedState = [];
    const index = this.#hookIndex++;
    if (fiber.memoizedState.length <= index) fiber.memoizedState[index] = initialValue;
    return [
      fiber.memoizedState[index],
      (newValue: T) => { fiber.memoizedState[index] = newValue; fiber.flags |= FiberFlags.Update; }
    ];
  }
  useMemo<T>(factory: () => T, deps: any[]): T {
    const fiber = this.#currentFiber!;
    const index = this.#hookIndex++;
    const existing = fiber.memoizedState[index];
    if (existing && this.#compareDeps(existing.deps, deps)) return existing.value;
    const value = factory();
    fiber.memoizedState[index] = { value, deps };
    return value;
  }
  #compareDeps(prev: any[], next: any[]) {
      if (!prev || !next) return false;
      return prev.every((v, i) => v === next[i]);
  }
}

export class NexusCore {
  #host: Host;
  #reconciler: NexusReconciler;
  #token: CancellationToken;
  #status = 'IDLE';
  #rootFiber: NexusFiber | null = null;
  #fiberPool: NexusObjectPool<NexusFiber>;

  constructor(config = {}) {
    this.#host = new Host(config);
    const program = new NexusProgram(this.#host, new CancellationToken());
    this.#reconciler = new NexusReconciler(program);
    this.#token = new CancellationToken();
    this.#fiberPool = new NexusObjectPool(NexusFiber, "FiberPool", this.#host.diagnostics, this.#host.config.maxFiberPool);
    this.#initializeRoot();
  }

  #initializeRoot() {
    this.#rootFiber = this.#fiberPool.acquire("ROOT", () => {}, WorkPriority.NormalPriority, Lane.SyncLane);
    const setupFiber = this.#fiberPool.acquire("SETUP", (prog: NexusProgram) => {
      prog.host.diagnostics.emit(DiagnosticMessages.BOOTSTRAP_START);
      const [ready, setReady] = prog.useState(false);
      if (!ready) {
        setReady(true);
        prog.host.diagnostics.emit(DiagnosticMessages.SYSTEM_READY, "1.0.0", "/");
      }
    }, WorkPriority.NormalPriority, Lane.SyncLane);
    this.#rootFiber.child = setupFiber;
    setupFiber.return = this.#rootFiber;
  }

  get host() { return this.#host; }

  run() {
    if (this.#status === 'RUNNING') return;
    this.#status = 'RUNNING';
    this.#reconciler.performWorkOnRoot(this.#rootFiber!, Lane.SyncLane);
  }
}
