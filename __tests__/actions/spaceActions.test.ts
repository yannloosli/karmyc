import { karmycStore } from '../../src/store/karmycStore';
import { AreaRole } from '../../src/types/area';
import { useSpaceStore } from '../../src/store/spaceStore';

describe('Space Actions', () => {
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
      spaces: {},
      activeSpaceId: null,
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true,
        builtInLayouts: []
      }
    });
  });

  it('should create a new space', () => {
    const spaceStore = useSpaceStore.getState();
    spaceStore.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    const state = spaceStore.getState();
    expect(state.spaces['test-space']).toBeDefined();
    expect(state.spaces['test-space'].name).toBe('test-space');
    expect(state.spaces['test-space'].sharedState.color).toBe('#ff0000');
  });

  it('should remove a space', () => {
    const spaceStore = useSpaceStore.getState();
    spaceStore.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    spaceStore.removeSpace('test-space');
    const state = spaceStore.getState();
    expect(state.spaces['test-space']).toBeUndefined();
  });

  it('should update space state', () => {
    const spaceStore = useSpaceStore.getState();
    spaceStore.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    spaceStore.updateSpaceGenericSharedState({ spaceId: 'test-space', changes: { color: '#00ff00' } });
    const state = spaceStore.getState();
    expect(state.spaces['test-space'].sharedState.color).toBe('#00ff00');
  });

  it('should switch active space', () => {
    const spaceStore = useSpaceStore.getState();
    spaceStore.addSpace({ name: 'space-1', sharedState: { color: '#ff0000' } });
    spaceStore.addSpace({ name: 'space-2', sharedState: { color: '#00ff00' } });
    spaceStore.setActiveSpace('space-2');
    const state = spaceStore.getState();
    expect(state.activeSpaceId).toBe('space-2');
  });

  it('should handle area roles in spaces', () => {
    const spaceStore = useSpaceStore.getState();
    spaceStore.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    const area = {
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {}
    };
    karmycStore.setState({
      screens: {
        main: {
          areas: {
            'test-area-1': area
          },
          layout: {
            type: 'row',
            children: []
          }
        },
        activeSpaceId: 'test-space'
      }
    });
    const state = karmycStore.getState();
    expect(state.screens.main.areas['test-area-1'].role).toBe('LEAD');
  });
}); 
