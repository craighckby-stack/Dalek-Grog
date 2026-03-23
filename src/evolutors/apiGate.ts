
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
  /** Max retries for transient errors (e.g. 429). Default: 3 */
  maxRetries: number;
  /** Initial delay for exponential backoff (ms). Default: 2000 */
  retryDelayMs: number;
  /** Logger function injected from GrogBrain */
  log: (msg: string, level: 'info' | 'warn' | 'critical', error?: any) => void;
}

export interface GateStats {
  estimatedTokensUsed: number;
  callCount: number;
  dedupedCount: number;
  queuedCount: number;
  hardStopCount: number;
  retryCount: number;
  isQuotaExhausted: boolean;
}

const DEFAULT_CONFIG: APIGateConfig = {
  maxConcurrency: 2,
  dedupeWindowMs: 30_000,
  warnThreshold: 800_000,
  hardStopThreshold: 950_000,
  charsPerToken: 4,
  maxRetries: 3,
  retryDelayMs: 2000,
  log: (msg, level, error) => console[level === 'critical' ? 'error' : level](`[APIGate] ${msg}`, error)
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

  /** Quota exhaustion flag */
  private isQuotaExhausted: boolean = false;

  /** Cooldown timer */
  private cooldownUntil: number = 0;

  /** Diagnostics */
  private stats: GateStats = {
    estimatedTokensUsed: 0,
    callCount: 0,
    dedupedCount: 0,
    queuedCount: 0,
    hardStopCount: 0,
    retryCount: 0,
    isQuotaExhausted: false
  };

  constructor(config?: Partial<APIGateConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /** Update gate configuration at runtime */
  updateConfig(newConfig: Partial<APIGateConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.config.log(`CONFIG UPDATED: maxConcurrency=${this.config.maxConcurrency}`, 'info');
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

    // 0. Quota cooldown check
    if (this.isQuotaExhausted && Date.now() < this.cooldownUntil) {
      const remaining = Math.ceil((this.cooldownUntil - Date.now()) / 1000);
      const error = new Error('API_GATE_QUOTA_EXHAUSTED');
      this.config.log(`QUOTA EXHAUSTED: Cooling down for ${remaining}s...`, 'critical', error);
      throw error;
    } else if (this.isQuotaExhausted) {
      this.isQuotaExhausted = false;
      this.config.log('QUOTA COOLDOWN EXPIRED: Resuming operations.', 'info');
    }

    // 1. Hard stop — budget exhausted
    if (this.estimatedTokensUsed >= this.config.hardStopThreshold) {
      this.stats.hardStopCount++;
      const error = new Error('API_GATE_BUDGET_EXHAUSTED');
      this.config.log(
        `HARD STOP: Estimated token budget exhausted (${this.estimatedTokensUsed.toLocaleString()} tokens). ` +
        `Reset the gate or swap API key to continue.`,
        'critical',
        error
      );
      throw error;
    }

    // 2. Warn zone
    if (this.estimatedTokensUsed >= this.config.warnThreshold) {
      this.config.log(
        `BUDGET WARNING: ${this.estimatedTokensUsed.toLocaleString()} / ${this.config.hardStopThreshold.toLocaleString()} estimated tokens used.`,
        'warn'
      );
    }

    // 3. Deduplication check
    const cacheKey = await this.hashPrompt(prompt, systemInstruction);
    const cached = this.dedupeCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      this.stats.dedupedCount++;
      this.config.log(`DEDUPE HIT: Returning cached result (saves ~${this.estimateTokens(prompt + systemInstruction)} tokens).`, 'info');
      return cached.result as T;
    }

    // 4. Concurrency throttle — wait for a free slot
    await this.acquireSlot();

    let lastError: any = null;
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        // 5. Pre-call token estimation (input)
        const inputTokens = this.estimateTokens(prompt + systemInstruction);
        if (attempt === 0) {
          this.config.log(`GATE OPEN: ~${inputTokens} input tokens. Active slots: ${this.activeSlots}/${this.config.maxConcurrency}`, 'info');
        } else {
          this.config.log(`RETRYING (${attempt}/${this.config.maxRetries}): ~${inputTokens} input tokens.`, 'warn');
        }

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

        this.releaseSlot();
        return result;
      } catch (error: any) {
        lastError = error;
        const errorMsg = error.message || String(error);

        // Handle 429 Resource Exhausted
        if (errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
          this.isQuotaExhausted = true;
          // Set a 60s cooldown by default on 429
          this.cooldownUntil = Date.now() + 60_000;
          this.config.log(`QUOTA EXHAUSTED (429): Entering 60s cooldown.`, 'critical', error);
          this.releaseSlot();
          break; // Don't retry immediately on 429, let the cooldown handle it
        }

        // Handle other transient errors with backoff
        if (attempt < this.config.maxRetries) {
          this.stats.retryCount++;
          const delay = this.config.retryDelayMs * Math.pow(2, attempt);
          this.config.log(`TRANSIENT ERROR: ${errorMsg.slice(0, 100)}. Retrying in ${delay}ms...`, 'warn', error);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          this.config.log(`MAX RETRIES EXCEEDED: ${errorMsg.slice(0, 100)}`, 'critical', error);
          this.releaseSlot();
        }
      }
    }

    throw lastError;
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
   * Robust, deterministic hash for prompt + system deduplication.
   * Uses SHA-256 via Web Crypto API if available, falls back to a 64-bit string hash.
   * No slicing — hashes the entire content to ensure effective deduplication.
   */
  private async hashPrompt(prompt: string, system: string): Promise<string> {
    const str = `${system}::${prompt}`;
    
    // 1. Try Web Crypto (SHA-256) for maximum robustness
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      try {
        const msgUint8 = new TextEncoder().encode(str);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        // Return hex string of the SHA-256 hash
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback on unexpected crypto errors
      }
    }

    // 2. Fallback: 64-bit FNV-1a variant (non-crypto but much better than 32-bit)
    // We use two 32-bit hashes to simulate a larger hash space and reduce collisions
    let h1 = 0x811c9dc5;
    let h2 = 0xdeadbeef;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      h1 ^= char;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= char;
      h2 = Math.imul(h2, 0x1000193) + h1;
    }
    
    return (h1 >>> 0).toString(36) + (h2 >>> 0).toString(36);
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
  async clearCacheEntry(prompt: string, systemInstruction: string): Promise<void> {
    const key = await this.hashPrompt(prompt, systemInstruction);
    if (this.dedupeCache.has(key)) {
      this.dedupeCache.delete(key);
      this.config.log('DEDUPE ENTRY INVALIDATED: Audit rejection cleared cache for this prompt.', 'warn');
    }
  }

  /** Get a snapshot of gate diagnostics */
  getStats(): Readonly<GateStats> {
    return { 
      ...this.stats,
      isQuotaExhausted: this.isQuotaExhausted
    };
  }
}
