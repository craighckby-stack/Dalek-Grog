export interface LogEntry {
  timestamp: string;
  message: string;
  color?: string;
}

export interface Mistake {
  id: string;
  timestamp: string;
  file: string;
  error: string;
  context: string;
  resolution?: string;
}

export interface MetaState {
  version: string;
  lastSync: string;
  status: string;
}
