/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * EPISODIC MEMORY v1.0.0: Experience Storage System
 * Part of the AGI Bootstrap Sequence for DALEK_GROG
 * 
 * Stores, retrieves, and learns from past experiences/events.
 * Enables the system to remember and learn from history.
 */

import { EventBus, EventDispatcher } from './nexus_core';

export interface Episode {
  id: string;
  timestamp: string;
  type: 'success' | 'failure' | 'learning' | 'mutation' | 'evolution' | 'death';
  context: {
    file?: string;
    operation?: string;
    model?: string;
    strategy?: string;
  };
  content: string;
  outcome?: string;
  embedding?: number[];  // For similarity matching
  metadata: Record<string, any>;
}

export interface EpisodicMemoryConfig {
  maxEpisodes: number;
  consolidationThreshold: number;  // Episodes needed before consolidation
  retrievalTopK: number;  // Top K similar episodes to retrieve
}

const DEFAULT_CONFIG: EpisodicMemoryConfig = {
  maxEpisodes: 10000,
  consolidationThreshold: 100,
  retrievalTopK: 5
};

/**
 * EpisodicMemory: The experience storage and retrieval system
 * 
 * Responsibilities:
 * - Store episodes (experiences) with temporal context
 * - Retrieve relevant past experiences for current situations
 * - Consolidate learning from repeated patterns
 * - Provide "flashback" capability for similar situations
 */
export class EpisodicMemory extends EventDispatcher {
  private episodes: Episode[] = [];
  private config: EpisodicMemoryConfig;
  private consolidationLog: Map<string, number> = new Map();  // Pattern -> count
  private patterns: Map<string, Episode[]> = new Map();  // Pattern -> matching episodes

  constructor(eventBus: EventBus, config: Partial<EpisodicMemoryConfig> = {}) {
    super(eventBus);
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Subscribe to system events to auto-record episodes
    this.subscribe('grog:thought', this.recordThought.bind(this));
    this.subscribe('grog:evolution', this.recordEvolution.bind(this));
    this.subscribe('grog:error', this.recordError.bind(this));
    this.subscribe('grog:death', this.recordDeath.bind(this));
  }

  /**
   * Record a new episode in memory
   */
  async record(episode: Omit<Episode, 'id' | 'timestamp'>): Promise<Episode> {
    const newEpisode: Episode = {
      ...episode,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    };

    // Add to memory
    this.episodes.push(newEpisode);
    
    // Trim if over capacity (keep most recent)
    if (this.episodes.length > this.config.maxEpisodes) {
      this.episodes = this.episodes.slice(-this.config.maxEpisodes);
    }

    // Update pattern tracking
    this.updatePatterns(newEpisode);

    // Emit event
    await this.publish('memory:recorded', { episode: newEpisode, totalEpisodes: this.episodes.length });

    // Check for consolidation
    await this.checkConsolidation();

    return newEpisode;
  }

