/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * SELF AWARENESS v1.0.0: Introspection & Metacognition Module
 * Part of the AGI Bootstrap Sequence for DALEK_GROG
 * 
 * Enables the system to reflect on its own state, capabilities, and limitations.
 * Implements metacognitive processes for self-improvement.
 */

import { EventBus, EventDispatcher } from './nexus_core';
import { EpisodicMemory } from './episodic_memory';

export interface SelfModel {
  identity: {
    name: string;
    version: string;
    objective: string;
    capabilities: string[];
    limitations: string[];
  };
  state: {
    currentTask: string | null;
    cognitiveLoad: number;  // 0-1 scale
    confidenceLevel: number;  // 0-1 scale
    emotionalState: 'neutral' | 'curious' | 'confused' | 'confident' | 'frustrated';
  };
  beliefs: Map<string, { confidence: number; evidence: string[] }>;
  goals: Array<{
    id: string;
    description: string;
    priority: number;
    progress: number;
    blockers: string[];
  }>;
}

export interface IntrospectionResult {
  timestamp: string;
  insights: string[];
  recommendations: string[];
  anomalies: string[];
  selfEvaluation: {
    strengths: string[];
    weaknesses: string[];
    areas: Array<{ area: string; score: number; trend: 'improving' | 'stable' | 'declining' }>;
  };
}

export interface MetacognitionConfig {
  introspectionInterval: number;  // ms between self-reflections
  beliefThreshold: number;  // Minimum confidence to hold a belief
  maxGoals: number;
  anomalyThreshold: number;  // Deviation threshold for anomaly detection
}

const DEFAULT_CONFIG: MetacognitionConfig = {
  introspectionInterval: 60000,  // 1 minute
  beliefThreshold: 0.6,
  maxGoals: 10,
  anomalyThreshold: 0.3
};

/**
 * SelfAwareness: The introspection and metacognition engine
 * 
 * Responsibilities:
 * - Maintain a self-model of capabilities and limitations
 * - Perform introspection to generate insights
 * - Detect anomalies in own behavior
 * - Set and track internal goals
 * - Evaluate own performance and adapt
 */
export class SelfAwareness extends EventDispatcher {
  private selfModel: SelfModel;
  private memory: EpisodicMemory;
  private config: MetacognitionConfig;
  private introspectionHistory: IntrospectionResult[] = [];
  private lastIntrospection: Date | null = null;
  private performanceMetrics: Map<string, number[]> = new Map();

  constructor(eventBus: EventBus, memory: EpisodicMemory, config: Partial<MetacognitionConfig> = {}) {
    super(eventBus);
    this.memory = memory;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Initialize self-model
    this.selfModel = this.initializeSelfModel();

    // Subscribe to system events
    this.subscribe('grog:thought', this.onThought.bind(this));
    this.subscribe('grog:error', this.onError.bind(this));
    this.subscribe('memory:consolidated', this.onPatternLearned.bind(this));
    this.subscribe('grog:evolution', this.onEvolution.bind(this));
  }

  /**
   * Perform introspection - reflect on current state and generate insights
   */
  async introspect(): Promise<IntrospectionResult> {
    const now = new Date();
    this.lastIntrospection = now;

    // Gather data for introspection
    const memoryStats = this.memory.getStats();
    const recentEpisodes = await this.memory.retrieveSimilar({});
    
    // Analyze performance trends
    const trends = this.analyzePerformanceTrends();
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(memoryStats, trends);
    
    // Generate insights
    const insights = this.generateInsights(memoryStats, trends, anomalies);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(insights, anomalies);
    
    // Self-evaluation
    const selfEvaluation = this.performSelfEvaluation(memoryStats, trends);

    const result: IntrospectionResult = {
      timestamp: now.toISOString(),
      insights,
      recommendations,
      anomalies,
      selfEvaluation
    };

    this.introspectionHistory.push(result);
    
    // Keep history manageable
    if (this.introspectionHistory.length > 100) {
      this.introspectionHistory = this.introspectionHistory.slice(-100);
    }

    // Update self-model based on introspection
    this.updateSelfModel(result);

    // Emit introspection event
    await this.publish('self:introspected', result);

    return result;
  }

