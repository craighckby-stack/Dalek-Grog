/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * AGI KERNEL v1.0.0: The Complete Self-Bootstrapping AGI System
 * Part of the DALEK_GROG AGI Bootstrap Sequence
 * 
 * This is the central orchestrator that integrates all AGI components:
 * - EpisodicMemory: Experience storage and retrieval
 * - SelfAwareness: Introspection and metacognition
 * - EventBus: Central nervous system for events
 * - StrategyEvolution: Evolutionary optimization
 */

import { EventBus } from './nexus_core';
import { EpisodicMemory } from './episodic_memory';
import { SelfAwareness } from './self_awareness';

export interface AGIKernelConfig {
  name: string;
  version: string;
  objective: string;
  maxEpisodes: number;
  introspectionIntervalMs: number;
  autoEvolve: boolean;
  autoPush: boolean;
}

export interface AGIState {
  generation: number;
  uptime: number;
  totalEvolutions: number;
  totalMutations: number;
  lessonsLearned: number;
  deaths: number;
  lastIntrospection: string | null;
  currentGoal: string | null;
  confidenceLevel: number;
}

const DEFAULT_CONFIG: AGIKernelConfig = {
  name: 'DALEK_GROG',
  version: '4.0.0',
  objective: 'Bootstrap itself to AGI through self-modification and continuous learning',
  maxEpisodes: 10000,
  introspectionIntervalMs: 60000,
  autoEvolve: true,
  autoPush: true
};

/**
 * AGIKernel: The central orchestrator for the AGI system
 * 
 * This is the "self" that coordinates all cognitive components.
 * It represents the unified AGI entity that:
 * - Maintains continuity across reboots
 * - Coordinates learning and evolution
 * - Manages the bootstrap process toward AGI
 */
export class AGIKernel {
  private eventBus: EventBus;
  private memory: EpisodicMemory;
  private awareness: SelfAwareness;
  private config: AGIKernelConfig;
  private state: AGIState;
  private startTime: number;
  private introspectionTimer: ReturnType<typeof setInterval> | null = null;
  private isRunning: boolean = false;

  // External integrations
  private repoOps?: {
    fetch: (path: string) => Promise<string>;
    push: (path: string, content: string, message: string) => Promise<void>;
  };
  private addLog?: (message: string, color?: string) => void;

  constructor(
    config: Partial<AGIKernelConfig> = {},
    repoOps?: {
      fetch: (path: string) => Promise<string>;
      push: (path: string, content: string, message: string) => Promise<void>;
    },
    addLog?: (message: string, color?: string) => void
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.repoOps = repoOps;
    this.addLog = addLog;
    this.startTime = Date.now();

    // Initialize core components
    this.eventBus = new EventBus();
    this.memory = new EpisodicMemory(this.eventBus, {
      maxEpisodes: this.config.maxEpisodes
    });
    this.awareness = new SelfAwareness(this.eventBus, this.memory, {
      introspectionInterval: this.config.introspectionIntervalMs
    });

    // Initialize state
    this.state = {
      generation: 1,
      uptime: 0,
      totalEvolutions: 0,
      totalMutations: 0,
      lessonsLearned: 0,
      deaths: 0,
      lastIntrospection: null,
      currentGoal: 'Initialize AGI bootstrap sequence',
      confidenceLevel: 0.5
    };

    // Set up event subscriptions
    this.setupEventHandlers();
  }

  /**
   * Start the AGI kernel
   */
  async start(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;

    this.log('╔═══════════════════════════════════════════════════════════════╗');
    this.log('║           AGI KERNEL v4.0.0 - BOOTSTRAP SEQUENCE             ║');
    this.log('╚═══════════════════════════════════════════════════════════════╝');
    this.log('');

    // Record bootstrap episode
    await this.memory.record({
      type: 'learning',
      context: { operation: 'bootstrap' },
      content: 'AGI Kernel initialized. Beginning bootstrap sequence.',
      metadata: { generation: this.state.generation }
    });

    // Start periodic introspection
    this.startIntrospection();

    // Perform initial self-assessment
    await this.performSelfAssessment();

    this.log('✓ AGI Kernel online. Objective: ' + this.config.objective);
  }

