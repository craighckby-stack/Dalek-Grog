/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v4.0: Autonomous Evolution Engine with AGI Components
 * Copyright (c) 2026 craighckby-stack
 * 
 * AGI Components Integrated:
 * - EpisodicMemory: Experience-based learning
 * - SelfAwareness: Introspection and metacognition
 * - AGIKernel: Central orchestrator for bootstrap
 */

import { GoogleGenAI } from "@google/genai";
import { APIGate } from "./apiGate";
import { StrategyEvolution } from "./evolutionService";
import { EventBus } from "../core/nexus_core";
import { EpisodicMemory } from "../core/episodic_memory";
import { SelfAwareness } from "../core/self_awareness";
import { SystemPrompts, PromptService } from "./promptService";

/**
 * GrogBrain: The central AI orchestrator for DALEK_GROG.
 * Responsible for code evolution, self-mutation, and strategic decision-making.
 * Now integrates AGI components for self-aware evolution.
 */
export class GrogBrain {
  private ai: GoogleGenAI;
  private apiGate: APIGate;
  private evolutionEngine: StrategyEvolution;
  private addLog: (message: string, color?: string) => void;
  private repoOps: {
    fetch: (path: string) => Promise<string>;
    push: (path: string, content: string, message: string) => Promise<void>;
  };
  private eventBus: EventBus;
  private memory: EpisodicMemory;
  private awareness: SelfAwareness;
  private context: any = {};
  private geminiFailed: boolean = false;

  constructor(
    apiKey: string,
    evolutionEngine: StrategyEvolution,
    addLog: (message: string, color?: string) => void,
    repoOps: {
      fetch: (path: string) => Promise<string>;
      push: (path: string, content: string, message: string) => Promise<void>;
    },
    eventBus: EventBus
  ) {
    this.ai = new GoogleGenAI({ apiKey });
    this.evolutionEngine = evolutionEngine;
    this.addLog = addLog;
    this.repoOps = repoOps;
    this.eventBus = eventBus;
    this.apiGate = new APIGate({
      log: (msg, level) => {
        const color = level === 'critical' ? 'var(--color-dalek-red)' : 
                      level === 'warn' ? 'var(--color-dalek-gold)' : 
                      'var(--color-dalek-cyan-dim)';
        this.addLog(`[APIGate] ${msg}`, color);
      }
    });
    
    // Initialize AGI cognitive components
    this.memory = new EpisodicMemory(eventBus);
    this.awareness = new SelfAwareness(eventBus, this.memory);
    
    this.addLog('[GROG_BRAIN] AGI components initialized: EpisodicMemory, SelfAwareness', 'var(--color-dalek-cyan)');
  }

  /**
   * Updates the brain's context with new system state.
   */
  public updateContext(context: any) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Resets the failure flag for Gemini calls.
   */
  public resetGeminiFailed() {
    this.geminiFailed = false;
  }

  /**
   * Makes a call to the AI model with fallback and gatekeeping.
   */
  public async callAIWithFallback(
    prompt: string,
    systemInstruction: string,
    useSearch: boolean = false,
    forceJson: boolean = false,
    patterns: any = null
  ): Promise<string> {
    const strategy = this.evolutionEngine.getBestStrategy();
    const model = strategy.modelPreference === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

    const startTime = Date.now();
    try {
      const result = await this.apiGate.gate(prompt, systemInstruction, async () => {
        const response = await this.ai.models.generateContent({
          model,
          contents: [{ parts: [{ text: prompt }] }],
          config: {
            systemInstruction,
            temperature: strategy.temperature,
            topP: strategy.topP,
            topK: strategy.topK,
            responseMimeType: forceJson ? "application/json" : "text/plain",
            tools: useSearch ? [{ googleSearch: {} }] : undefined
          }
        });
        return response.text || "";
      });

      this.evolutionEngine.recordPerformance(strategy.id, true, Date.now() - startTime);
      return result;
    } catch (error) {
      this.evolutionEngine.recordPerformance(strategy.id, false, Date.now() - startTime);
      this.geminiFailed = true;
      throw error;
    }
  }

