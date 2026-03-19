/**
 * NEXUS_CORE v1.0.0: The Nervous System
 * Provides the base event-driven architecture for the Dalek Caan system.
 */

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
  static check(symbolTable: any): string[] {
    const diagnostics: string[] = [];
    if (!symbolTable) return ["Symbol Table Missing"];
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
