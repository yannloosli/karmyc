import { karmycStore } from '../../src/store/karmycStore';
import { AreaRole } from '../types/area';
import { 
  addAreaToLayout,
  removeAreaFromLayout,
  updateLayout,
  splitArea
} from '../../src/actions/layoutActions';

describe('Layout Actions', () => {
  beforeEach(() => {
    karmycStore.setState({
      screens: {
        main: {
          areas: {},
          layout: {
            type: 'row',
            children: []
          }
        }
      },
      activeScreenId: 'main',
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      }
    });
  });

  it('should add area to layout', () => {
    const area = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    addAreaToLayout(area, { x: 0, y: 0 });
    const state = karmycStore.getState();
    
    expect(state.screens.main.layout.children).toHaveLength(1);
  });

  it('should remove area from layout', () => {
    const area = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    addAreaToLayout(area, { x: 0, y: 0 });
    const areaId = Object.keys(karmycStore.getState().screens.main.areas)[0];
    
    removeAreaFromLayout(areaId);
    const state = karmycStore.getState();
    
    expect(state.screens.main.layout.children).toHaveLength(0);
  });

  it('should update layout', () => {
    const newLayout = {
      type: 'column',
      children: []
    };

    updateLayout(newLayout);
    const state = karmycStore.getState();
    
    expect(state.screens.main.layout).toEqual(newLayout);
  });

  it('should split area', () => {
    const area = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };

    addAreaToLayout(area, { x: 0, y: 0 });
    const areaId = Object.keys(karmycStore.getState().screens.main.areas)[0];
    
    splitArea(areaId, 'horizontal');
    const state = karmycStore.getState();
    
    expect(state.screens.main.layout.children).toHaveLength(2);
  });
}); 
