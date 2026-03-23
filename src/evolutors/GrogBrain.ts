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
    patterns: any = null,
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
              maxOutputTokens: 8192, // Increase for large code expansions
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
                maxOutputTokens: 8192,
                responseMimeType: forceJson ? "application/json" : "text/plain",
                tools: useSearch ? [{ googleSearch: {} }] : undefined
              }
            });
            return fallbackResponse.text || "";
          }
          throw e;
        }
      });

      this.evolutionEngine.recordPerformance(strategy.id, true, Date.now() - startTime);
      return result;
    } catch (error: any) {
      this.evolutionEngine.recordPerformance(strategy.id, false, Date.now() - startTime);
      
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

    const userPrompt = customPrompt || PromptService.interpolate(prompts.evolution_user, {
      file: path,
      round: this.context.round || 1,
      totalRounds: this.context.totalRounds || 5,
      vote: this.context.vote || "Meta/React-Core",
      context: typeof this.context.chainedContext === 'string' ? this.context.chainedContext : JSON.stringify(this.context.chainedContext || {}),
      dna: dnaSignature,
      saturation: this.getDynamicSaturationGuidelines(path, content),
      dependencyMap: JSON.stringify(this.context.dependencyMap || {}),
      code: content
    });

    // Increase temperature on retries to encourage more creative/different solutions
    const temperatureOverride = retryCount > 0 ? Math.min(1.2, 0.8 + (retryCount * 0.15)) : undefined;

    const result = await this.callAIWithFallback(userPrompt, systemInstruction, false, true, null, temperatureOverride);
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
    const linterErrors = NexusArchitecturalLinter.check(content, improvedCode);
    const complexityErrors = NexusComplexityAnalyzer.checkRegression(content, improvedCode);
    const architecturalViolations = [...linterErrors, ...complexityErrors];

    if (architecturalViolations.length > 0) {
      const violationReason = architecturalViolations.join(', ');
      GrogLogger.warn(`ARCHITECTURAL_VIOLATION in ${path} (Attempt ${retryCount + 1}): ${violationReason}`, {
        stats: this.getGateStats(),
        strategy: this.evolutionEngine.getBestStrategy(),
        violations: architecturalViolations,
        retryCount
      });
      
      await this.recordDeath(`Architectural Violation: ${violationReason}`, `File: ${path}`);
      
      // Self-Correction Loop: Retry with stricter prompt and adjusted parameters
      if (retryCount < GrogBrain.MAX_EVOLUTION_RETRIES) {
        this.log(`INITIATING SELF-CORRECTION for ${path}... (Reason: ${violationReason})`, "var(--color-dalek-gold)", 'insight');
        let correctionHint = "CRITICAL: The previous attempt was rejected due to architectural violations.";
        if (complexityErrors.length > 0) {
          correctionHint += " REASON: Significant logic reduction (CONTENT_LOSS). You MUST expand the logic and maintain all existing functionality. DO NOT TRUNCATE. Be more verbose and comprehensive.";
        }
        if (linterErrors.length > 0) {
          correctionHint += " REASON: Export loss detected (EXPORT_LOSS). You MUST preserve all public API exports and interfaces.";
        }
        
        const stricterPrompt = `${userPrompt}\n\n${correctionHint}\n\nMAXIMALIST_MODE: ENABLED.`;
        return this.evolveFile(path, content, retryCount + 1, stricterPrompt);
      }

      // If critical and retry failed, abort evolution or return original
      if (linterErrors.some(e => e.includes("EXPORT_LOSS")) || complexityErrors.length > 0) {
        GrogLogger.error(`ABORTING EVOLUTION: AUDIT_FAILURE PERSISTS in ${path} after ${retryCount + 1} attempts.`, null, {
          stats: this.getGateStats(),
          strategy: this.evolutionEngine.getBestStrategy(),
          violations: architecturalViolations
        });
        return { 
          improvedCode: content, 
          summary: "EVOLUTION_ABORTED: AUDIT_FAILURE_PERSISTS", 
          emergentTool: false, 
          tool: null, 
          strategicDecision: "ABORT_MUTATION", 
          priority: 10 
        };
      }
    }

    // Directive 3: Test-Driven Mutation (TDM)
    const testResult = await NexusTestRunner.runRegression(path, improvedCode);
    const aiTestReport = await this.runNativeTests(path, improvedCode);
    
    if (aiTestReport.report.includes("CRITICAL_BUG") || aiTestReport.report.includes("BREAKING_CHANGE")) {
      GrogLogger.error(`REGRESSION_TEST_FAILED in ${path}: ${aiTestReport.report.slice(0, 50)}...`, null, {
        stats: this.getGateStats(),
        strategy: this.evolutionEngine.getBestStrategy(),
        testReport: aiTestReport.report
      });
      await this.recordDeath(`Regression Test Failure: ${aiTestReport.report.slice(0, 100)}`, `File: ${path}`);
      
      if (retryCount < GrogBrain.MAX_EVOLUTION_RETRIES) {
        this.log(`INITIATING SELF-CORRECTION (TDM) for ${path}...`, "var(--color-dalek-gold)", 'insight');
        return this.evolveFile(path, content, retryCount + 1);
      }
    }

    // Directive 4: Shadow Evaluation
    const shadowReport = await this.runShadowEvaluation(path, content, improvedCode);
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
      violations: architecturalViolations,
      shadowDivergence: shadowReport.divergence
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
        const saturation = this.calculateSaturation(f.content);
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
   * Calculates the DNA saturation level of a given code content.
   * Dynamically adjusts based on complexity, node count, and technical debt markers.
   */
  public calculateSaturation(content: string): number {
    const metrics = NexusComplexityAnalyzer.analyze(content);
    const keywords = ['TODO', 'FIXME', 'HACK', 'OPTIMIZE', 'REFACTOR', 'BUG', 'DEPRECATED'];
    const keywordCount = keywords.reduce((acc, k) => acc + (content.match(new RegExp(k, 'gi')) || []).length, 0);
    
    // Complexity-based saturation: higher complexity -> higher saturation (needs more evolution)
    // We normalize complexity: 50 is considered "high" for a single file in this context
    const complexitySaturation = Math.min(1, metrics.complexity / 50); 
    // Density-based saturation: more nodes -> higher saturation
    // We normalize nodes: 1000 is considered "dense"
    const nodeSaturation = Math.min(1, metrics.nodes / 1000);
    
    // Weighting: 
    // - Keywords (Technical Debt): 10%
    // - Complexity (Cyclomatic): 40%
    // - Node Count (Volume): 50%
    const saturation = (keywordCount * 0.02) + (complexitySaturation * 0.38) + (nodeSaturation * 0.6);
    
    // Return as a percentage (0-100)
    return Math.min(100, Math.round(saturation * 100));
  }

  /**
   * Generates dynamic saturation guidelines based on the file's current state.
   * Ensures mutations are both ambitious and contextually appropriate.
   */
  private getDynamicSaturationGuidelines(path: string, content: string): string {
    const saturation = this.calculateSaturation(content);
    const metrics = NexusComplexityAnalyzer.analyze(content);
    
    let guidelines = `DYNAMIC_SATURATION_AUDIT for ${path}: ${saturation}%. `;
    
    if (saturation < 30) {
      guidelines += "AMBITIOUS_MODE: ENABLED. The file is relatively simple or clean. You are encouraged to introduce new architectural patterns, abstractions, or significant logic expansions. Be bold.";
    } else if (saturation < 70) {
      guidelines += "BALANCED_EVOLUTION: The file has moderate complexity. Focus on refining existing logic, improving performance, and addressing technical debt while maintaining structural integrity.";
    } else {
      guidelines += "CONSERVATIVE_REFACTOR: The file is highly saturated or complex. Prioritize stability, modularization, and simplification. Avoid adding unnecessary complexity; focus on consolidation and cleanup.";
    }
    
    if (metrics.complexity > 30) {
      guidelines += " CRITICAL: High cyclomatic complexity detected. Prioritize splitting large methods and reducing nested logic.";
    }
    
    if (content.includes('TODO') || content.includes('FIXME')) {
      guidelines += " TASK_FOCUS: Unresolved markers detected. Prioritize implementing missing functionality over architectural shifts.";
    }
    
    if (path.includes('core') || path.includes('nexus')) {
      guidelines += " ARCHITECTURAL_STABILITY: This is a core system file. Ensure all mutations are strictly backward compatible and follow established Nexus patterns.";
    }
    
    return guidelines;
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
    const stats = this.getGateStats();
    const bestStrategy = this.evolutionEngine.getBestStrategy();
    const population = this.evolutionEngine.getPopulation();
    
    const performanceContext = JSON.stringify({
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

    const systemInstruction = prompts.self_mutation_system;
    const userPrompt = customPrompt || PromptService.interpolate(prompts.self_mutation_user, {
      targetFile,
      currentContent,
      performanceContext,
      strategicContext: this.memory.getStrategicContext(),
      mistakes: JSON.stringify(this.context.mistakes?.slice(0, 5) || [])
    });

    const result = await this.callAIWithFallback(userPrompt, systemInstruction);
    const mutatedCode = extractCode(result);

    // Directive 1 & 2: Architectural Guardrails for Self-Mutation
    const linterErrors = NexusArchitecturalLinter.check(currentContent, mutatedCode);
    const complexityErrors = NexusComplexityAnalyzer.checkRegression(currentContent, mutatedCode, 0.2); // Slightly higher threshold for self-mutation
    const architecturalViolations = [...linterErrors, ...complexityErrors];

    if (architecturalViolations.length > 0) {
      GrogLogger.error(`SELF_MUTATION_VIOLATION: ${architecturalViolations[0]}`, null, {
        stats: this.getGateStats(),
        strategy: this.evolutionEngine.getBestStrategy(),
        violations: architecturalViolations
      });
      await this.recordDeath(`Self-Mutation Violation: ${architecturalViolations.join(', ')}`, `File: ${targetFile}`);
      
      if (retryCount < 1) {
        this.log(`INITIATING SELF-CORRECTION for self-mutation of ${targetFile}...`, "var(--color-dalek-gold)", 'insight');
        let correctionHint = "\n\nCRITICAL: The previous self-mutation attempt was rejected due to architectural violations.";
        if (complexityErrors.length > 0) {
          correctionHint += " REASON: Significant logic reduction (CONTENT_LOSS). You MUST expand the logic and maintain all existing functionality. DO NOT TRUNCATE.";
        }
        if (linterErrors.some(e => e.includes("EXPORT_LOSS"))) {
          correctionHint += " REASON: Export loss detected. You MUST preserve all public API exports.";
        }
        
        const stricterPrompt = `${userPrompt}${correctionHint}\n\nMAXIMALIST_MODE: ENABLED.`;
        return this.proposeSelfMutation(targetFile, currentContent, retryCount + 1, stricterPrompt);
      }

      if (linterErrors.some(e => e.includes("EXPORT_LOSS"))) {
        this.log("ABORTING SELF-MUTATION: API_SHIELD_TRIGGERED", "var(--color-dalek-red)", 'failure');
        return currentContent; // Return original to avoid breakage
      }
    }

    return mutatedCode;
  }

  /**
   * Generates strategic insights based on system state.
   */
  public async think(): Promise<{ type: string, insight: string, priority: number }[]> {
    const prompts = await PromptService.getPrompts();
    const systemInstruction = prompts.thinking_system;
    const prompt = PromptService.interpolate(prompts.thinking_user, {
      mistakes: JSON.stringify(this.context.mistakes?.slice(0, 5) || []),
      ledger: JSON.stringify(this.context.strategicLedger?.slice(-3) || [])
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
