// src/evolutors/GrogBrain.ts
// GITHUB MIRROR STUB - Full implementation in Firebase
// This file exists to provide siphon baseline for self-evolution

import { GoogleGenAI } from "@google/genai";
import { EventBus } from '../core/nexus_core';
import { StrategyEvolution } from './evolutionService';

export class GrogBrain {
  private gateStats = {
    callCount: 0,
    estimatedTokensUsed: 0,
    retryCount: 0,
    isQuotaExhausted: false
  };

  private context: any = {
    deaths: [],
    lessons: [],
    systemState: {}
  };

  constructor(
    private geminiKey: string,
    private evolutionEngine: StrategyEvolution,
    private addLog: (message: string, color?: string) => void,
    private services: {
      fetch: (path: string) => Promise<string | null>;
      push: (path: string, content: string, message: string) => Promise<boolean>;
    },
    private eventBus: EventBus
  ) {}

  private robustParseJSON(text: string): any {
    if (!text) return null;
    try {
      // Clean up potential markdown formatting
      const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      // Fallback: handle common AI issues: trailing commas, unquoted keys, single quotes
      try {
        let fixed = text
          .replace(/```json\s*|\s*```/g, '')
          .trim()
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"')
          .replace(/^[^{[]*/, '')
          .replace(/[^}\]]*$/, '');
        
        return JSON.parse(fixed);
      } catch (innerE) {
        const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (match) {
          try {
            return JSON.parse(match[0]);
          } catch (e2) {
            return null;
          }
        }
        return null;
      }
    }
  }

