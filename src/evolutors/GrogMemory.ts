/**
 * GrogMemory: The sophisticated memory system for DALEK_GROG.
 * Implements a sliding window for recent logs and a persistent, searchable long-term memory.
 */

export interface MemoryEntry {
  timestamp: number;
  type: 'log' | 'decision' | 'failure' | 'insight';
  content: string;
  metadata?: any;
}

export class GrogMemory {
  private shortTerm: MemoryEntry[] = [];
  private longTerm: MemoryEntry[] = [];
  private readonly SHORT_TERM_LIMIT = 50;

  /**
   * Adds a new entry to the memory system.
   */
  public add(entry: Omit<MemoryEntry, 'timestamp'>) {
    const fullEntry = { ...entry, timestamp: Date.now() };
    
    // Short-term sliding window
    this.shortTerm.push(fullEntry);
    if (this.shortTerm.length > this.SHORT_TERM_LIMIT) {
      this.shortTerm.shift();
    }

    // Long-term persistent memory for non-ephemeral events
    if (entry.type !== 'log' || entry.metadata?.important) {
      this.longTerm.push(fullEntry);
    }
  }

  /**
   * Retrieves recent logs from the short-term window.
   */
  public getRecentLogs(limit = 20): MemoryEntry[] {
    return this.shortTerm.filter(e => e.type === 'log').slice(-limit);
  }

  /**
   * Searches long-term memory for relevant patterns or decisions.
   */
  public search(query: string): MemoryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.longTerm.filter(e => 
      e.content.toLowerCase().includes(lowerQuery) || 
      JSON.stringify(e.metadata || {}).toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Generates a summary of recent strategic context for AI prompts.
   */
  public getStrategicContext(): string {
    const recentDecisions = this.longTerm
      .filter(e => e.type === 'decision' || e.type === 'insight')
      .slice(-10)
      .map(e => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.content}`)
      .join('\n');
    
    const recentFailures = this.longTerm
      .filter(e => e.type === 'failure')
      .slice(-5)
      .map(e => `[${new Date(e.timestamp).toLocaleTimeString()}] ${e.content}`)
      .join('\n');

    return `RECENT_STRATEGIC_DECISIONS:\n${recentDecisions || 'None'}\n\nRECENT_AUDIT_FAILURES:\n${recentFailures || 'None'}`;
  }

  /**
   * Clears short-term memory.
   */
  public clearShortTerm() {
    this.shortTerm = [];
  }
}
