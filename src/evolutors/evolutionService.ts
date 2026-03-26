/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 * 
 * This project incorporates architectural DNA siphoned from:
 * - DeepMind/AlphaCode, Google/Genkit, Firebase/Lifecycle, Meta/React-Core,
 *   OpenAI/Triton, Anthropic/Constitutional-AI, microsoft/TypeScript, etc.
 */

export interface EvolutionaryStrategy {
  id: string;
  concurrency: number;
  delayBetweenCalls: number;
  temperature: number;
  topP: number;
  topK: number;
  modelPreference: 'flash' | 'pro';
  aggressionLevel: number; // 0 to 1
  fitness: number;
  generation: number;
}

export class StrategyEvolution {
  private population: EvolutionaryStrategy[] = [];
  private generationCount: number = 0;
  private populationSize: number = 10;

  constructor() {
    this.initializePopulation();
  }

  private initializePopulation() {
    for (let i = 0; i < this.populationSize; i++) {
      this.population.push(this.createRandomStrategy(`gen0-ind${i}`, 0));
    }
  }

  private createRandomStrategy(id: string, generation: number): EvolutionaryStrategy {
    return {
      id,
      concurrency: Math.floor(Math.random() * 5) + 1,
      delayBetweenCalls: Math.floor(Math.random() * 2000) + 500,
      temperature: Math.random() * 0.5 + 0.7, // 0.7 to 1.2
      topP: Math.random() * 0.2 + 0.8, // 0.8 to 1.0
      topK: Math.floor(Math.random() * 20) + 40, // 40 to 60
      modelPreference: Math.random() > 0.8 ? 'pro' : 'flash',
      aggressionLevel: Math.random(),
      fitness: 0,
      generation
    };
  }

  public recordPerformance(strategyId: string, success: boolean, latency: number, quality: number = 1.0, violations: number = 0) {
    const strategy = this.population.find(s => s.id === strategyId);
    if (strategy) {
      // Fitness function: success is highly weighted, low latency is better, quality is a multiplier
      // Violations are heavily penalized
      const successWeight = success ? 100 : -200;
      const latencyPenalty = Math.max(0, (5000 - latency) / 100);
      const violationPenalty = violations * 50;
      
      // Ensure quality doesn't zero out the penalty on failure
      // We use quality as a multiplier for positive gains, but keep penalties absolute
      let delta = 0;
      if (success) {
        delta = (successWeight + latencyPenalty - violationPenalty) * Math.max(0.1, quality);
      } else {
        // On failure, we want the full penalty
        delta = successWeight - violationPenalty;
      }
      
      strategy.fitness += delta;
    }
  }

  public getBestStrategy(): EvolutionaryStrategy {
    return this.population.reduce((prev, current) => (prev.fitness > current.fitness) ? prev : current);
  }

  public evolve() {
    this.generationCount++;
    const sorted = [...this.population].sort((a, b) => b.fitness - a.fitness);
    const elites = sorted.slice(0, 2); // Keep top 2
    const nextGen: EvolutionaryStrategy[] = [...elites];

    while (nextGen.length < this.populationSize) {
      const parentA = elites[Math.floor(Math.random() * elites.length)];
      const parentB = elites[Math.floor(Math.random() * elites.length)];
      nextGen.push(this.crossover(parentA, parentB, `gen${this.generationCount}-ind${nextGen.length}`));
    }

    this.population = nextGen;
  }

  private crossover(a: EvolutionaryStrategy, b: EvolutionaryStrategy, id: string): EvolutionaryStrategy {
    const child: EvolutionaryStrategy = {
      id,
      concurrency: Math.random() > 0.5 ? a.concurrency : b.concurrency,
      delayBetweenCalls: Math.random() > 0.5 ? a.delayBetweenCalls : b.delayBetweenCalls,
      temperature: (a.temperature + b.temperature) / 2,
      topP: (a.topP + b.topP) / 2,
      topK: Math.floor((a.topK + b.topK) / 2),
      modelPreference: Math.random() > 0.5 ? a.modelPreference : b.modelPreference,
      aggressionLevel: (a.aggressionLevel + b.aggressionLevel) / 2,
      fitness: 0,
      generation: this.generationCount
    };

    // Mutation
    if (Math.random() < 0.1) {
      child.aggressionLevel = Math.min(1, Math.max(0, child.aggressionLevel + (Math.random() - 0.5) * 0.2));
      child.concurrency = Math.max(1, child.concurrency + (Math.random() > 0.5 ? 1 : -1));
    }

    return child;
  }

  public applyStrategicCorrection(adaptation: string, fix: string) {
    // AI-driven strategy adjustment
    // We create a "Strategic Hero" strategy that incorporates the adaptation
    const best = this.getBestStrategy();
    const strategicHero: EvolutionaryStrategy = {
      ...best,
      id: `strategic-hero-${Date.now()}`,
      fitness: best.fitness + 500, // Give it a boost
      generation: this.generationCount
    };

    // Parse adaptation for numeric hints
    if (adaptation.toLowerCase().includes("concurrency")) {
      const match = adaptation.match(/concurrency\s*(?:to|at|of)?\s*(\d+)/i);
      if (match) strategicHero.concurrency = parseInt(match[1]);
    }
    if (adaptation.toLowerCase().includes("delay") || adaptation.toLowerCase().includes("wait")) {
      const match = adaptation.match(/(?:delay|wait)\s*(?:to|at|of)?\s*(\d+)/i);
      if (match) strategicHero.delayBetweenCalls = parseInt(match[1]);
    }
    if (adaptation.toLowerCase().includes("temperature")) {
      const match = adaptation.match(/temperature\s*(?:to|at|of)?\s*([\d.]+)/i);
      if (match) strategicHero.temperature = parseFloat(match[1]);
    }

    // If AI suggests "less aggressive", reduce aggression
    if (adaptation.toLowerCase().includes("less aggressive") || adaptation.toLowerCase().includes("conservative")) {
      strategicHero.aggressionLevel *= 0.5;
    }
    
    // If AI suggests "more aggressive", increase aggression
    if (adaptation.toLowerCase().includes("more aggressive") || adaptation.toLowerCase().includes("faster")) {
      strategicHero.aggressionLevel = Math.min(1, strategicHero.aggressionLevel * 1.5);
    }

    // Replace the worst strategy with the Strategic Hero
    const sorted = [...this.population].sort((a, b) => a.fitness - b.fitness);
    const worstIndex = this.population.findIndex(s => s.id === sorted[0].id);
    this.population[worstIndex] = strategicHero;

    return strategicHero;
  }

  public getPopulation() {
    return this.population;
  }
}