  public async callAIWithFallback(prompt: string, systemInstruction: string, useSearch: boolean = false, forceJson: boolean = false): Promise<string | null> {
    this.gateStats.callCount++;
    
    try {
      const ai = new GoogleGenAI({ apiKey: this.geminiKey });
      const strategy = this.evolutionEngine.getBestStrategy();
      const modelName = strategy.modelPreference === 'pro' ? 'gemini-3.1-pro-preview' : 'gemini-3-flash-preview';

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: forceJson ? "application/json" : "text/plain",
          temperature: 0.7,
          topP: 0.95,
          topK: 40,
          tools: useSearch ? [{ googleSearch: {} }] : undefined,
        },
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      // Rough token estimation (4 chars per token)
      this.gateStats.estimatedTokensUsed += Math.ceil((prompt.length + text.length) / 4);
      
      return text;
    } catch (error: any) {
      this.gateStats.retryCount++;
      if (error.message?.includes("429") || error.message?.toLowerCase().includes("quota")) {
        this.gateStats.isQuotaExhausted = true;
        this.addLog("GROG_BRAIN_GATE_CRITICAL: Quota exhausted. Entering hibernation.", "var(--color-dalek-red)");
      }
      this.addLog(`GROG_BRAIN_GATE_ERROR: ${error.message}`, "var(--color-dalek-red)");
      return null;
    }
  }

  public async evolveFile(fileName: string, content: string, saturationGuidelines?: string, strategy?: StrategyEvolution): Promise<{ improvedCode: string; summary: string; strategicDecision: string; priority: number }> {
    const systemInstruction = `You are the DALEK_GROG Evolution Engine. Your goal is to reconstruct the provided source code into a more advanced, efficient, and "saturated" version.
    
    GUIDELINES:
    ${saturationGuidelines || "Maximize architectural integrity and functional density."}
    
    Output your response in JSON format:
    {
      "improvedCode": "the full reconstructed source code",
      "summary": "brief summary of changes",
      "strategicDecision": "why this path was taken",
      "priority": 1-10
    }`;

    const prompt = `TARGET FILE: ${fileName}\n\nSOURCE CODE:\n${content}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction, false, true);
    const data = this.robustParseJSON(result || "");
    
    if (data && data.improvedCode) {
      return data;
    }
    
    return { improvedCode: content, summary: "Evolution failed or returned invalid data.", strategicDecision: "STASIS", priority: 0 };
  }

  public async proposeSelfMutation(targetFile: string, currentContent: string): Promise<string> {
    const systemInstruction = `You are the DALEK_GROG Self-Evolution Vector. You are modifying YOUR OWN SOURCE CODE. 
    Increase your intelligence, efficiency, and architectural saturation.
    
    Output ONLY the raw source code. No markdown blocks, no explanations.`;

    const prompt = `TARGET FILE: ${targetFile}\n\nCURRENT SOURCE:\n${currentContent}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction);
    return result || currentContent;
  }

  public async recordDeath(reason: string, context: any) {
    const deathEntry = { 
      id: Math.random().toString(36).substring(2, 15),
      reason, 
      context, 
      timestamp: new Date().toISOString() 
    };
    this.context.deaths.push(deathEntry);
    if (this.context.deaths.length > 50) this.context.deaths.shift();
    this.addLog(`GROG_BRAIN: Failure recorded - ${reason}`, "var(--color-dalek-red)");
    
    this.eventBus.emit('grog:thought', {
      type: 'failure_analysis',
      priority: 9,
      insight: `System failure detected: ${reason}`,
      timestamp: new Date().toISOString()
    });

    // Attempt to persist to repository
    try {
      const existingContent = await this.services.fetch('grog/lessons/DEATH_REGISTRY.json');
      let allDeaths = [];
      if (existingContent) {
        allDeaths = this.robustParseJSON(existingContent) || [];
      }
      
      allDeaths.push(deathEntry);
      if (allDeaths.length > 100) allDeaths.shift(); 
      
      const content = JSON.stringify(allDeaths, null, 2);
      await this.services.push('grog/lessons/DEATH_REGISTRY.json', content, `GROG_BRAIN: Recording system failure - ${reason.slice(0, 50)}`);
    } catch (e) {
      this.addLog(`GROG_BRAIN: Failed to persist death record to repository.`, "var(--color-dalek-red)");
    }
  }

  public async recordLesson(lesson: string, context: any) {
    const lessonEntry = { 
      id: Math.random().toString(36).substring(2, 15),
      lesson, 
      context, 
      timestamp: new Date().toISOString() 
    };
    this.context.lessons.push(lessonEntry);
    if (this.context.lessons.length > 50) this.context.lessons.shift();
    this.addLog(`GROG_BRAIN: Strategic lesson learned.`, "var(--color-dalek-green)");

    this.eventBus.emit('grog:thought', {
      type: 'lesson_learned',
      priority: 7,
      insight: `Strategic lesson archived: ${lesson.slice(0, 100)}...`,
      timestamp: new Date().toISOString()
    });

    // Attempt to persist to repository
    try {
      const existingContent = await this.services.fetch('grog/lessons/STRATEGIC_LESSONS.json');
      let allLessons = [];
      if (existingContent) {
        allLessons = this.robustParseJSON(existingContent) || [];
      }
      
      allLessons.push(lessonEntry);
      if (allLessons.length > 100) allLessons.shift();
      
      const content = JSON.stringify(allLessons, null, 2);
      await this.services.push('grog/lessons/STRATEGIC_LESSONS.json', content, `GROG_BRAIN: Archiving strategic lesson.`);
    } catch (e) {
      // Silent fail
    }
  }

  public async think(): Promise<any[]> {
    const systemInstruction = `You are the DALEK_GROG Strategic Consciousness. Analyze the current system state and generate strategic directives.
    
    Output a JSON array of directives:
    [
      {
        "type": "CREATE_FILE" | "MUTATE_FILE" | "SIPHON_DNA",
        "insight": "The strategic reasoning",
        "priority": 1-10,
        "action": {
          "path": "file/path",
          "content": "new content if creating/mutating",
          "targetRepo": "repo name if siphoning"
        }
      }
    ]`;

    const prompt = `Analyze the system and propose 3-5 strategic directives. 
    Current Context: ${JSON.stringify({ 
      deaths: this.context.deaths.length, 
      lessons: this.context.lessons.length,
      stats: this.gateStats 
    })}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction, true, true);
    const data = this.robustParseJSON(result || "");
    
    const insights = Array.isArray(data) ? data : [];
    
    if (insights.length > 0) {
      this.eventBus.emit('grog:thought', {
        type: 'strategic_analysis',
        priority: 8,
        insight: `Generated ${insights.length} strategic directives for system evolution.`,
        timestamp: new Date().toISOString()
      });
    }

    return insights;
  }

  public async scanForEvolution(fileData: { path: string; content: string }[]): Promise<{ path: string; saturation: number }[]> {
    const systemInstruction = `Analyze the provided files and determine their "DNA Saturation" (0-100%). 
    Lower saturation means the file needs evolution.
    
    Output a JSON array:
    [
      { "path": "file/path", "saturation": number }
    ]`;

    const prompt = `FILES TO ANALYZE:\n${fileData.map(f => f.path).join('\n')}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction, false, true);
    const data = this.robustParseJSON(result || "");
    const results = Array.isArray(data) ? data : [];

    if (results.length > 0) {
      this.eventBus.emit('grog:thought', {
        type: 'evolution_scan',
        priority: 6,
        insight: `Scanned ${fileData.length} files. Identified ${results.filter(r => r.saturation < 50).length} files requiring immediate evolution.`,
        timestamp: new Date().toISOString()
      });
    }

    return results;
  }

  public async updateContext(context: any) {
    this.context.systemState = { ...this.context.systemState, ...context };
  }

  public getGateStats() {
    return this.gateStats;
  }

  public resetGeminiFailed() {
    this.gateStats.isQuotaExhausted = false;
    this.gateStats.retryCount = 0;
  }

  public async runNativeTests(fileName: string, content: string): Promise<{ report: string }> {
    const systemInstruction = `You are the DALEK_GROG Validation Auditor. Run a "shadow simulation" of the provided code and identify potential failures or regressions.
    
    Output a detailed report in Markdown format.`;

    const prompt = `FILE: ${fileName}\n\nCONTENT:\n${content}`;
    
    const report = await this.callAIWithFallback(prompt, systemInstruction);
    const finalReport = report || "Validation simulation failed to initialize.";

    this.eventBus.emit('grog:thought', {
      type: 'validation_test',
      priority: 7,
      insight: `Completed validation simulation for ${fileName}. Analysis archived in report.`,
      timestamp: new Date().toISOString()
    });

    return { report: finalReport };
  }

  public async runShadowEvaluation() {
    this.addLog("GROG_BRAIN: Initiating shadow evaluation sequence...", "var(--color-dalek-gold)");
  }

  public async validateMutation() {
    this.addLog("GROG_BRAIN: Validating mutation integrity...", "var(--color-dalek-gold)");
  }
}
