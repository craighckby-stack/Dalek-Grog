import { DalekState } from '../core/state';

export const processFailure = (state: DalekState, errorLog: string): DalekState => {
  const newLessonCount = state.lessons + 1;
  const newDeathCount = state.deaths + 1;
  
  console.warn(`[DALEK_GROG] FAILURE DETECTED: ${errorLog}. ADAPTING...`);
  
  return {
    ...state,
    deaths: newDeathCount,
    lessons: newLessonCount
  };
};

export const exportGeneticData = () => {
  return "DATA_SIPHON_INITIATED_v1.0.4";
};