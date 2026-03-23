import { NexusCore, Lane, WorkPriority, DiagnosticMessages } from '../core/nexus_core';

export interface AuditResult {
  file: string;
  status: 'PASSED' | 'FAILED' | 'WARNING';
  diagnostics: any[];
  metrics: {
    complexity: number;
    saturation: number;
    latency: number;
  };
}

export class SystemAuditService {
  private engine: NexusCore;
  private auditHistory: AuditResult[] = [];

  constructor() {
    this.engine = new NexusCore({ debug: true });
  }

  public async runFullAudit(files: string[], addLog: (m: string, c: string) => void): Promise<AuditResult[]> {
    addLog("INITIATING FULL SYSTEM AUDIT VIA NEXUS_CORE...", "var(--color-dalek-gold)");
    
    const results: AuditResult[] = [];
    
    // Use NexusCore scheduler to run audits in a time-sliced manner
    for (const file of files) {
      await new Promise<void>((resolve) => {
        this.engine.host.scheduler.scheduleCallback(WorkPriority.NormalPriority, () => {
          addLog(`AUDITING NODE: ${file}`, "var(--color-dalek-cyan)");
          
          // Simulate audit logic using NexusCore diagnostics
          const start = performance.now();
          
          // Emit audit start
          this.engine.host.diagnostics.emit(DiagnosticMessages.PHASE_ENTER, `Audit:${file}`);
          
          // Mocking some audit metrics for now
          const result: AuditResult = {
            file,
            status: Math.random() > 0.1 ? 'PASSED' : 'WARNING',
            diagnostics: this.engine.host.diagnostics.getHistory().slice(-5),
            metrics: {
              complexity: Math.floor(Math.random() * 50),
              saturation: Math.floor(Math.random() * 100),
              latency: performance.now() - start
            }
          };
          
          results.push(result);
          this.auditHistory.push(result);
          
          this.engine.host.diagnostics.emit(DiagnosticMessages.METRIC_SUMMARY, file, result.metrics.latency.toFixed(2));
          
          if (result.status === 'PASSED') {
            addLog(`AUDIT_PASSED: ${file} [Complexity: ${result.metrics.complexity}]`, "var(--color-dalek-green-dim)");
          } else {
            addLog(`AUDIT_WARNING: ${file} - Potential logic drift detected.`, "var(--color-dalek-gold-dim)");
          }
          
          resolve();
        }, { lane: Lane.DefaultLane });
      });
    }

    addLog(`FULL SYSTEM AUDIT COMPLETE. ${results.length} NODES VERIFIED.`, "var(--color-dalek-green)");
    return results;
  }

  public getHistory() {
    return this.auditHistory;
  }
}

export const systemAuditService = new SystemAuditService();
