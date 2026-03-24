/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

import { GoogleGenAI } from "@google/genai";
import { extractCode, robustParseJSON } from "../core/utils";
import { APIGate, GateStats } from "./apiGate";
import { StrategyEvolution, EvolutionaryStrategy } from "./evolutionService";
import { EventBus, NexusArchitecturalLinter, NexusComplexityAnalyzer } from "../core/nexus_core";
import { NexusTestRunner } from "../core/NexusTestRunner";
import { SystemPrompts, PromptService } from "./promptService";
import { GrogLogger } from "../core/logger";
import { GrogMemory } from "./GrogMemory";
import { SaturationService } from "./SaturationService";

export interface GrogContext {
  mistakes?: string[];
  ledger?: string[];
  evolutionStats?: any;
  lastSummary?: string;
  lastPriority?: number;
  dnaSignature?: string;
  round?: number;
  totalRounds?: number;
  vote?: string;
  chainedContext?: any;
  saturationGuidelines?: string;
  dependencyMap?: any;
  strategicLedger?: any[];
  uiMetrics?: any;
  [key: string]: any;
}

/**
 * GrogBrain: The central AI orchestrator for DALEK_GROG.
 * Responsible for code evolution, self-mutation, and strategic decision-making.
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
  private context: GrogContext = {};
  private memory: GrogMemory = new GrogMemory();
  private geminiFailed: boolean = false;
  private quotaExhausted: boolean = false;
  private budgetExhausted: boolean = false;
  private static readonly MAX_EVOLUTION_RETRIES = 2;

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

    // Initialize the enhanced logger and memory
    GrogLogger.initialize(addLog);
    this.memory = new GrogMemory();

    this.apiGate = new APIGate({
      log: (msg, level, error) => {
        const stats = this.getGateStats();
        const strategy = this.evolutionEngine.getBestStrategy();
        
        if (level === 'critical') {
          GrogLogger.error(`[APIGate] ${msg}`, error, { stats, strategy });
        } else if (level === 'warn') {
          GrogLogger.warn(`[APIGate] ${msg}`, { stats, strategy });
        } else {
          GrogLogger.info(`[APIGate] ${msg}`, { stats, strategy });
        }
      }
    });
  }

  /**
   * Updates the brain's context with new system state.
   */
  public updateContext(context: any) {
    this.context = { ...this.context, ...context };
  }

  /**
   * Returns current gate diagnostics.
   */
  public getGateStats() {
    return this.apiGate.getStats();
  }

  /**
   * Logs a message and persists it to memory.
   */
  private log(message: string, color?: string, type: 'log' | 'decision' | 'failure' | 'insight' = 'log') {
    this.addLog(message, color);
    this.memory.add({ type, content: message, metadata: { color } });
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
    quality: number = 1.0,
    violations: number = 0,
    temperatureOverride?: number
  ): Promise<string> {
    const strategy = this.evolutionEngine.getBestStrategy();
    let model = strategy.modelPreference === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';
    const temperature = temperatureOverride !== undefined ? temperatureOverride : strategy.temperature;

    // Update APIGate config with current strategy parameters
    this.apiGate.updateConfig({ maxConcurrency: strategy.concurrency });

    const startTime = Date.now();
    try {
      const result = await this.apiGate.gate(prompt, systemInstruction, async () => {
        try {
          const response = await this.ai.models.generateContent({
            model,
            contents: [{ parts: [{ text: prompt }] }],
            config: {
              systemInstruction,
              temperature,
              topP: strategy.topP,
              topK: strategy.topK,
              maxOutputTokens: 16384,
              responseMimeType: forceJson ? "application/json" : "text/plain",
              tools: useSearch ? [{ googleSearch: {} }] : undefined
            }
          });
          return response.text || "";
        } catch (e: any) {
          // Fallback to Flash if Pro fails
          if (model === 'gemini-3.1-pro-preview') {
            GrogLogger.warn("GROG_BRAIN: PRO MODEL FAILED. FALLING BACK TO FLASH...", { 
              stats: this.getGateStats(), 
              strategy 
            });
            model = 'gemini-3-flash-preview';
            const fallbackResponse = await this.ai.models.generateContent({
              model,
              contents: [{ parts: [{ text: prompt }] }],
              config: {
                systemInstruction,
                temperature,
                topP: strategy.topP,
                topK: strategy.topK,
                maxOutputTokens: 16384,
                responseMimeType: forceJson ? "application/json" : "text/plain",
                tools: useSearch ? [{ googleSearch: {} }] : undefined
              }
            });
            return fallbackResponse.text || "";
          }
          throw e;
        }
      });

      const latency = Date.now() - startTime;
      this.evolutionEngine.recordPerformance(strategy.id, true, latency, quality, violations);
      return result;
    } catch (error: any) {
      const latency = Date.now() - startTime;
      this.evolutionEngine.recordPerformance(strategy.id, false, latency, 0.0, violations + 1);
      
      const stats = this.getGateStats();
      const errorMsg = error.message || String(error);
      
      if (errorMsg === 'API_GATE_QUOTA_EXHAUSTED') {
        this.quotaExhausted = true;
        GrogLogger.error("GROG_BRAIN: API QUOTA EXHAUSTED. ENTERING COOLDOWN.", error, { stats, strategy });
      } else if (errorMsg === 'API_GATE_BUDGET_EXHAUSTED') {
        this.budgetExhausted = true;
        GrogLogger.error("GROG_BRAIN: TOKEN BUDGET EXHAUSTED. SYSTEM HALTED.", error, { stats, strategy });
      } else {
        this.geminiFailed = true;
        GrogLogger.error(`GROG_BRAIN: AI CALL FAILED.`, error, { stats, strategy });
      }
      
      throw error;
    }
  }

  /**
   * Evolves a file's content based on DNA and saturation guidelines.
   * Includes automated retry logic and self-correction for failed audits.
   */
  public async evolveFile(path: string, content: string, retryCount = 0, customPrompt?: string): Promise<any> {
    const MAX_EVOLUTION_RETRIES = 2;
    this.log(`GROK_EVOLVE: Initiating architectural mutation for ${path}... (Attempt ${retryCount + 1}/${GrogBrain.MAX_EVOLUTION_RETRIES + 1})`, "var(--color-dalek-gold)");
    
    const prompts = this.context.prompts as SystemPrompts;
    if (!prompts) throw new Error("Prompts not loaded in GrogBrain context");

    const strategicContext = this.memory.getStrategicContext();
    const dnaSignature = this.context.dnaSignature || "None";

    const systemInstruction = PromptService.interpolate(prompts.evolution_system, {
      ledger: strategicContext,
      file: path,
      format: path.split('.').pop() || 'ts',
      dna: dnaSignature,
      typeInstructions: retryCount > 0 ? "CRITICAL: Previous mutation failed architectural audit. Ensure all exports are preserved and logic is not truncated." : ""
    });

    const dynamicGuidelines = SaturationService.getDynamicSaturationGuidelines(path, content);
    const manualGuidelines = this.context.saturationGuidelines || "";
    const mergedGuidelines = manualGuidelines 
      ? `[MANUAL STRATEGY]: ${manualGuidelines}\n[DYNAMIC METRICS]: ${dynamicGuidelines}`
      : dynamicGuidelines;

    const userPrompt = customPrompt || PromptService.interpolate(prompts.evolution_user, {
      file: path,
      round: this.context.round || 1,
      totalRounds: this.context.totalRounds || 5,
      vote: this.context.vote || "Meta/React-Core",
      context: typeof this.context.chainedContext === 'string' ? this.context.chainedContext : JSON.stringify(this.context.chainedContext || {}),
      dna: dnaSignature,
      saturation: mergedGuidelines,
      dependencyMap: JSON.stringify(this.context.dependencyMap || {}),
      code: content
    });

    // Increase temperature on retries to encourage more creative/different solutions
    const temperatureOverride = retryCount > 0 ? Math.min(1.2, 0.8 + (retryCount * 0.15)) : undefined;

    const result = await this.callAIWithFallback(userPrompt, systemInstruction, false, true, 1.0, 0, temperatureOverride);
    const parsed = robustParseJSON(result);

    let improvedCode = "";
    let summary = "";
    let strategicDecision = "";
    let priority = 5;

    if (!parsed) {
      // Fallback if JSON parsing failed
      const codeBlockMatch = result.match(/```(?:[a-z]*)\n?([\s\S]*?)\n?```/);
      improvedCode = codeBlockMatch ? codeBlockMatch[1].trim() : result.trim();
      summary = "JSON_PARSE_FAILURE_RECOVERY";
      strategicDecision = "RECOVERY_MODE";
      priority = 1;
    } else {
      improvedCode = parsed.improvedCode;
      summary = parsed.summary;
      strategicDecision = parsed.strategicDecision;
      priority = parsed.priority;

      // Persist strategic decision to memory
      this.memory.add({ 
        type: 'decision', 
        content: `Evolution of ${path}: ${strategicDecision}`, 
        metadata: { summary, priority } 
      });
    }

    // Directive 1 & 2: Architectural Guardrails
    const validation = await this.validateMutation(path, content, improvedCode, retryCount, userPrompt, (p, c, r, pr) => this.evolveFile(p, c, r, pr));
    
    if (validation.aborted) {
      return { 
        improvedCode: content, 
        summary: "EVOLUTION_ABORTED: AUDIT_FAILURE_PERSISTS", 
        emergentTool: false, 
        tool: null, 
        strategicDecision: "ABORT_MUTATION", 
        priority: 10 
      };
    }

    if (validation.retryPromise) return validation.retryPromise;

    // Directive 3: Test-Driven Mutation (TDM) & Shadow Evaluation (Parallel)
    this.log(`INITIATING MULTI-STAGE EVALUATION for ${path}...`, "var(--color-dalek-gold)", 'insight');
    const [testResult, aiTestReport, shadowReport] = await Promise.all([
      NexusTestRunner.runRegression(path, improvedCode),
      this.runNativeTests(path, improvedCode),
      this.runShadowEvaluation(path, content, improvedCode)
    ]);
    
    if (!testResult.success || aiTestReport.report.includes("CRITICAL_BUG") || aiTestReport.report.includes("BREAKING_CHANGE")) {
      const failureReason = !testResult.success ? `Regression Failure: ${testResult.report}` : `AI Test Failure: ${aiTestReport.report.slice(0, 50)}...`;
      GrogLogger.error(`REGRESSION_TEST_FAILED in ${path}: ${failureReason}`, null, {
        stats: this.getGateStats(),
        strategy: this.evolutionEngine.getBestStrategy(),
        testReport: aiTestReport.report,
        regressionReport: testResult.report
      });
      await this.recordDeath(failureReason, `File: ${path}`);
      
      if (retryCount < GrogBrain.MAX_EVOLUTION_RETRIES) {
        this.log(`INITIATING SELF-CORRECTION (TDM) for ${path}...`, "var(--color-dalek-gold)", 'insight');
        const retryPrompt = `${userPrompt}\n\nCRITICAL: The previous mutation failed regression tests. REASON: ${failureReason}. Please fix the logic.`;
        return this.evolveFile(path, content, retryCount + 1, retryPrompt);
      }
    }

    if (shadowReport.divergence > 0.5) {
      this.log(`SHADOW_EVALUATION_DIVERGENCE in ${path}: ${(shadowReport.divergence * 100).toFixed(1)}%`, "var(--color-dalek-gold)", 'insight');
      
      if (retryCount < GrogBrain.MAX_EVOLUTION_RETRIES && shadowReport.divergence > 0.8) {
        this.log(`INITIATING SELF-CORRECTION (SHADOW) for ${path}...`, "var(--color-dalek-gold)", 'insight');
        return this.evolveFile(path, content, retryCount + 1);
      }
    }

    await this.eventBus.emit('grog:thought', {
      type: 'evolution',
      file: path,
      insight: strategicDecision || "File evolved successfully.",
      priority: priority || 5,
      violations: [], // Handled in validation
      shadowDivergence: shadowReport.divergence,
      timestamp: new Date().toISOString()
    });

    return {
      improvedCode,
      summary,
      emergentTool: parsed?.emergentTool || false,
      tool: parsed?.tool || null,
      strategicDecision,
      priority
    };
  }

  /**
   * Scans files to identify those needing evolution.
   * Prioritizes files that are either very simple (for expansion) or very complex (for refactoring).
   */
  public scanForEvolution(fileData: { path: string, content: string }[]): { path: string, saturation: number }[] {
    return fileData
      .map(f => {
        const saturation = SaturationService.calculateSaturation(f.content);
        return { path: f.path, saturation };
      })
      // We prioritize files that are far from the "balanced" 50% saturation mark
      .sort((a, b) => {
        const aNeed = Math.abs(50 - a.saturation);
        const bNeed = Math.abs(50 - b.saturation);
        return bNeed - aNeed;
      });
  }

  /**
   * Runs simulated tests on code using AI analysis.
   */
  public async runNativeTests(path: string, content: string): Promise<{ report: string }> {
    const prompts = await PromptService.getPrompts();
    const systemInstruction = prompts.testing_system;
    const prompt = PromptService.interpolate(prompts.testing_user, { path, content });

    const report = await this.callAIWithFallback(prompt, systemInstruction);
    return { report };
  }

  /**
   * Proposes a mutation for the system's own source code.
   * Analyzes current performance metrics (latency, error rates) to suggest targeted optimizations.
   */
  public async proposeSelfMutation(targetFile: string, currentContent: string, retryCount = 0, customPrompt?: string): Promise<string> {
    const prompts = await PromptService.getPrompts();
    const performanceContext = this.getPerformanceContext();

    const systemInstruction = prompts.self_mutation_system;
    const userPrompt = customPrompt || PromptService.interpolate(prompts.self_mutation_user, {
      targetFile,
      currentContent,
      performanceContext,
      strategicContext: this.memory.getStrategicContext(),
      mistakes: JSON.stringify(this.context.mistakes?.slice(0, 5) || [])
    });

    const result = await this.callAIWithFallback(userPrompt, systemInstruction, false, false, 1.0, 0);
    const mutatedCode = extractCode(result);

    // Directive 1 & 2: Architectural Guardrails for Self-Mutation
    const validation = await this.validateMutation(targetFile, currentContent, mutatedCode, retryCount, userPrompt, (p, c, r, pr) => this.proposeSelfMutation(p, c, r, pr), 0.2);
    
    if (validation.aborted || validation.retryPromise) {
      return validation.retryPromise ? await validation.retryPromise : currentContent;
    }

    // Shadow Mode: Test the self-mutation before accepting
    this.log(`SHADOW_MODE: TESTING SELF-MUTATION for ${targetFile}...`, "var(--color-dalek-green)", 'insight');
    const shadowTest = await NexusTestRunner.runRegression(targetFile, mutatedCode);
    
    if (!shadowTest.success) {
      this.log(`SHADOW_MODE_FAILURE: ${shadowTest.report}`, "var(--color-dalek-red)", 'failure');
      await this.recordDeath(`Self-Mutation Shadow Failure: ${shadowTest.report}`, `File: ${targetFile}`);
      
      if (retryCount < 1) {
        const correctionHint = `\n\nCRITICAL: The previous self-mutation failed shadow tests. ERROR: ${shadowTest.report}. Please fix the logic.`;
        return this.proposeSelfMutation(targetFile, currentContent, retryCount + 1, `${userPrompt}${correctionHint}`);
      }
      return currentContent;
    }

    this.log(`SHADOW_MODE_SUCCESS: Mutation verified for ${targetFile}.`, "var(--color-dalek-green)", 'insight');
    return mutatedCode;
  }

  /**
   * Shared validation logic for mutations.
   */
  private async validateMutation(
    path: string, 
    oldCode: string, 
    newCode: string, 
    retryCount: number, 
    userPrompt: string,
    retryFn: (path: string, content: string, retry: number, prompt: string) => Promise<any>,
    complexityThreshold?: number
  ): Promise<{ aborted: boolean, retryPromise?: Promise<any> }> {
    const linterErrors = NexusArchitecturalLinter.check(oldCode, newCode);
    const complexityErrors = NexusComplexityAnalyzer.checkRegression(oldCode, newCode, complexityThreshold);
    const architecturalViolations = [...linterErrors, ...complexityErrors];

    if (architecturalViolations.length > 0) {
      const violationReason = architecturalViolations.join(', ');
      const strategy = this.evolutionEngine.getBestStrategy();
      
      GrogLogger.warn(`ARCHITECTURAL_VIOLATION in ${path} (Attempt ${retryCount + 1}): ${violationReason}`, {
        stats: this.getGateStats(),
        strategy,
        violations: architecturalViolations,
        retryCount
      });
      
      // Record performance with low quality and high violations
      this.evolutionEngine.recordPerformance(strategy.id, false, 0, 0.1, architecturalViolations.length);
      
      await this.recordDeath(`Architectural Violation: ${violationReason}`, `File: ${path}`);
      
      if (retryCount < GrogBrain.MAX_EVOLUTION_RETRIES) {
        this.log(`INITIATING SELF-CORRECTION for ${path}... (Reason: ${violationReason})`, "var(--color-dalek-gold)", 'insight');
        let correctionHint = "\n\nCRITICAL: The previous attempt was rejected due to architectural violations.";
        if (complexityErrors.length > 0) {
          correctionHint += " REASON: Significant logic reduction (CONTENT_LOSS). You MUST expand the logic and maintain all existing functionality. DO NOT TRUNCATE.";
        }
        if (linterErrors.length > 0) {
          correctionHint += " REASON: Export loss detected (EXPORT_LOSS). You MUST preserve all public API exports.";
        }
        
        const stricterPrompt = `${userPrompt}${correctionHint}\n\nMAXIMALIST_MODE: ENABLED.`;
        return { aborted: false, retryPromise: retryFn(path, oldCode, retryCount + 1, stricterPrompt) };
      }

      if (linterErrors.some(e => e.includes("EXPORT_LOSS")) || complexityErrors.length > 0) {
        this.log(`ABORTING MUTATION: API_SHIELD_TRIGGERED for ${path}`, "var(--color-dalek-red)", 'failure');
        return { aborted: true };
      }
    }

    return { aborted: false };
  }

  /**
   * Gathers performance metrics for self-mutation analysis.
   */
  private getPerformanceContext(): string {
    const stats = this.getGateStats();
    const bestStrategy = this.evolutionEngine.getBestStrategy();
    const population = this.evolutionEngine.getPopulation();
    
    return JSON.stringify({
      apiGate: {
        estimatedTokensUsed: stats.estimatedTokensUsed,
        callCount: stats.callCount,
        dedupedCount: stats.dedupedCount,
        dedupeRate: stats.callCount > 0 ? (stats.dedupedCount / stats.callCount).toFixed(2) : "0.00",
        retryCount: stats.retryCount,
        retryRate: stats.callCount > 0 ? (stats.retryCount / stats.callCount).toFixed(2) : "0.00",
        queuedCount: stats.queuedCount,
        hardStopCount: stats.hardStopCount,
        isQuotaExhausted: stats.isQuotaExhausted
      },
      evolution: {
        bestFitness: bestStrategy.fitness.toFixed(0),
        bestModel: bestStrategy.modelPreference,
        avgTemperature: (population.reduce((acc, s) => acc + s.temperature, 0) / population.length).toFixed(2),
        avgAggression: (population.reduce((acc, s) => acc + s.aggressionLevel, 0) / population.length).toFixed(2),
        avgConcurrency: (population.reduce((acc, s) => acc + s.concurrency, 0) / population.length).toFixed(2),
        generation: bestStrategy.generation,
        populationSize: population.length
      },
      ui: this.context.uiMetrics || {}
    }, null, 2);
  }

  /**
   * Generates strategic insights based on system state.
   */
  public async think(): Promise<any[]> {
    const prompts = await PromptService.getPrompts();
    const systemInstruction = prompts.thinking_system;
    const prompt = PromptService.interpolate(prompts.thinking_user, {
      mistakes: JSON.stringify(this.context.mistakes?.slice(0, 5) || []),
      ledger: JSON.stringify(this.context.strategicLedger?.slice(-3) || []),
      performance: this.getPerformanceContext()
    });

    const result = await this.callAIWithFallback(prompt, systemInstruction, false, true);
    return robustParseJSON(result) || [];
  }

  /**
   * Directive 4: Shadow Evaluation Environment
   * Runs mutated code in a shadow context and compares behavior with original.
   */
  public async runShadowEvaluation(path: string, oldCode: string, newCode: string): Promise<{ divergence: number, report: string }> {
    const prompts = await PromptService.getPrompts();
    const systemInstruction = prompts.shadow_eval_system;
    const prompt = PromptService.interpolate(prompts.shadow_eval_user, {
      path,
      oldCode: oldCode.slice(0, 2000),
      newCode: newCode.slice(0, 2000)
    });

    const result = await this.callAIWithFallback(prompt, systemInstruction, false, true);
    const parsed = robustParseJSON(result);
    return parsed || { divergence: 1.0, report: "Shadow Evaluation Failed to Parse", isSafe: false };
  }

  /**
   * Records a system "death" (critical failure) in the registry.
   */
  public async recordDeath(error: string, context: string) {
    this.memory.add({ type: 'failure', content: `DEATH: ${error}`, metadata: { context } });
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
      
      const registry = robustParseJSON(existing || "[]");
      registry.push(deathEntry);
      await this.repoOps.push('grog/lessons/DEATH_REGISTRY.json', JSON.stringify(registry, null, 2), "GROG_BRAIN: Recording system death");
    } catch (e) {
      this.log("FAILED TO RECORD DEATH IN REGISTRY.", "var(--color-dalek-red)", 'failure');
    }
  }

  /**
   * Records a lesson learned from a mistake.
   */
  public async recordLesson(mistakeId: string, analysis: any) {
    this.memory.add({ type: 'insight', content: `LESSON LEARNED: ${mistakeId}`, metadata: analysis });
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
      this.log("FAILED TO RECORD LESSON.", "var(--color-dalek-red)", 'failure');
    }
  }
}
