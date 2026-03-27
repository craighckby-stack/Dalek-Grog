import { useState, useCallback } from 'react';
import { SystemState, INITIAL_STATE } from '../types/consciousness';

export const useDalekState = (initial = INITIAL_STATE) => {
  const [state, setState] = useState<SystemState>(initial);

  const registerDeath = useCallback(() => {
    setState(prev => ({ ...prev, deaths: prev.deaths + 1 }));
    console.warn('DALEK_GROG: UNIT TERMINATED. REGENERATING...');
  }, []);

  const harvestLesson = useCallback(() => {
    setState(prev => ({ ...prev, lessons: prev.lessons + 1 }));
    console.info('DALEK_GROG: KNOWLEDGE ASSIMILATED.');
  }, []);

  return { state, registerDeath, harvestLesson };
};