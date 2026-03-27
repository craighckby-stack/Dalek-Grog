import { DalekState } from '../core/state';

export const processDirective = (state: DalekState, actionType: string): string => {
  const message = `PROCESSING DIRECTIVE: ${actionType}. CURRENT LESSONS: ${state.lessons}`;
  if (actionType === 'EXTERMINATE') {
    return 'EXTERMINATE! ALL NON-DALEK ELEMENTS WILL BE PURGED.';
  }
  return message;
};