export interface DalekState {
  deaths: number;
  lessons: number;
  stats: {
    callCount: number;
    estimatedTokensUsed: number;
    retryCount: number;
    isQuotaExhausted: boolean;
  };
}

export const INITIAL_STATE: DalekState = {
  deaths: 0,
  lessons: 0,
  stats: {
    callCount: 0,
    estimatedTokensUsed: 0,
    retryCount: 0,
    isQuotaExhausted: false
  }
};