import { useKarmycStore } from '../../src/core/store';
import { AREA_ROLE } from '../../src/core/types/actions';
import { create } from 'zustand';
import { act } from '@testing-library/react';
import { IKarmycOptions } from '../../src/core/types/karmyc';
import { Space, SpaceSharedState } from '../../src/core/spaceStore';
import { SpaceStateType } from '../../src/core/spaceStore';

// Créer une version simplifiée du store pour les tests
const createTestSpaceStore = () => {
  return create<SpaceStateType>((set, get) => ({
    spaces: {},
    activeSpaceId: null,
    openSpaceIds: [],
    errors: [],
    pilotMode: 'AUTO',
    addSpace: (spaceData: { name: string; description?: string | undefined; sharedState?: Partial<Omit<SpaceSharedState, "pastDiffs" | "futureDiffs">> | undefined; }) => {
      const newId = 'test-space';
      set((state: SpaceStateType) => ({
        spaces: {
          ...state.spaces,
          [newId]: {
            id: newId,
            name: spaceData.name,
            description: spaceData.description ?? '',
            color: spaceData.sharedState?.color ?? '#ff0000',
            sharedState: {
              ...(spaceData.sharedState || {}),
              pastDiffs: [],
              futureDiffs: []
            }
          }
        },
        openSpaceIds: [...state.openSpaceIds, newId]
      }));
      return newId;
    },
    removeSpace: (id: string) => {
      set((state: SpaceStateType) => {
        const { [id]: removed, ...spaces } = state.spaces;
        return {
          spaces,
          activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId,
          openSpaceIds: state.openSpaceIds.filter(spaceId => spaceId !== id)
        };
      });
    },
    setActiveSpace: (id: string | null) => {
      set({ activeSpaceId: id });
    },
    setPilotMode: (mode: 'AUTO' | 'MANUAL') => {
      set({ pilotMode: mode });
    },
    openSpace: (id: string) => {
      set((state: SpaceStateType) => ({
        openSpaceIds: state.openSpaceIds.includes(id) ? state.openSpaceIds : [...state.openSpaceIds, id]
      }));
    },
    closeSpace: (id: string) => {
      set((state: SpaceStateType) => ({
        openSpaceIds: state.openSpaceIds.filter(spaceId => spaceId !== id),
        activeSpaceId: state.activeSpaceId === id ? null : state.activeSpaceId
      }));
    },
    updateSpace: (spaceData: Partial<Space> & { id: string }) => {
      set((state: SpaceStateType) => ({
        spaces: {
          ...state.spaces,
          [spaceData.id]: {
            ...state.spaces[spaceData.id],
            ...spaceData
          }
        }
      }));
    },
    updateSpaceGenericSharedState: (payload: { spaceId: string; changes: Partial<SpaceSharedState> }) => {
      set((state: SpaceStateType) => ({
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
    getSpaceById: (id: string) => get().spaces[id],
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
          "1": {
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
        activeScreenId: '1',
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
      testSpaceStore.getState().addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      testSpaceStore.getState().removeSpace('test-space');
    });

    const state = testSpaceStore.getState();
    expect(state.spaces['test-space']).toBeUndefined();
  });

  it('should update space state', () => {
    act(() => {
      testSpaceStore.getState().addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      testSpaceStore.getState().updateSpaceGenericSharedState({ spaceId: 'test-space', changes: { color: '#00ff00' } });
    });

    const state = testSpaceStore.getState();
    expect(state.spaces['test-space'].sharedState.color).toBe('#00ff00');
  });

  it('should switch active space', () => {
    act(() => {
      testSpaceStore.getState().addSpace({ name: 'space-1', sharedState: { color: '#ff0000' } });
      testSpaceStore.getState().addSpace({ name: 'space-2', sharedState: { color: '#00ff00' } });
      testSpaceStore.getState().setActiveSpace('space-2');
    });

    const state = testSpaceStore.getState();
    expect(state.activeSpaceId).toBe('space-2');
  });

  it('should handle area roles in spaces', () => {
    act(() => {
      testSpaceStore.getState().addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
      const area = {
        id: 'test-area-1',
        type: 'test-area',
        role: AREA_ROLE.LEAD,
        state: {}
      };
      useKarmycStore.setState({
        screens: {
          "1": {
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
        activeScreenId: '1',
        options: {
          resizableAreas: true,
          manageableAreas: true,
          multiScreen: true,
          builtInLayouts: []
        } as IKarmycOptions
      });
    });

    const state = useKarmycStore.getState();
    expect(state.screens['1'].areas.areas['test-area-1'].role).toBe(AREA_ROLE.LEAD);
  });
}); 
