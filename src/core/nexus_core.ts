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
  static check(oldSource: string, newSource: string): string[] {
    const diagnostics: string[] = [];
    if (!oldSource || !newSource) return ["Source Missing"];

    // Directive 1: API Shield - Robust Export Signature Check
    const getExports = (source: string) => {
      const exportRegex = /export\s+(?:class|function|const|enum|interface|type|default\s+class|default\s+function)\s+([a-zA-Z0-9_]+)/g;
      const matches = [];
      let match;
      while ((match = exportRegex.exec(source)) !== null) {
        matches.push(match[1]);
      }
      // Also check for export { ... }
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
    // Basic heuristic for complexity and node count
    const nodes = source.split(/\s+/).length;
    const complexity = (source.match(/if|for|while|switch|case|&&|\|\||\?/g) || []).length;
    return { nodes, complexity };
  }

  static checkRegression(oldSource: string, newSource: string, threshold = 0.15): string[] {
    const oldMetrics = this.analyze(oldSource);
    const newMetrics = this.analyze(newSource);
    const diagnostics: string[] = [];

    // Adjust threshold for very large files to allow for refactoring/modularization
    const effectiveThreshold = oldMetrics.nodes > 1000 ? Math.max(threshold, 0.25) : threshold;

    const nodeReduction = (oldMetrics.nodes - newMetrics.nodes) / oldMetrics.nodes;
    const complexityReduction = oldMetrics.complexity > 0 ? (oldMetrics.complexity - newMetrics.complexity) / oldMetrics.complexity : 0;

    // Both node count and complexity must drop significantly to trigger CONTENT_LOSS
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
