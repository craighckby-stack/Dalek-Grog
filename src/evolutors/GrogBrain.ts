/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

import { GoogleGenAI } from "@google/genai";
import { APIGate } from "./apiGate";
import { StrategyEvolution } from "./evolutionService";
import { EventBus } from "../core/nexus_core";
import { SystemPrompts, PromptService } from "./promptService";
import { robustParseJSON } from "../core/utils";

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

    // Update APIGate config with current strategy parameters
    this.apiGate.updateConfig({ maxConcurrency: strategy.concurrency });

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
      context: typeof this.context.chainedContext === 'string' ? this.context.chainedContext : JSON.stringify(this.context.chainedContext || {}),
      dna: dnaSignature,
      saturation: this.context.saturationGuidelines || "None",
      dependencyMap: JSON.stringify(this.context.dependencyMap || {}),
      code: content
    });

    const result = await this.callAIWithFallback(userPrompt, systemInstruction, false, true);
    const parsed = robustParseJSON(result);

    if (!parsed) {
      // Fallback if JSON parsing failed
      const codeBlockMatch = result.match(/```(?:[a-z]*)\n?([\s\S]*?)\n?```/);
      const extractedCode = codeBlockMatch ? codeBlockMatch[1].trim() : result.trim();
      return { 
        improvedCode: extractedCode, 
        summary: "JSON_PARSE_FAILURE_RECOVERY", 
        emergentTool: false, 
        tool: null, 
        strategicDecision: "RECOVERY_MODE", 
        priority: 1 
      };
    }

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
        const saturation = this.calculateSaturation(f.content);
        return { path: f.path, saturation };
      })
      .filter(f => f.saturation < 80)
      .sort((a, b) => a.saturation - b.saturation);
  }

  /**
   * Calculates the DNA saturation level of a given code content.
   */
  public calculateSaturation(content: string): number {
    let saturation = 0;
    if (content.includes("Nexus")) saturation += 20;
    if (content.includes("DNA")) saturation += 20;
    if (content.includes("@license")) saturation += 20;
    if (content.length > 1000) saturation += 20;
    if (content.includes("Grog")) saturation += 20;
    return saturation;
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
    return robustParseJSON(result) || [];
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
      
      const registry = robustParseJSON(existing || "[]");
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
}
