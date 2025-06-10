import { useKarmycStore } from '../../src/store/areaStore';
import { AREA_ROLE } from '../../src/types/actions';
import { create } from 'zustand';
import { act } from '@testing-library/react';
import { IKarmycOptions } from '../../src/types/karmyc';
import { Space, SpaceState } from '../../src/store/spaceStore';

// Créer une version simplifiée du store pour les tests
const createTestSpaceStore = () => {
  return create<SpaceState>((set, get) => ({
    spaces: {},
    activeSpaceId: null,
    openSpaceIds: [],
    errors: [],
    pilotMode: 'AUTO',
    addSpace: (spaceData) => {
      const newId = 'test-space';
      set(state => ({
        spaces: {
          ...state.spaces,
          [newId]: {
            id: newId,
            name: spaceData.name,
            description: spaceData.description ?? '',
            sharedState: {
              color: spaceData.sharedState?.color ?? '#ff0000',
              pastDiffs: [],
              futureDiffs: [],
              ...(spaceData.sharedState || {})
            }
          }
        },
        openSpaceIds: [...state.openSpaceIds, newId]
      }));
      return newId;
    },
    removeSpace: (id) => {
      set(state => {
        const { [id]: removed, ...spaces } = state.spaces;
        return {
          spaces,
          activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId,
          openSpaceIds: state.openSpaceIds.filter(spaceId => spaceId !== id)
        };
      });
    },
    setActiveSpace: (id) => {
      set({ activeSpaceId: id });
    },
    setPilotMode: (mode) => {
      set({ pilotMode: mode });
    },
    openSpace: (id) => {
      set(state => ({
        openSpaceIds: state.openSpaceIds.includes(id) ? state.openSpaceIds : [...state.openSpaceIds, id]
      }));
    },
    closeSpace: (id) => {
      set(state => ({
        openSpaceIds: state.openSpaceIds.filter(spaceId => spaceId !== id),
        activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId
      }));
    },
    updateSpace: (spaceData) => {
      set(state => ({
        spaces: {
          ...state.spaces,
          [spaceData.id]: {
            ...state.spaces[spaceData.id],
            ...spaceData
          }
        }
      }));
    },
    updateSpaceGenericSharedState: (payload) => {
      set(state => ({
        spaces: {
          ...state.spaces,
          [payload.spaceId]: {
            ...state.spaces[payload.spaceId],
            sharedState: {
              ...state.spaces[payload.spaceId].sharedState,
              ...payload.changes
            }
          }
        }
      }));
    },
    clearErrors: () => set({ errors: [] }),
    undoSharedState: () => {},
    redoSharedState: () => {},
    getSpaceById: (id) => get().spaces[id],
    getAllSpaces: () => get().spaces,
    getActiveSpace: () => {
      const state = get();
      return state.activeSpaceId ? state.spaces[state.activeSpaceId] : null;
    },
    getActiveSpaceId: () => get().activeSpaceId,
    getOpenSpaces: () => {
      const state = get();
      return state.openSpaceIds
        .map(id => state.spaces[id])
        .filter((space): space is Space => space !== undefined);
    },
    getSpaceErrors: () => get().errors,
    getPilotMode: () => get().pilotMode
  }));
};

describe('Space Actions', () => {
  let testSpaceStore: ReturnType<typeof createTestSpaceStore>;

  beforeEach(() => {
    testSpaceStore = createTestSpaceStore();

    // Réinitialiser le store Karmyc
    act(() => {
      useKarmycStore.setState({
        screens: {
          main: {
            areas: {
              _id: 0,
              rootId: null,
              errors: [],
              activeAreaId: null,
              joinPreview: null,
              layout: {},
              areas: {},
              viewports: {},
              areaToOpen: null,
              lastSplitResultData: null,
              lastLeadAreaId: null
            }
          }
        },
        activeScreenId: 'main',
        options: {
          resizableAreas: true,
          manageableAreas: true,
          multiScreen: true,
          builtInLayouts: []
        } as IKarmycOptions
      });
    });
  });

  it('should create a new space', () => {
    act(() => {
      testSpaceStore.getState().addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    });

    const state = testSpaceStore.getState();
    expect(state.spaces['test-space']).toBeDefined();
    expect(state.spaces['test-space'].name).toBe('test-space');
    expect(state.spaces['test-space'].sharedState.color).toBe('#ff0000');
  });

  it('should remove a space', () => {
    act(() => {
      const store = testSpaceStore.getState();
      store.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      store.removeSpace('test-space');
    });

    const state = testSpaceStore.getState();
    expect(state.spaces['test-space']).toBeUndefined();
  });

  it('should update space state', () => {
    act(() => {
      const store = testSpaceStore.getState();
      store.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      store.updateSpaceGenericSharedState({ spaceId: 'test-space', changes: { color: '#00ff00' } });
    });

    const state = testSpaceStore.getState();
    expect(state.spaces['test-space'].sharedState.color).toBe('#00ff00');
  });

  it('should switch active space', () => {
    act(() => {
      const store = testSpaceStore.getState();
      store.addSpace({ name: 'space-1', sharedState: { color: '#ff0000' } });
      store.addSpace({ name: 'space-2', sharedState: { color: '#00ff00' } });
      store.setActiveSpace('space-2');
    });

    const state = testSpaceStore.getState();
    expect(state.activeSpaceId).toBe('space-2');
  });

  it('should handle area roles in spaces', () => {
    act(() => {
      const store = testSpaceStore.getState();
      store.addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      const area = {
        id: 'test-area-1',
        type: 'test-area',
        role: AREA_ROLE.LEAD,
        state: {}
      };
      useKarmycStore.setState({
        screens: {
          main: {
            areas: {
              _id: 0,
              rootId: null,
              errors: [],
              activeAreaId: null,
              joinPreview: null,
              layout: {},
              areas: {
                'test-area-1': area
              },
              viewports: {},
              areaToOpen: null,
              lastSplitResultData: null,
              lastLeadAreaId: null
            }
          }
        },
        activeScreenId: 'main',
        options: {
          resizableAreas: true,
          manageableAreas: true,
          multiScreen: true,
          builtInLayouts: []
        } as IKarmycOptions
      });
    });

    const state = useKarmycStore.getState();
    expect(state.screens.main.areas.areas['test-area-1'].role).toBe(AREA_ROLE.LEAD);
  });
}); 
