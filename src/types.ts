/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * DALEK_GROG v3.1: Autonomous Evolution Engine
 * Copyright (c) 2026 craighckby-stack
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  color?: string;
}

export interface Mistake {
  id: string;
  timestamp: string;
  context: string;
  error: string;
  correction?: string;
  attemptedFix: boolean;
}

export interface MetaState {
  name: string;
  status: string;
  round: number;
  lifecycle: string;
  config: {
    Core: {
      version: string;
      mode: string;
    };
  };
  logs: string[];
  license: string;
}