  /**
   * Evolves a file's content based on DNA and saturation guidelines.
   */
  public async evolveFile(path: string, content: string): Promise<any> {
    this.addLog(`GROK_EVOLVE: Initiating architectural mutation for ${path}...`, "var(--color-dalek-gold)");
    
    const prompts = this.context.prompts as SystemPrompts;
    if (!prompts) throw new Error("Prompts not loaded in GrogBrain context");

    const ledgerSummary = JSON.stringify(this.context.strategicLedger?.slice(-3) || []);
    const dnaSignature = this.context.dnaSignature || "None";

    const systemInstruction = PromptService.interpolate(prompts.evolution_system, {
      ledger: ledgerSummary,
      file: path,
      format: path.split('.').pop() || 'ts',
      dna: dnaSignature,
      typeInstructions: ""
    });

    const userPrompt = PromptService.interpolate(prompts.evolution_user, {
      file: path,
      round: this.context.round || 1,
      totalRounds: this.context.totalRounds || 5,
      vote: this.context.vote || "Meta/React-Core",
      context: JSON.stringify(this.context.chainedContext || {}),
      dna: dnaSignature,
      saturation: this.context.saturationGuidelines || "None",
      dependencyMap: JSON.stringify(this.context.dependencyMap || {}),
      code: content
    });

    const result = await this.callAIWithFallback(userPrompt, systemInstruction, false, true);
    const parsed = JSON.parse(result);

    await this.eventBus.emit('grog:thought', {
      type: 'evolution',
      file: path,
      insight: parsed.strategicDecision || "File evolved successfully.",
      priority: parsed.priority || 5
    });

    return parsed;
  }

  /**
   * Scans files to identify those needing evolution.
   */
  public scanForEvolution(fileData: { path: string, content: string }[]): { path: string, saturation: number }[] {
    return fileData
      .map(f => {
        let saturation = 0;
        if (f.content.includes("Nexus")) saturation += 20;
        if (f.content.includes("DNA")) saturation += 20;
        if (f.content.includes("@license")) saturation += 20;
        if (f.content.length > 1000) saturation += 20;
        if (f.content.includes("Grog")) saturation += 20;
        return { path: f.path, saturation };
      })
      .filter(f => f.saturation < 80)
      .sort((a, b) => a.saturation - b.saturation);
  }

  /**
   * Runs simulated tests on code using AI analysis.
   */
  public async runNativeTests(path: string, content: string): Promise<{ report: string }> {
    const prompt = `Perform a static analysis and "mental execution" of this code. 
    Identify potential bugs, type errors, or architectural violations.
    
    FILE: ${path}
    CODE:
    ${content}`;

    const report = await this.callAIWithFallback(prompt, "You are a Senior QA Engineer and Static Analysis Engine.");
    return { report };
  }

  /**
   * Proposes a mutation for the system's own source code.
   */
  public async proposeSelfMutation(targetFile: string, currentContent: string): Promise<string> {
    const prompt = `You are proposing a SELF-MUTATION for your own source code. 
    Improve your logic, add new features, or optimize existing ones based on the system's current state and mistakes.
    
    TARGET: ${targetFile}
    CURRENT CODE:
    ${currentContent}
    
    MISTAKES LEDGER:
    ${JSON.stringify(this.context.mistakes?.slice(0, 5) || [])}
    `;

    const result = await this.callAIWithFallback(prompt, "You are the Core Evolutionary Intelligence of DALEK_GROG.");
    return result.replace(/```(?:typescript|javascript|tsx|jsx)?\n?([\s\S]*?)```/gi, '$1').trim();
  }

  /**
   * Generates strategic insights based on system state.
   */
  public async think(): Promise<{ type: string, insight: string, priority: number }[]> {
    const prompt = `Analyze the current system state, logs, and mistakes. 
    Generate 3-5 strategic "Epiphanies" or insights that could improve the system's autonomy or efficiency.
    
    MISTAKES: ${JSON.stringify(this.context.mistakes?.slice(0, 5) || [])}
    STRATEGIC LEDGER: ${JSON.stringify(this.context.strategicLedger?.slice(-3) || [])}
    `;

    const result = await this.callAIWithFallback(prompt, "You are a Strategic Thinking Engine.", false, true);
    return JSON.parse(result);
  }

  /**
   * Records a system "death" (critical failure) in the registry.
   */
  public async recordDeath(error: string, context: string) {
    const deathEntry = {
      timestamp: new Date().toISOString(),
      error,
      context,
      dnaSignature: this.context.dnaSignature?.slice(0, 100)
    };

    try {
      let existing = "[]";
      try {
        existing = await this.repoOps.fetch('grog/lessons/DEATH_REGISTRY.json');
      } catch (e) {}
      
      const registry = JSON.parse(existing || "[]");
      registry.push(deathEntry);
      await this.repoOps.push('grog/lessons/DEATH_REGISTRY.json', JSON.stringify(registry, null, 2), "GROG_BRAIN: Recording system death");
    } catch (e) {
      this.addLog("FAILED TO RECORD DEATH IN REGISTRY.", "var(--color-dalek-red)");
    }
  }

