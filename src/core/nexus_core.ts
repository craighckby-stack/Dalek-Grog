export class EventBus {
  private listeners: { [event: string]: ((data: any) => void)[] } = {};

  public on(event: string, listener: (data: any) => void) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  public emit(event: string, data: any) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(l => l(data));
    }
  }
}

export interface NexusTask {
  id: string;
  type: string;
  priority: number;
}

export class NexusTaskHeap {
  private tasks: NexusTask[] = [];

  public push(task: NexusTask) {
    this.tasks.push(task);
    this.tasks.sort((a, b) => b.priority - a.priority);
  }

  public pop(): NexusTask | undefined {
    return this.tasks.shift();
  }
}

export interface NexusPatch {
  id: string;
  path: string;
  content: string;
}

export class NexusArchitecturalLinter {
  public lint(code: string): boolean {
    return code.length > 0;
  }
}

export class NexusComplexityAnalyzer {
  public analyze(code: string): number {
    return code.length / 100;
  }
}

export class NexusDiagnosticReporter {
  public report(error: any): string {
    return `DIAGNOSTIC: ${error.message || String(error)}`;
  }
}

export class NexusCompilerHost {
  public compile(code: string): boolean {
    return true;
  }
}
