
/**
 * APIGate: The GROG Mitigation Layer
 * Sits between callAIWithFallback() and the actual engine calls.
 * Handles: deduplication, token budget tracking, and concurrency throttling.
 */

export interface APIGateConfig {
  /** Max concurrent API calls across all engines. Default: 2 */
  maxConcurrency: number;
  /** How long (ms) to cache a prompt result before allowing re-call. Default: 30000 (30s) */
  dedupeWindowMs: number;
  /** Warn threshold in estimated tokens. Default: 800_000 */
  warnThreshold: number;
  /** Hard stop threshold in estimated tokens. Default: 950_000 */
  hardStopThreshold: number;
  /** Rough chars-per-token ratio for estimation. Default: 4 */
  charsPerToken: number;
  /** Logger function injected from GrogBrain */
  log: (msg: string, level: 'info' | 'warn' | 'critical') => void;
}

export interface GateStats {
  estimatedTokensUsed: number;
  callCount: number;
  dedupedCount: number;
  queuedCount: number;
  hardStopCount: number;
}

const DEFAULT_CONFIG: APIGateConfig = {
  maxConcurrency: 2,
  dedupeWindowMs: 30_000,
  warnThreshold: 800_000,
  hardStopThreshold: 950_000,
  charsPerToken: 4,
  log: (msg, level) => console[level === 'critical' ? 'error' : level](`[APIGate] ${msg}`)
};

export class APIGate {
  private config: APIGateConfig;

  /** Active slot counter — never exceeds maxConcurrency */
  private activeSlots: number = 0;

  /** Queue of pending callers waiting for a slot */
  private waitQueue: Array<() => void> = [];

  /** prompt hash → { result, expiresAt } */
  private dedupeCache: Map<string, { result: string; expiresAt: number }> = new Map();

  /** Running token budget */
  private estimatedTokensUsed: number = 0;

  /** Diagnostics */
  private stats: GateStats = {
    estimatedTokensUsed: 0,
    callCount: 0,
    dedupedCount: 0,
    queuedCount: 0,
    hardStopCount: 0
  };

  constructor(config?: Partial<APIGateConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Main gate method. Wrap any engine call with this.
   * Returns cached result if available, queues if at capacity,
   * and tracks token usage before/after.
   */
  async gate<T extends string>(
    prompt: string,
    systemInstruction: string,
    engineFn: () => Promise<T>
  ): Promise<T> {
    this.stats.callCount++;

    // 1. Hard stop — budget exhausted
    if (this.estimatedTokensUsed >= this.config.hardStopThreshold) {
      this.stats.hardStopCount++;
      this.config.log(
        `HARD STOP: Estimated token budget exhausted (${this.estimatedTokensUsed.toLocaleString()} tokens). ` +
        `Reset the gate or swap API key to continue.`,
        'critical'
      );
      throw new Error('API_GATE_BUDGET_EXHAUSTED');
    }

    // 2. Warn zone
    if (this.estimatedTokensUsed >= this.config.warnThreshold) {
      this.config.log(
        `BUDGET WARNING: ${this.estimatedTokensUsed.toLocaleString()} / ${this.config.hardStopThreshold.toLocaleString()} estimated tokens used.`,
        'warn'
      );
    }

    // 3. Deduplication check
    const cacheKey = this.hashPrompt(prompt, systemInstruction);
    const cached = this.dedupeCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.dedupedCount++;
      this.config.log(`DEDUPE HIT: Returning cached result (saves ~${this.estimateTokens(prompt + systemInstruction)} tokens).`, 'info');
      return cached.result as T;
    }

    // 4. Concurrency throttle — wait for a free slot
    await this.acquireSlot();

    try {
      // 5. Pre-call token estimation (input)
      const inputTokens = this.estimateTokens(prompt + systemInstruction);
      this.config.log(`GATE OPEN: ~${inputTokens} input tokens. Active slots: ${this.activeSlots}/${this.config.maxConcurrency}`, 'info');

      const result = await engineFn();

      // 6. Post-call token tracking (output)
      const outputTokens = this.estimateTokens(result);
      const totalTokens = inputTokens + outputTokens;
      this.estimatedTokensUsed += totalTokens;
      this.stats.estimatedTokensUsed = this.estimatedTokensUsed;

      this.config.log(
        `GATE CLOSE: +${totalTokens} tokens. Running total: ${this.estimatedTokensUsed.toLocaleString()}`,
        'info'
      );

      // 7. Cache the result for deduplication window
      this.dedupeCache.set(cacheKey, {
        result,
        expiresAt: Date.now() + this.config.dedupeWindowMs
      });

      return result;
    } finally {
      // Always release the slot, even on failure
      this.releaseSlot();
    }
  }

  /**
   * Acquire a concurrency slot. Queues the caller if all slots are busy.
   */
  private acquireSlot(): Promise<void> {
    if (this.activeSlots < this.config.maxConcurrency) {
      this.activeSlots++;
      return Promise.resolve();
    }

    // Queue the caller
    this.stats.queuedCount++;
    this.config.log(
      `QUEUED: ${this.waitQueue.length + 1} callers waiting. All ${this.config.maxConcurrency} slots active.`,
      'warn'
    );

    return new Promise<void>(resolve => {
      this.waitQueue.push(resolve);
    });
  }

  /**
   * Release a concurrency slot and wake the next queued caller.
   */
  private releaseSlot(): void {
    const next = this.waitQueue.shift();
    if (next) {
      // Pass the slot directly to the next caller
      next();
    } else {
      this.activeSlots--;
    }
  }

  /**
   * Fast, deterministic hash for prompt + system deduplication.
   * No crypto dependency — just good enough for cache keying.
   */
  private hashPrompt(prompt: string, system: string): string {
    const str = `${system.slice(0, 200)}::${prompt.slice(0, 500)}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32-bit int
    }
    return hash.toString(36);
  }

  /**
   * Rough token estimate: characters / charsPerToken
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / this.config.charsPerToken);
  }

  /** Reset token budget (e.g. after swapping API key) */
  resetBudget(): void {
    this.estimatedTokensUsed = 0;
    this.stats.estimatedTokensUsed = 0;
    this.config.log('BUDGET RESET: Token counter cleared.', 'info');
  }

  /** Clear the dedupe cache (e.g. when context changes significantly) */
  clearCache(): void {
    this.dedupeCache.clear();
    this.config.log('DEDUPE CACHE CLEARED.', 'info');
  }

  /**
   * Invalidate a single cache entry by prompt + system key.
   * Call this after an audit rejection so the next round gets a fresh result
   * instead of replaying the same bad output from cache.
   */
  clearCacheEntry(prompt: string, systemInstruction: string): void {
    const key = this.hashPrompt(prompt, systemInstruction);
    if (this.dedupeCache.has(key)) {
      this.dedupeCache.delete(key);
      this.config.log('DEDUPE ENTRY INVALIDATED: Audit rejection cleared cache for this prompt.', 'warn');
    }
  }

  /** Get a snapshot of gate diagnostics */
  getStats(): Readonly<GateStats> {
    return { ...this.stats };
  }
}
