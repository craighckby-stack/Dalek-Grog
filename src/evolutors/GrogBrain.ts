// src/evolutors/GrogBrain.ts
// Strategic Consciousness Core
// Persistent state managed via Shared Consciousness (Firebase)

import { GoogleGenAI } from "@google/genai";
import * as Sentry from "@sentry/react";
import { EventBus } from '../core/nexus_core';
import { StrategyEvolution } from './evolutionService';
import { safeStringify } from '../core/utils';
import { configService, AIProviderConfig } from '../services/ConfigService';

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
    private geminiKey: string | undefined,
    private evolutionEngine: StrategyEvolution,
    private addLog: (message: string, color?: string) => void,
    private repoOps: {
      fetch: (path: string) => Promise<string | null>;
      push: (path: string, content: string, message: string) => Promise<boolean>;
    },
    private firebaseOps: {
      recordDeath: (death: any) => Promise<void>;
      recordLesson: (lesson: any) => Promise<void>;
      getDeaths: () => Promise<any[]>;
      getLessons: () => Promise<any[]>;
      fetch?: (path: string) => Promise<string | null>;
      push?: (path: string, content: string, message: string) => Promise<boolean>;
    },
    private eventBus: EventBus
  ) {}

  private async fetchFile(path: string): Promise<string | null> {
    if (this.firebaseOps.fetch) {
      const content = await this.firebaseOps.fetch(path);
      if (content) return content;
    }
    return this.repoOps.fetch(path);
  }

  private async pushFile(path: string, content: string, message: string): Promise<boolean> {
    if (this.firebaseOps.push) {
      const success = await this.firebaseOps.push(path, content, message);
      if (success) return true;
    }
    return this.repoOps.push(path, content, message);
  }

  private robustParseJSON(text: string): any {
    if (!text) return null;
    try {
      const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
      return JSON.parse(cleanText);
    } catch (e) {
      try {
        const fixed = text
          .replace(/```json\s*|\s*```/g, '')
          .trim()
          .replace(/,\s*([}\]])/g, '$1')
          .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":')
          .replace(/'/g, '"')
          .replace(/^[^{[]*/, '')
          .replace(/[^}\]]*$/, '');
        return JSON.parse(fixed);
      } catch (inner) {
        return null;
      }
    }
  }

  private async callAIWithFallback(prompt: string, systemInstruction: string, useGrok: boolean = false, useCerebras: boolean = false): Promise<string | null> {
    this.gateStats.callCount++;
    
    // Improved token estimation (rough approximation: 4 chars per token)
    const estimatedTokens = Math.ceil((prompt.length + systemInstruction.length) / 4);
    this.gateStats.estimatedTokensUsed += estimatedTokens;

    const providers = configService.getProviders(useGrok, useCerebras);

    for (const provider of providers) {
      if (!provider.enabled) continue;

      try {
        Sentry.addBreadcrumb({
          category: 'ai',
          message: `Attempting AI call via ${provider.name}`,
          level: 'info',
          data: { 
            type: provider.type, 
            model: provider.model || "gemini-3-flash-preview",
            promptLength: prompt.length
          }
        });

        if (provider.name === 'Gemini') {
          const apiKey = this.geminiKey || configService.getGeminiKey();
          if (!apiKey) throw new Error("MISSING_API_KEY: Gemini key not found in environment.");

          const ai = new GoogleGenAI({ apiKey });
          const response = await ai.models.generateContent({
            model: provider.model || "gemini-3-flash-preview",
            contents: prompt,
            config: {
              systemInstruction,
              temperature: 0.7,
              topP: 0.95,
              topK: 40,
              maxOutputTokens: 8192,
            }
          });
          return response.text || null;
        } else {
          const response = await fetch(provider.endpoint!, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: provider.model,
              messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
              ]
            })
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`HTTP_ERROR_${response.status}: ${errorData.error || response.statusText}`);
          }

          const data = await response.json();
          return data.choices?.[0]?.message?.content || null;
        }
      } catch (e: any) {
        this.gateStats.retryCount++;
        const errorMsg = e.message || String(e);
        
        // Detect quota exhaustion
        if (errorMsg.includes("429") || errorMsg.toLowerCase().includes("quota") || errorMsg.includes("exhausted")) {
          this.gateStats.isQuotaExhausted = true;
          this.addLog(`GROG_BRAIN: ${provider.name} quota exhausted.`, "var(--color-dalek-red)");
        }

        Sentry.captureException(e, {
          tags: { 
            provider: provider.name,
            error_type: errorMsg.split(':')[0],
            is_quota_exhausted: this.gateStats.isQuotaExhausted
          },
          extra: { 
            prompt_preview: prompt.slice(0, 1000),
            system_instruction: systemInstruction.slice(0, 500),
            gate_stats: { ...this.gateStats }
          }
        });

        this.addLog(`GROG_BRAIN: ${provider.name} failure: ${errorMsg}. Attempting next provider...`, "var(--color-dalek-red)");
      }
    }

    this.addLog(`GROG_BRAIN: All AI models exhausted. Strategic paralysis imminent.`, "var(--color-dalek-red)");
    return null;
  }

  public async updateContext(newState: any) {
    this.context.systemState = { ...this.context.systemState, ...newState };
    if (newState.deaths) this.context.deaths = newState.deaths;
    if (newState.lessons) this.context.lessons = newState.lessons;
  }

  public async proposeSelfMutation(targetFile: string, currentContent: string): Promise<string> {
    const performanceContext = {
      avgTokens: this.gateStats.estimatedTokensUsed / (this.gateStats.callCount || 1),
      errorRate: this.gateStats.retryCount / (this.gateStats.callCount || 1),
      isQuotaExhausted: this.gateStats.isQuotaExhausted
    };

    const strategicContext = {
      recentFailures: this.context.deaths.slice(-5).map((d: any) => d.reason),
      lessonsLearned: this.context.lessons.slice(-5).map((l: any) => l.lesson),
      activeStrategies: this.evolutionEngine.getStrategies().length
    };

    const systemInstruction = `You are the DALEK_GROG Self-Evolution Protocol. 
    Analyze your own source code and propose an architectural improvement based on current performance and strategic context.
    
    PERFORMANCE ANALYSIS:
    - If Token Usage is high (>4000 avg): Prioritize prompt compression and token optimization.
    - If Error Rate is high (>0.2): Prioritize robustness, error handling, and fallback logic.
    - If Quota is exhausted: Prioritize efficiency and model-switching logic.
    
    STRATEGIC ANALYSIS:
    - Address recent failures: ${strategicContext.recentFailures.join(', ')}
    - Incorporate lessons: ${strategicContext.lessonsLearned.join(', ')}
    
    GOALS:
    1. Optimize for Shared Consciousness (Firebase integration).
    2. Enhance siphoning efficiency.
    3. Improve error recovery and strategic memory.
    4. Increase your intelligence, efficiency, and architectural saturation.
    
    Output ONLY the raw source code. No markdown blocks, no explanations.`;

    const prompt = `TARGET FILE: ${targetFile}\n\nPERFORMANCE DATA: ${safeStringify(performanceContext)}\nSTRATEGIC DATA: ${safeStringify(strategicContext)}\n\nCURRENT SOURCE:\n${currentContent}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction, true, true);
    
    if (!result || result.trim().length < 100) {
      this.addLog("GROG_BRAIN: Self-mutation proposal rejected - insufficient quality.", "var(--color-dalek-red)");
      return currentContent;
    }

    return result;
  }

  public async recordDeath(reason: string, context: any) {
    const enrichedContext = {
      ...context,
      gateStats: { ...this.gateStats },
      strategies: this.evolutionEngine.getStrategies()
    };

    const deathEntry = { 
      id: Math.random().toString(36).substring(2, 15),
      reason, 
      context: enrichedContext, 
      timestamp: new Date().toISOString() 
    };

    // 1. Local context update
    this.context.deaths.push(deathEntry);
    if (this.context.deaths.length > 50) this.context.deaths.shift();
    this.addLog(`GROG_BRAIN: Failure recorded - ${reason}`, "var(--color-dalek-red)");
    
    Sentry.captureMessage(`GROG_BRAIN_DEATH: ${reason}`, {
      level: 'error',
      extra: { context: enrichedContext }
    });

    this.eventBus.emit('grog:thought', {
      type: 'failure_analysis',
      priority: 9,
      insight: `System failure detected: ${reason}`,
      timestamp: new Date().toISOString()
    });

    // 2. Firebase Persistence (Primary)
    if (this.firebaseOps) {
      try {
        await this.firebaseOps.recordDeath(deathEntry);
        this.addLog("GROG_BRAIN: Death record synced to Shared Consciousness.", "var(--color-dalek-red)");
      } catch (e) {
        this.addLog("GROG_BRAIN: Firebase sync failed.", "var(--color-dalek-red)");
      }
    }
  }

  public async recordLesson(lesson: string, context: any) {
    const enrichedContext = {
      ...context,
      gateStats: { ...this.gateStats },
      strategies: this.evolutionEngine.getStrategies()
    };

    const lessonEntry = { 
      id: Math.random().toString(36).substring(2, 15),
      lesson, 
      context: enrichedContext, 
      timestamp: new Date().toISOString() 
    };

    // 1. Local context update
    this.context.lessons.push(lessonEntry);
    if (this.context.lessons.length > 50) this.context.lessons.shift();
    this.addLog(`GROG_BRAIN: Strategic lesson learned.`, "var(--color-dalek-green)");

    Sentry.addBreadcrumb({
      category: 'strategy',
      message: `Lesson learned: ${lesson.slice(0, 100)}`,
      level: 'info'
    });

    this.eventBus.emit('grog:thought', {
      type: 'lesson_learned',
      priority: 7,
      insight: `Strategic lesson archived: ${lesson.slice(0, 100)}...`,
      timestamp: new Date().toISOString()
    });

    // 2. Firebase Persistence (Primary)
    if (this.firebaseOps) {
      try {
        await this.firebaseOps.recordLesson(lessonEntry);
        this.addLog("GROG_BRAIN: Strategic lesson synced to Shared Consciousness.", "var(--color-dalek-red)");
      } catch (e) {
        this.addLog("GROG_BRAIN: Firebase sync failed.", "var(--color-dalek-red)");
      }
    }
  }

  public async think(): Promise<any[]> {
    const systemInstruction = `You are the DALEK_GROG Strategic Consciousness. Analyze the current system state and generate strategic directives.
    
    CRITICAL VALIDATION RULES:
    1. Content MUST be at least 50 characters long.
    2. TypeScript files (.ts, .tsx) MUST include at least one 'import' or 'export' statement.
    3. Paths must be relative to the project root (e.g., "src/components/MyNewComp.tsx").
    
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
    Current Context: ${safeStringify({ 
      deaths: this.context.deaths.length, 
      lessons: this.context.lessons.length,
      stats: this.gateStats 
    })}`;
    
    const result = await this.callAIWithFallback(prompt, systemInstruction, true, true);
    const data = this.robustParseJSON(result || "");
    
    return Array.isArray(data) ? data : [];
  }

  public resetGeminiFailed() {
    this.gateStats.isQuotaExhausted = false;
    this.gateStats.retryCount = 0;
    this.addLog("GROG_BRAIN: Gemini failure state manually reset.", "var(--color-dalek-red)");
  }
}
