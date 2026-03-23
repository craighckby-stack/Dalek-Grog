/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

import { NexusComplexityAnalyzer } from "../core/nexus_core";

/**
 * SaturationService: Manages code saturation analysis and dynamic mutation guidelines.
 */
export class SaturationService {
  /**
   * Calculates the DNA saturation level of a given code content.
   * Dynamically adjusts based on complexity, node count, and technical debt markers.
   */
  public static calculateSaturation(content: string): number {
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
  public static getDynamicSaturationGuidelines(path: string, content: string): string {
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
}
