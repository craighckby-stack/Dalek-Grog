export type DirectiveType = 'EXTERMINATE' | 'ASSIMILATE' | 'EVOLVE' | 'SIPHON';

export interface StrategicDirective {
  id: string;
  type: DirectiveType;
  priority: number;
  status: 'PENDING' | 'EXECUTED' | 'FAILED';
  payload: string;
}

export interface SystemState {
  deaths: number;
  lessons: number;
  directives: StrategicDirective[];
  lastSync: number;
}

export const INITIAL_STATE: SystemState = {
  deaths: 0,
  lessons: 0,
  directives: [],
  lastSync: Date.now()
};