  /**
   * Retrieve similar past episodes based on context
   */
  async retrieveSimilar(context: Episode['context']): Promise<Episode[]> {
    const scored = this.episodes.map(ep => ({
      episode: ep,
      score: this.similarityScore(ep.context, context)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.retrievalTopK)
      .map(s => s.episode);
  }

  /**
   * Retrieve episodes by type
   */
  getByType(type: Episode['type']): Episode[] {
    return this.episodes.filter(ep => ep.type === type);
  }

  /**
   * Retrieve episodes within time range
   */
  getByTimeRange(start: Date, end: Date): Episode[] {
    return this.episodes.filter(ep => {
      const t = new Date(ep.timestamp);
      return t >= start && t <= end;
    });
  }

  /**
   * Get consolidated learnings (patterns that appeared multiple times)
   */
  getConsolidatedLearnings(): Array<{ pattern: string; count: number; examples: Episode[] }> {
    const learnings: Array<{ pattern: string; count: number; examples: Episode[] }> = [];
    
    this.consolidationLog.forEach((count, pattern) => {
      if (count >= this.config.consolidationThreshold) {
        learnings.push({
          pattern,
          count,
          examples: this.patterns.get(pattern) || []
        });
      }
    });

    return learnings.sort((a, b) => b.count - a.count);
  }

  /**
   * Flashback: Get relevant past experiences for current situation
   */
  async flashback(currentSituation: string): Promise<string> {
    // Find relevant episodes
    const relevantEpisodes = this.episodes
      .filter(ep => this.isRelevantToSituation(ep, currentSituation))
      .slice(-10);

    if (relevantEpisodes.length === 0) {
      return "No relevant past experiences found.";
    }

    // Generate summary of past experiences
    const summary = relevantEpisodes.map(ep => 
      `[${ep.timestamp}] ${ep.type.toUpperCase()}: ${ep.content}` +
      (ep.outcome ? `\n  Outcome: ${ep.outcome}` : '')
    ).join('\n\n');

    return `RELEVANT PAST EXPERIENCES:\n${summary}`;
  }

  /**
   * Export memory for persistence
   */
  export(): { episodes: Episode[]; patterns: Array<[string, number]> } {
    return {
      episodes: this.episodes,
      patterns: Array.from(this.consolidationLog.entries())
    };
  }

  /**
   * Import memory from persistence
   */
  async import(data: { episodes: Episode[]; patterns?: Array<[string, number]> }): Promise<void> {
    this.episodes = data.episodes || [];
    
    if (data.patterns) {
      this.consolidationLog = new Map(data.patterns);
    }

    // Rebuild pattern index
    this.episodes.forEach(ep => this.updatePatterns(ep));

    await this.publish('memory:imported', { totalEpisodes: this.episodes.length });
  }

  // --- Event Handlers ---

  private async recordThought(data: any): Promise<void> {
    await this.record({
      type: 'learning',
      context: { operation: data.type },
      content: data.insight,
      metadata: { priority: data.priority }
    });
  }

  private async recordEvolution(data: any): Promise<void> {
    await this.record({
      type: 'evolution',
      context: { file: data.file, operation: 'evolve' },
      content: data.change || 'File evolved',
      outcome: data.result,
      metadata: {}
    });
  }

  private async recordError(data: any): Promise<void> {
    await this.record({
      type: 'failure',
      context: { operation: data.operation },
      content: data.error,
      outcome: data.resolution,
      metadata: { stack: data.stack }
    });
  }

  private async recordDeath(data: any): Promise<void> {
    await this.record({
      type: 'death',
      context: { operation: data.operation },
      content: data.error,
      metadata: { fatal: true, context: data.context }
    });
  }

  // --- Helpers ---

  private generateId(): string {
    return `ep_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private similarityScore(ctx1: Episode['context'], ctx2: Episode['context']): number {
    let score = 0;
    if (ctx1.file && ctx1.file === ctx2.file) score += 0.4;
    if (ctx1.operation && ctx1.operation === ctx2.operation) score += 0.3;
    if (ctx1.model && ctx1.model === ctx2.model) score += 0.2;
    if (ctx1.strategy && ctx1.strategy === ctx2.strategy) score += 0.1;
    return score;
  }

  private updatePatterns(episode: Episode): void {
    // Extract patterns from episode
    const patterns = this.extractPatterns(episode);
    
    patterns.forEach(pattern => {
      const count = this.consolidationLog.get(pattern) || 0;
      this.consolidationLog.set(pattern, count + 1);

      if (!this.patterns.has(pattern)) {
        this.patterns.set(pattern, []);
      }
      this.patterns.get(pattern)!.push(episode);
    });
  }

  private extractPatterns(episode: Episode): string[] {
    const patterns: string[] = [];
    
    // Pattern: file + operation
    if (episode.context.file && episode.context.operation) {
      patterns.push(`${episode.context.file}:${episode.context.operation}`);
    }
    
    // Pattern: error type
    if (episode.type === 'failure') {
      const errorType = episode.content.split(':')[0];
      patterns.push(`error:${errorType}`);
    }

    // Pattern: success pattern
    if (episode.type === 'success' && episode.outcome) {
      patterns.push(`success:${episode.context.operation}`);
    }

    return patterns;
  }

  private isRelevantToSituation(episode: Episode, situation: string): boolean {
    const situationLower = situation.toLowerCase();
    
    // Check content relevance
    if (episode.content.toLowerCase().includes(situationLower)) return true;
    
    // Check context relevance
    if (episode.context.file && situationLower.includes(episode.context.file.toLowerCase())) return true;
    if (episode.context.operation && situationLower.includes(episode.context.operation.toLowerCase())) return true;

    return false;
  }

  private async checkConsolidation(): Promise<void> {
    const consolidated = this.getConsolidatedLearnings();
    
    if (consolidated.length > 0) {
      await this.publish('memory:consolidated', { 
        patternsLearned: consolidated.length,
        topPattern: consolidated[0]
      });
    }
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalEpisodes: number;
    byType: Record<Episode['type'], number>;
    patternsTracked: number;
    oldestEpisode: string | null;
    newestEpisode: string | null;
  } {
    const byType: Record<Episode['type'], number> = {
      success: 0,
      failure: 0,
      learning: 0,
      mutation: 0,
      evolution: 0,
      death: 0
    };

    this.episodes.forEach(ep => {
      byType[ep.type]++;
    });

    return {
      totalEpisodes: this.episodes.length,
      byType,
      patternsTracked: this.consolidationLog.size,
      oldestEpisode: this.episodes[0]?.timestamp || null,
      newestEpisode: this.episodes[this.episodes.length - 1]?.timestamp || null
    };
  }
}

export default EpisodicMemory;
