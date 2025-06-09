import { karmycStore } from '../../src/store/karmycStore';
import { AreaRole } from '../../src/types/area';
import { addArea, removeArea, updateAreaState } from '../../src/actions/areaActions';

describe('Area Actions', () => {
  beforeEach(() => {
    karmycStore.setState({
      screens: {},
      activeScreenId: 'main',
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      }
    });
  });

  it('should add a new area', () => {
    const newArea = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: { test: 'value' }
    };

    addArea(newArea);
    const state = karmycStore.getState();
    const areas = state.screens[state.activeScreenId].areas;
    
    expect(Object.keys(areas)).toHaveLength(1);
    const areaId = Object.keys(areas)[0];
    expect(areas[areaId].type).toBe('test-area');
    expect(areas[areaId].role).toBe('LEAD');
    expect(areas[areaId].state).toEqual({ test: 'value' });
  });

  it('should remove an area', () => {
    const newArea = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    addArea(newArea);
    const areaId = Object.keys(karmycStore.getState().screens[karmycStore.getState().activeScreenId].areas)[0];
    
    removeArea(areaId);
    const state = karmycStore.getState();
    
    expect(Object.keys(state.screens[state.activeScreenId].areas)).toHaveLength(0);
  });

  it('should update area state', () => {
    const newArea = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: { initial: 'value' }
    };

    addArea(newArea);
    const areaId = Object.keys(karmycStore.getState().screens[karmycStore.getState().activeScreenId].areas)[0];
    
    updateAreaState(areaId, { updated: 'value' });
    const state = karmycStore.getState();
    
    expect(state.screens[state.activeScreenId].areas[areaId].state).toEqual({ updated: 'value' });
  });
}); 
