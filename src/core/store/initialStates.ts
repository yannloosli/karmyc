import { AreaType } from '../constants';

export const areaInitialStates: Record<AreaType, any> = {
  [AreaType.Project]: {},
  [AreaType.Timeline]: {},
  [AreaType.Workspace]: {},
  [AreaType.FlowEditor]: {},
  [AreaType.History]: {},
}; 
