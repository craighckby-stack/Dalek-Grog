export interface DalekState {
  deaths: number;
  lessons: number;
  integrityLevel: number;
  strategicDirectives: string[];
}

export interface StrategicLesson {
  id: string;
  context: string;
  outcome: 'SUCCESS' | 'FAILURE';
  timestamp: number;
}