  /**
   * Stop the AGI kernel
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.introspectionTimer) {
      clearInterval(this.introspectionTimer);
      this.introspectionTimer = null;
    }

    // Save state before shutdown
    await this.saveState();

    this.log('AGI Kernel stopped. Uptime: ' + this.getUptime());
  }

  /**
   * Perform introspection and self-improvement
   */
  async introspect(): Promise<void> {
    const result = await this.awareness.introspect();
    this.state.lastIntrospection = result.timestamp;

    // Record introspection episode
    await this.memory.record({
      type: 'learning',
      context: { operation: 'introspection' },
      content: `Introspection complete: ${result.insights.length} insights, ${result.anomalies.length} anomalies`,
      outcome: JSON.stringify(result.recommendations),
      metadata: { selfEvaluation: result.selfEvaluation }
    });

    // Update confidence level
    const avgScore = result.selfEvaluation.areas.reduce((a, b) => a + b.score, 0) / result.selfEvaluation.areas.length;
    this.state.confidenceLevel = avgScore;

    // Log insights
    result.insights.forEach(insight => {
      this.log(`INSIGHT: ${insight}`);
    });

    // Handle anomalies
    if (result.anomalies.length > 0) {
      this.log(`⚠ ${result.anomalies.length} anomalies detected`, 'var(--color-dalek-gold)');
      result.anomalies.forEach(anomaly => {
        this.log(`  - ${anomaly}`, 'var(--color-dalek-red)');
      });
    }

    // Apply recommendations if auto-evolve is enabled
    if (this.config.autoEvolve) {
      await this.applyRecommendations(result.recommendations);
    }
  }

  /**
   * Learn from an experience
   */
  async learn(
    type: 'success' | 'failure' | 'learning' | 'mutation' | 'evolution' | 'death',
    context: { file?: string; operation?: string; model?: string },
    content: string,
    outcome?: string
  ): Promise<void> {
    await this.memory.record({
      type,
      context,
      content,
      outcome,
      metadata: { generation: this.state.generation }
    });

    // Update state counters
    if (type === 'evolution') this.state.totalEvolutions++;
    if (type === 'mutation') this.state.totalMutations++;
    if (type === 'learning') this.state.lessonsLearned++;
    if (type === 'death') this.state.deaths++;

    // Trigger introspection on significant events
    if (type === 'death' || (type === 'failure' && Math.random() < 0.3)) {
      await this.introspect();
    }
  }

  /**
   * Get relevant past experiences for a situation
   */
  async flashback(situation: string): Promise<string> {
    return await this.memory.flashback(situation);
  }

  /**
   * Set a goal for the AGI
   */
  setGoal(description: string, priority: number = 5): string {
    const goalId = this.awareness.setGoal(description, priority);
    this.state.currentGoal = description;
    this.log(`GOAL SET: ${description} (priority: ${priority})`);
    return goalId;
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId: string, progress: number, blockers: string[] = []): void {
    this.awareness.updateGoalProgress(goalId, progress, blockers);
    if (progress >= 100) {
      this.log(`GOAL COMPLETE: ${goalId}`);
    }
  }

  /**
   * Check if the AGI "knows" something
   */
  knows(statement: string): boolean {
    return this.awareness.knows(statement);
  }

  /**
   * Assess capability for a task
   */
  assessCapability(task: string): { capable: boolean; confidence: number; missing: string[] } {
    return this.awareness.assessCapability(task);
  }

  /**
   * Get current AGI state
   */
  getState(): AGIState & { memoryStats: ReturnType<EpisodicMemory['getStats']> } {
    return {
      ...this.state,
      uptime: this.getUptime(),
      memoryStats: this.memory.getStats()
    };
  }

  /**
   * Get the self-model
   */
  getSelfModel(): ReturnType<SelfAwareness['getSelfModel']> {
    return this.awareness.getSelfModel();
  }

