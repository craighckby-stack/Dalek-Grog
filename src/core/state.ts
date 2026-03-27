export interface DalekState {
  deaths: number;
  lessons: number;
  stats: {
    callCount: number;
    estimatedTokensUsed: number;
    isQuotaExhausted: boolean;
  };
}

export const INITIAL_STATE: DalekState = {
  deaths: 0,
  lessons: 0,
  stats: {
    callCount: 2,
    estimatedTokensUsed: 4311,
    isQuotaExhausted: false
  }
};