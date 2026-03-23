/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

import { GateStats } from "../evolutors/apiGate";
import { EvolutionaryStrategy } from "../evolutors/evolutionService";

export interface LogContext {
  stats?: GateStats;
  strategy?: EvolutionaryStrategy;
  [key: string]: any;
}

/**
 * GrogLogger: Enhanced logging mechanism with detailed error context.
 * Captures call stacks, system metrics, and evolutionary strategy state.
 */
export class GrogLogger {
  private static addLog: (message: string, color?: string) => void;

  /**
   * Initializes the logger with the UI-level log function.
   */
  static initialize(addLog: (message: string, color?: string) => void) {
    this.addLog = addLog;
  }

  /**
   * Logs an informational message.
   */
  static info(message: string, context?: LogContext) {
    this.log(message, 'var(--color-dalek-cyan-dim)', context);
  }

  /**
   * Logs a warning message.
   */
  static warn(message: string, context?: LogContext) {
    this.log(message, 'var(--color-dalek-gold)', context);
  }

  /**
   * Logs a critical error with detailed context.
   */
  static error(message: string, error?: any, context?: LogContext) {
    let fullMessage = `[CRITICAL] ${message}`;
    
    if (error) {
      const errorMsg = error.message || String(error);
      const stack = error.stack || 'No stack trace available';
      fullMessage += `\n> REASON: ${errorMsg}\n> STACK: ${stack}`;
    }

    if (context) {
      if (context.stats) {
        const s = context.stats;
        fullMessage += `\n> METRICS: Tokens=${s.estimatedTokensUsed.toLocaleString()}, Calls=${s.callCount}, Retries=${s.retryCount}, Queued=${s.queuedCount}`;
      }
      if (context.strategy) {
        const st = context.strategy;
        fullMessage += `\n> STRATEGY: ID=${st.id}, Gen=${st.generation}, Fitness=${st.fitness.toFixed(0)}, Model=${st.modelPreference}, Temp=${st.temperature.toFixed(2)}`;
      }
    }

    this.log(fullMessage, 'var(--color-dalek-red)', context);
  }

  /**
   * Internal log dispatcher.
   */
  private static log(message: string, color: string, context?: LogContext) {
    if (this.addLog) {
      this.addLog(message, color);
    } else {
      console.log(`%c${message}`, `color: ${color}`, context);
    }
  }
}