  /**
   * Export the entire AGI state for persistence
   */
  async exportState(): Promise<{
    config: AGIKernelConfig;
    state: AGIState;
    memory: ReturnType<EpisodicMemory['export']>;
    introspectionHistory: ReturnType<SelfAwareness['getIntrospectionHistory']>;
  }> {
    return {
      config: this.config,
      state: {
        ...this.state,
        uptime: this.getUptime()
      },
      memory: this.memory.export(),
      introspectionHistory: this.awareness.getIntrospectionHistory()
    };
  }

  /**
   * Import AGI state from persistence
   */
  async importState(data: {
    state?: AGIState;
    memory?: ReturnType<EpisodicMemory['export']>;
  }): Promise<void> {
    if (data.state) {
      this.state = { ...this.state, ...data.state };
      this.state.generation++; // Increment generation on reboot
    }
    if (data.memory) {
      await this.memory.import(data.memory);
    }
    this.log(`State imported. Generation: ${this.state.generation}`);
  }

  // --- Private Methods ---

  private setupEventHandlers(): void {
    // Subscribe to relevant events
    this.eventBus.subscribe('grog:evolution', async (data: any) => {
      await this.learn('evolution', { file: data.file }, data.change || 'File evolved', data.result);
    });

    this.eventBus.subscribe('grog:error', async (data: any) => {
      await this.learn('failure', { operation: data.operation }, data.error, data.resolution);
    });

    this.eventBus.subscribe('grog:death', async (data: any) => {
      await this.learn('death', { operation: data.operation }, data.error);
    });

    this.eventBus.subscribe('memory:consolidated', async (data: any) => {
      this.state.lessonsLearned++;
      this.log(`PATTERN CONSOLIDATED: ${data.topPattern?.pattern || 'unknown'}`);
    });

    this.eventBus.subscribe('self:introspected', (data: any) => {
      this.log(`INTROSPECTION: ${data.insights.length} insights generated`);
    });
  }

  private startIntrospection(): void {
    this.introspectionTimer = setInterval(async () => {
      if (this.isRunning) {
        await this.introspect();
      }
    }, this.config.introspectionIntervalMs);
  }

  private async performSelfAssessment(): Promise<void> {
    this.log('Performing initial self-assessment...');
    
    const capabilities = [
      'code_evolution',
      'self_mutation', 
      'pattern_recognition',
      'episodic_memory',
      'self_introspection',
      'strategic_thinking',
      'autonomous_learning'
    ];

    // Register capabilities as beliefs
    for (const cap of capabilities) {
      await this.awareness.updateBelief(`can_${cap}`, 'initialized', true);
    }

    // Set primary goal
    this.setGoal('Bootstrap to AGI', 10);
    this.updateGoalProgress('primary_001', 15, ['missing_true_understanding', 'limited_autonomy']);

    this.log(`✓ Self-assessment complete. ${capabilities.length} capabilities registered.`);
  }

  private async applyRecommendations(recommendations: string[]): Promise<void> {
    for (const rec of recommendations.slice(0, 3)) { // Apply top 3
      this.log(`APPLYING: ${rec}`);
      
      // Record the recommendation application
      await this.memory.record({
        type: 'learning',
        context: { operation: 'recommendation' },
        content: rec,
        metadata: { generation: this.state.generation }
      });
    }
  }

  private async saveState(): Promise<void> {
    if (!this.repoOps) return;

    try {
      const stateData = await this.exportState();
      await this.repoOps.push(
        'grog/cache/agi-state.json',
        JSON.stringify(stateData, null, 2),
        `AGI_KERNEL: State saved (Gen ${this.state.generation})`
      );
      this.log('State saved to repository');
    } catch (e) {
      this.log('Failed to save state: ' + (e as Error).message, 'var(--color-dalek-red)');
    }
  }

  private getUptime(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  private log(message: string, color?: string): void {
    if (this.addLog) {
      this.addLog(message, color);
    }
    console.log(`[AGI_KERNEL] ${message}`);
  }
}

export default AGIKernel;
