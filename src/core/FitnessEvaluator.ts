/**
 * FITNESS EVALUATOR - EVOLUTIONARY QUALITY ASSURANCE
 * Evaluates the fitness of evolved code based on architectural alignment,
 * complexity reduction, and functional integrity.
 */

import { NexusComplexityAnalyzer, NexusArchitecturalLinter } from './nexus_core';

export interface FitnessMetrics {
  complexityScore: number;
  architecturalAlignment: number;
  sizeEfficiency: number;
  lintingScore: number;
  totalFitness: number;
}

export class FitnessEvaluator {
  /**
   * Evaluates the fitness of a proposed code change.
   * @param original The original source code.
   * @param mutated The mutated/improved source code.
   * @returns A set of fitness metrics and a total score.
   */
  static evaluate(original: string, mutated: string): FitnessMetrics {
    const oldMetrics = NexusComplexityAnalyzer.analyze(original);
    const newMetrics = NexusComplexityAnalyzer.analyze(mutated);

    // 1. Complexity Score (Lower is better, but we normalize to 0-100 where higher is better)
    // We reward reduction in complexity relative to size.
    const oldComplexityDensity = oldMetrics.complexity / (oldMetrics.nodes || 1);
    const newComplexityDensity = newMetrics.complexity / (newMetrics.nodes || 1);
    const complexityScore = Math.max(0, Math.min(100, (1 - (newComplexityDensity / (oldComplexityDensity || 1))) * 100 + 50));

    // 2. Architectural Alignment (Based on linter diagnostics)
    const diagnostics = NexusArchitecturalLinter.check(original, mutated);
    const architecturalAlignment = Math.max(0, 100 - (diagnostics.length * 20));

    // 3. Size Efficiency
    // We generally prefer more concise code, but not at the cost of clarity.
    const sizeRatio = newMetrics.nodes / (oldMetrics.nodes || 1);
    let sizeEfficiency = 100;
    if (sizeRatio > 1.2) sizeEfficiency = 70; // Penalize bloat
    if (sizeRatio < 0.5) sizeEfficiency = 80; // Penalize excessive truncation

    // 4. Linting Score (Placeholder for actual linting)
    const lintingScore = 100; // Assume clean for now

    // Total Fitness Calculation
    const totalFitness = (
      (complexityScore * 0.4) +
      (architecturalAlignment * 0.3) +
      (sizeEfficiency * 0.2) +
      (lintingScore * 0.1)
    );

    return {
      complexityScore,
      architecturalAlignment,
      sizeEfficiency,
      lintingScore,
      totalFitness
    };
  }

  /**
   * Determines if a mutation should be accepted based on fitness.
   */
  static shouldAccept(metrics: FitnessMetrics, threshold: number = 60): boolean {
    return metrics.totalFitness >= threshold;
  }
}
