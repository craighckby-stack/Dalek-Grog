/**
 * Stats Tracker
 * =============
 * Tracks LLM savings and system metrics
 */

import fs from 'fs/promises';
import path from 'path';

interface LLMStats {
  totalQueries: number;
  localHits: number;
  llmCalls: number;
  llmCallsSaved: number;
  savingsPercent: number;
}

interface EvolutionStats {
  totalEvolutions: number;
  filesEvolved: number;
  lastEvolution: string;
  patternsLearned: number;
}

interface SystemStats {
  bootCount: number;
  uptimeMs: number;
  lastBoot: string;
  errors: number;
}

interface FullStats {
  llm: LLMStats;
  evolution: EvolutionStats;
  system: SystemStats;
  updatedAt: string;
}

export class StatsTracker {
  private statsPath: string;
  private stats: FullStats;
  private startTime: number;

  constructor(statsPath: string = './grog/cache/stats.json') {
    this.statsPath = statsPath;
    this.startTime = Date.now();
    this.stats = this.getDefaultStats();
  }

  /**
   * Initialize stats tracker
   */
  async init(): Promise<void> {
    try {
      const data = await fs.readFile(this.statsPath, 'utf-8');
      this.stats = JSON.parse(data);
      this.stats.system.bootCount++;
      this.stats.system.lastBoot = new Date().toISOString();
    } catch {
      // First run
      this.stats = this.getDefaultStats();
      await this.save();
    }
  }

  /**
   * Record a query attempt
   */
  recordQuery(wasLocalHit: boolean): void {
    this.stats.llm.totalQueries++;
    
    if (wasLocalHit) {
      this.stats.llm.localHits++;
      this.stats.llm.llmCallsSaved++;
    } else {
      this.stats.llm.llmCalls++;
    }
    
    // Update savings percent
    this.stats.llm.savingsPercent = this.stats.llm.totalQueries > 0
      ? Math.round((this.stats.llm.localHits / this.stats.llm.totalQueries) * 100)
      : 0;
  }

  /**
   * Record an evolution
   */
  recordEvolution(filesEvolved: number, patternsLearned: number): void {
    this.stats.evolution.totalEvolutions++;
    this.stats.evolution.filesEvolved += filesEvolved;
    this.stats.evolution.patternsLearned += patternsLearned;
    this.stats.evolution.lastEvolution = new Date().toISOString();
  }

  /**
   * Record an error
   */
  recordError(): void {
    this.stats.system.errors++;
  }

  /**
   * Get current stats
   */
  getStats(): FullStats {
    this.stats.system.uptimeMs = Date.now() - this.startTime;
    this.stats.updatedAt = new Date().toISOString();
    return this.stats;
  }

  /**
   * Get LLM savings summary
   */
  getLLMSavings(): { saved: number; percent: number } {
    return {
      saved: this.stats.llm.llmCallsSaved,
      percent: this.stats.llm.savingsPercent
    };
  }

  /**
   * Get evolution summary
   */
  getEvolutionSummary(): EvolutionStats {
    return this.stats.evolution;
  }

  /**
   * Save stats to disk
   */
  async save(): Promise<void> {
    await fs.mkdir(path.dirname(this.statsPath), { recursive: true });
    this.stats.updatedAt = new Date().toISOString();
    this.stats.system.uptimeMs = Date.now() - this.startTime;
    await fs.writeFile(this.statsPath, JSON.stringify(this.stats, null, 2), 'utf-8');
  }

  /**
   * Reset all stats
   */
  async reset(): Promise<void> {
    this.stats = this.getDefaultStats();
    await this.save();
  }

  /**
   * Get default stats structure
   */
  private getDefaultStats(): FullStats {
    return {
      llm: {
        totalQueries: 0,
        localHits: 0,
        llmCalls: 0,
        llmCallsSaved: 0,
        savingsPercent: 0
      },
      evolution: {
        totalEvolutions: 0,
        filesEvolved: 0,
        lastEvolution: 'NEVER',
        patternsLearned: 0
      },
      system: {
        bootCount: 0,
        uptimeMs: 0,
        lastBoot: new Date().toISOString(),
        errors: 0
      },
      updatedAt: new Date().toISOString()
    };
  }
}

export default StatsTracker;
