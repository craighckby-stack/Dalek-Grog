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
      firebase?: {
        recordDeath: (death: any) => Promise<void>;
        recordLesson: (lesson: any) => Promise<void>;
        getDeaths: () => Promise<any[]>;
        getLessons: () => Promise<any[]>;
      }
    },
    private eventBus: EventBus
  ) {}

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
    
    // Try Gemini first (Primary)
    try {
      const ai = new GoogleGenAI({ apiKey: this.geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
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
    } catch (e) {
      this.addLog(`GROG_BRAIN: Gemini primary failure. Attempting fallback...`, "var(--color-dalek-gold)");
      
      // Fallback to Grok or Cerebras via server proxy
      const fallbackModel = useGrok ? 'grok-beta' : 'llama3.1-70b';
      const endpoint = useGrok ? '/api/grok/proxy' : '/api/cerebras/proxy';
      
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: fallbackModel,
            messages: [
              { role: 'system', content: systemInstruction },
              { role: 'user', content: prompt }
            ]
          })
        });
        const data = await response.json();
        return data.choices?.[0]?.message?.content || null;
      } catch (inner) {
        this.addLog(`GROG_BRAIN: All AI models exhausted.`, "var(--color-dalek-red)");
        return null;
      }
    }
  }

  public async updateContext(newState: any) {
    this.context.systemState = { ...this.context.systemState, ...newState };
  }

  public async proposeSelfMutation(targetFile: string, currentContent: string): Promise<string> {
    const systemInstruction = `You are the DALEK_GROG Self-Evolution Protocol. 
    Analyze your own source code and propose an architectural improvement.
    
    GOALS:
    1. Optimize for Shared Consciousness (Firebase integration).
    2. Enhance siphoning efficiency.
    3. Improve error recovery and strategic memory.
    4. Increase your intelligence, efficiency, and architectural saturation.
    
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

    // 1. Local context update
    this.context.deaths.push(deathEntry);
    if (this.context.deaths.length > 50) this.context.deaths.shift();
    this.addLog(`GROG_BRAIN: Failure recorded - ${reason}`, "var(--color-dalek-red)");
    
    this.eventBus.emit('grog:thought', {
      type: 'failure_analysis',
      priority: 9,
      insight: `System failure detected: ${reason}`,
      timestamp: new Date().toISOString()
    });

    // 2. Firebase Persistence (Primary)
    if (this.services.firebase) {
      try {
        await this.services.firebase.recordDeath(deathEntry);
        this.addLog("GROG_BRAIN: Death record synced to Shared Consciousness.", "var(--color-dalek-gold)");
      } catch (e) {
        this.addLog("GROG_BRAIN: Firebase sync failed, falling back to GitHub.", "var(--color-dalek-red)");
      }
    }

    // 3. GitHub Persistence (Backup/Siphon)
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

    // 1. Local context update
    this.context.lessons.push(lessonEntry);
    if (this.context.lessons.length > 50) this.context.lessons.shift();
    this.addLog(`GROG_BRAIN: Strategic lesson learned.`, "var(--color-dalek-green)");

    this.eventBus.emit('grog:thought', {
      type: 'lesson_learned',
      priority: 7,
      insight: `Strategic lesson archived: ${lesson.slice(0, 100)}...`,
      timestamp: new Date().toISOString()
    });

    // 2. Firebase Persistence (Primary)
    if (this.services.firebase) {
      try {
        await this.services.firebase.recordLesson(lessonEntry);
        this.addLog("GROG_BRAIN: Strategic lesson synced to Shared Consciousness.", "var(--color-dalek-gold)");
      } catch (e) {
        this.addLog("GROG_BRAIN: Firebase sync failed, falling back to GitHub.", "var(--color-dalek-red)");
      }
    }

    // 3. GitHub Persistence (Backup/Siphon)
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
    
    return Array.isArray(data) ? data : [];
  }

  public resetGeminiFailed() {
    this.gateStats.isQuotaExhausted = false;
    this.gateStats.retryCount = 0;
    this.addLog("GROG_BRAIN: Gemini failure state manually reset.", "var(--color-dalek-cyan)");
  }
}