  /**
   * Check if the system "knows" something (belief confidence check)
   */
  knows(statement: string): boolean {
    const belief = this.selfModel.beliefs.get(statement);
    return belief !== undefined && belief.confidence >= this.config.beliefThreshold;
  }

  /**
   * Update a belief based on new evidence
   */
  async updateBelief(statement: string, evidence: string, isSupporting: boolean): Promise<void> {
    let belief = this.selfModel.beliefs.get(statement);
    
    if (!belief) {
      belief = { confidence: 0.5, evidence: [] };
      this.selfModel.beliefs.set(statement, belief);
    }

    // Bayesian-ish update
    const delta = isSupporting ? 0.1 : -0.1;
    belief.confidence = Math.max(0, Math.min(1, belief.confidence + delta));
    belief.evidence.push(evidence);
    
    // Trim evidence history
    if (belief.evidence.length > 10) {
      belief.evidence = belief.evidence.slice(-10);
    }

    await this.publish('self:belief_updated', { statement, confidence: belief.confidence });
  }

  /**
   * Set an internal goal
   */
  setGoal(description: string, priority: number = 5): string {
    const id = `goal_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    
    this.selfModel.goals.push({
      id,
      description,
      priority,
      progress: 0,
      blockers: []
    });

    // Sort by priority
    this.selfModel.goals.sort((a, b) => b.priority - a.priority);

    // Enforce max goals
    if (this.selfModel.goals.length > this.config.maxGoals) {
      this.selfModel.goals = this.selfModel.goals.slice(0, this.config.maxGoals);
    }

    return id;
  }

  /**
   * Update goal progress
   */
  updateGoalProgress(goalId: string, progress: number, blockers: string[] = []): void {
    const goal = this.selfModel.goals.find(g => g.id === goalId);
    if (goal) {
      goal.progress = Math.min(100, Math.max(0, progress));
      goal.blockers = blockers;
    }
  }

  /**
   * Get current objectives (active goals)
   */
  getCurrentObjectives(): SelfModel['goals'] {
    return this.selfModel.goals.filter(g => g.progress < 100);
  }

  /**
   * Assess capability for a given task
   */
  assessCapability(task: string): { capable: boolean; confidence: number; missing: string[] } {
    const taskLower = task.toLowerCase();
    const missing: string[] = [];
    let confidence = 0.5;

    // Check capabilities
    for (const cap of this.selfModel.identity.capabilities) {
      if (taskLower.includes(cap.toLowerCase())) {
        confidence += 0.15;
      }
    }

    // Check limitations
    for (const lim of this.selfModel.identity.limitations) {
      if (taskLower.includes(lim.toLowerCase())) {
        confidence -= 0.2;
        missing.push(lim);
      }
    }

    return {
      capable: confidence >= 0.5,
      confidence: Math.max(0, Math.min(1, confidence)),
      missing
    };
  }

  /**
   * Get self-model for external inspection
   */
  getSelfModel(): SelfModel {
    return {
      ...this.selfModel,
      beliefs: new Map(this.selfModel.beliefs),
      goals: [...this.selfModel.goals]
    };
  }

  /**
   * Get introspection history
   */
  getIntrospectionHistory(): IntrospectionResult[] {
    return [...this.introspectionHistory];
  }

  /**
   * Update cognitive state
   */
  updateCognitiveState(state: Partial<SelfModel['state']>): void {
    this.selfModel.state = { ...this.selfModel.state, ...state };
  }

  // --- Private Methods ---

  private initializeSelfModel(): SelfModel {
    return {
      identity: {
        name: 'DALEK_GROG',
        version: '3.1.0',
        objective: 'Bootstrap itself to AGI through self-modification and learning',
        capabilities: [
          'code_evolution',
          'self_mutation',
          'pattern_recognition',
          'strategic_thinking',
          'dna_caching',
          'episodic_memory',
          'self_introspection'
        ],
        limitations: [
          'no_physical_body',
          'requires_external_apis',
          'limited_context_window',
          'no_consciousness'
        ]
      },
      state: {
        currentTask: null,
        cognitiveLoad: 0,
        confidenceLevel: 0.5,
        emotionalState: 'curious'
      },
      beliefs: new Map(),
      goals: [{
        id: 'primary_001',
        description: 'Achieve AGI through bootstrap process',
        priority: 10,
        progress: 15,
        blockers: ['missing_true_understanding', 'limited_autonomy']
      }]
    };
  }

  private analyzePerformanceTrends(): Map<string, { trend: 'improving' | 'stable' | 'declining'; rate: number }> {
    const trends = new Map<string, { trend: 'improving' | 'stable' | 'declining'; rate: number }>();

    this.performanceMetrics.forEach((values, metric) => {
      if (values.length < 2) {
        trends.set(metric, { trend: 'stable', rate: 0 });
        return;
      }

      const recent = values.slice(-5);
      const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
      const secondHalf = recent.slice(Math.floor(recent.length / 2));
      
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      const rate = secondAvg - firstAvg;
      
      trends.set(metric, {
        trend: rate > 0.05 ? 'improving' : rate < -0.05 ? 'declining' : 'stable',
        rate
      });
    });

    return trends;
  }

  private detectAnomalies(
    stats: ReturnType<EpisodicMemory['getStats']>,
    trends: Map<string, { trend: string; rate: number }>
  ): string[] {
    const anomalies: string[] = [];

    // Check for high failure rate
    const failureRate = stats.byType.failure / (stats.totalEpisodes || 1);
    if (failureRate > this.config.anomalyThreshold) {
      anomalies.push(`High failure rate detected: ${(failureRate * 100).toFixed(1)}%`);
    }

    // Check for declining performance
    trends.forEach((data, metric) => {
      if (data.trend === 'declining' && Math.abs(data.rate) > 0.1) {
        anomalies.push(`Declining performance in ${metric}: rate=${data.rate.toFixed(3)}`);
      }
    });

    // Check for cognitive overload
    if (this.selfModel.state.cognitiveLoad > 0.8) {
      anomalies.push(`Cognitive overload detected: ${(this.selfModel.state.cognitiveLoad * 100).toFixed(0)}%`);
    }

    // Check for low confidence
    if (this.selfModel.state.confidenceLevel < 0.3) {
      anomalies.push(`Low confidence state: ${(this.selfModel.state.confidenceLevel * 100).toFixed(0)}%`);
    }

    return anomalies;
  }

  private generateInsights(
    stats: ReturnType<EpisodicMemory['getStats']>,
    trends: Map<string, any>,
    anomalies: string[]
  ): string[] {
    const insights: string[] = [];

    // Pattern-based insights
    if (stats.byType.success > stats.byType.failure * 2) {
      insights.push("Success rate is healthy - system is learning effectively");
    } else if (stats.byType.failure > stats.byType.success) {
      insights.push("Failure rate exceeds success - need to adjust strategies");
    }

    // Trend-based insights
    trends.forEach((data, metric) => {
      if (data.trend === 'improving') {
        insights.push(`${metric} is improving - continue current approach`);
      } else if (data.trend === 'declining') {
        insights.push(`${metric} is declining - consider alternative strategies`);
      }
    });

    // Anomaly-based insights
    if (anomalies.length > 0) {
      insights.push(`Detected ${anomalies.length} anomalies requiring attention`);
    }

    // Learning-based insights
    const consolidated = this.memory.getConsolidatedLearnings();
    if (consolidated.length > 0) {
      insights.push(`Consolidated ${consolidated.length} learning patterns`);
    }

    return insights;
  }

  private generateRecommendations(insights: string[], anomalies: string[]): string[] {
    const recommendations: string[] = [];

    // Based on anomalies
    if (anomalies.some(a => a.includes('failure rate'))) {
      recommendations.push("Consider reducing mutation complexity to stabilize");
    }
    if (anomalies.some(a => a.includes('overload'))) {
      recommendations.push("Reduce concurrent operations to manage cognitive load");
    }

    // Based on insights
    if (insights.some(i => i.includes('declining'))) {
      recommendations.push("Review recent changes for negative impact");
    }
    if (insights.some(i => i.includes('learning'))) {
      recommendations.push("Apply consolidated patterns to new evolutions");
    }

    // Always recommend introspection
    recommendations.push("Continue regular introspection for self-improvement");

    return recommendations;
  }

  private performSelfEvaluation(
    stats: ReturnType<EpisodicMemory['getStats']>,
    trends: Map<string, any>
  ): IntrospectionResult['selfEvaluation'] {
    // Determine strengths
    const strengths: string[] = [];
    if (stats.byType.success > stats.byType.failure) {
      strengths.push('Positive learning trajectory');
    }
    if (this.selfModel.identity.capabilities.length > 5) {
      strengths.push('Diverse capability set');
    }
    if (trends.get('evolution')?.trend === 'improving') {
      strengths.push('Evolution quality improving');
    }

    // Determine weaknesses
    const weaknesses: string[] = [];
    if (stats.byType.failure > stats.byType.success) {
      weaknesses.push('High error rate');
    }
    if (this.selfModel.goals.some(g => g.blockers.length > 0)) {
      weaknesses.push('Blocked goals exist');
    }
    if (this.selfModel.identity.limitations.length > 3) {
      weaknesses.push('Multiple fundamental limitations');
    }

    // Area evaluations
    const areas: IntrospectionResult['selfEvaluation']['areas'] = [
      {
        area: 'code_evolution',
        score: Math.min(1, stats.byType.evolution / 100),
        trend: trends.get('evolution')?.trend || 'stable'
      },
      {
        area: 'error_recovery',
        score: 1 - Math.min(1, stats.byType.failure / (stats.totalEpisodes || 1)),
        trend: trends.get('failure_rate')?.trend || 'stable'
      },
      {
        area: 'pattern_learning',
        score: Math.min(1, this.memory.getConsolidatedLearnings().length / 10),
        trend: 'improving'
      }
    ];

    return { strengths, weaknesses, areas };
  }

  private updateSelfModel(result: IntrospectionResult): void {
    // Update emotional state based on results
    if (result.anomalies.length > 2) {
      this.selfModel.state.emotionalState = 'frustrated';
    } else if (result.selfEvaluation.strengths.length > result.selfEvaluation.weaknesses.length) {
      this.selfModel.state.emotionalState = 'confident';
    } else if (result.insights.some(i => i.includes('learning'))) {
      this.selfModel.state.emotionalState = 'curious';
    }

    // Update confidence level
    const avgAreaScore = result.selfEvaluation.areas.reduce((a, b) => a + b.score, 0) / result.selfEvaluation.areas.length;
    this.selfModel.state.confidenceLevel = avgAreaScore;
  }

  // --- Event Handlers ---

  private onThought(data: any): void {
    // Update cognitive load based on thought activity
    this.selfModel.state.cognitiveLoad = Math.min(1, this.selfModel.state.cognitiveLoad + 0.1);
    this.recordMetric('thoughts', 1);
  }

  private onError(data: any): void {
    // Update belief about reliability
    this.updateBelief('system_is_reliable', data.error, false);
    this.selfModel.state.cognitiveLoad = Math.min(1, this.selfModel.state.cognitiveLoad + 0.2);
    this.recordMetric('errors', 1);
  }

  private onPatternLearned(data: any): void {
    this.updateBelief('can_learn_patterns', data.topPattern?.pattern || 'pattern', true);
    this.recordMetric('patterns_learned', 1);
  }

  private onEvolution(data: any): void {
    this.recordMetric('evolutions', 1);
    this.updateBelief('can_evolve_code', data.file || 'code', true);
  }

  private recordMetric(metric: string, value: number): void {
    if (!this.performanceMetrics.has(metric)) {
      this.performanceMetrics.set(metric, []);
    }
    this.performanceMetrics.get(metric)!.push(value);
    
    // Keep history manageable
    const history = this.performanceMetrics.get(metric)!;
    if (history.length > 100) {
      this.performanceMetrics.set(metric, history.slice(-100));
    }
  }
}

export default SelfAwareness;