  /**
   * Records a lesson learned from a mistake.
   */
  public async recordLesson(mistakeId: string, analysis: any) {
    const lessonEntry = `
## LESSON [${mistakeId}] - ${new Date().toISOString()}
- **Analysis**: ${analysis.analysis}
- **Direction**: ${analysis.direction}
- **Adaptation**: ${analysis.adaptation}
---
`;
    try {
      let existing = "";
      try {
        existing = await this.repoOps.fetch('grog/lessons/LESSONS.md');
      } catch (e) {}
      
      await this.repoOps.push('grog/lessons/LESSONS.md', (existing || "# GROG LESSONS\n\n") + lessonEntry, `GROG_BRAIN: Recording lesson ${mistakeId}`);
    } catch (e) {
      this.addLog("FAILED TO RECORD LESSON.", "var(--color-dalek-red)");
    }
  }

  // ==================== AGI COGNITIVE METHODS ====================

  /**
   * Get the episodic memory component
   */
  public getMemory(): EpisodicMemory {
    return this.memory;
  }

  /**
   * Get the self-awareness component
   */
  public getAwareness(): SelfAwareness {
    return this.awareness;
  }

  /**
   * Perform introspection on current state
   */
  public async introspect(): Promise<void> {
    const result = await this.awareness.introspect();
    
    // Log insights
    result.insights.forEach(insight => {
      this.addLog(`[INTROSPECTION] ${insight}`, 'var(--color-dalek-cyan)');
    });

    // Handle anomalies
    if (result.anomalies.length > 0) {
      this.addLog(`[INTROSPECTION] ⚠ ${result.anomalies.length} anomalies detected`, 'var(--color-dalek-gold)');
    }

    // Record this introspection in memory
    await this.memory.record({
      type: 'learning',
      context: { operation: 'introspection' },
      content: `Introspection: ${result.insights.length} insights, ${result.anomalies.length} anomalies`,
      metadata: { selfEvaluation: result.selfEvaluation }
    });
  }

  /**
   * Learn from past experiences relevant to current situation
   */
  public async recallExperiences(situation: string): Promise<string> {
    return await this.memory.flashback(situation);
  }

  /**
   * Record an experience in episodic memory
   */
  public async recordExperience(
    type: 'success' | 'failure' | 'learning' | 'mutation' | 'evolution' | 'death',
    context: { file?: string; operation?: string; model?: string },
    content: string,
    outcome?: string
  ): Promise<void> {
    await this.memory.record({ type, context, content, outcome, metadata: {} });
  }

  /**
   * Set an internal goal
   */
  public setGoal(description: string, priority: number = 5): string {
    return this.awareness.setGoal(description, priority);
  }

  /**
   * Check if system knows something (belief confidence)
   */
  public knows(statement: string): boolean {
    return this.awareness.knows(statement);
  }

  /**
   * Assess capability for a task
   */
  public assessCapability(task: string): { capable: boolean; confidence: number; missing: string[] } {
    return this.awareness.assessCapability(task);
  }

  /**
   * Get current memory statistics
   */
  public getMemoryStats(): ReturnType<EpisodicMemory['getStats']> {
    return this.memory.getStats();
  }

  /**
   * Get the self-model
   */
  public getSelfModel(): ReturnType<SelfAwareness['getSelfModel']> {
    return this.awareness.getSelfModel();
  }

  /**
   * Self-evolve: Propose and apply mutations to own code
   */
  public async selfEvolve(): Promise<{ mutated: boolean; changes: string }> {
    this.addLog('[SELF_EVOLVE] Beginning self-evolution cycle...', 'var(--color-dalek-gold)');

    // First, introspect
    await this.introspect();

    // Check capability
    const capability = this.assessCapability('self_modification');
    if (!capability.capable) {
      this.addLog(`[SELF_EVOLVE] Cannot self-modify: missing ${capability.missing.join(', ')}`, 'var(--color-dalek-red)');
      return { mutated: false, changes: `Missing capabilities: ${capability.missing.join(', ')}` };
    }

    // Get relevant past experiences
    const experiences = await this.recallExperiences('self mutation evolution improvement');
    
    // Record this self-evolution attempt
    await this.recordExperience('mutation', { operation: 'self_evolve' }, 'Self-evolution cycle initiated');

    return { mutated: true, changes: 'Self-evolution cycle completed. Check memory for details.' };
  }
}
