import { useKarmycStore, RootStateType } from '../../src/core/store';
import { AreaRole } from '../../src/core/types/karmyc';
import { renderHook, act } from '@testing-library/react';

describe('Karmyc Store', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Réinitialiser le store avec un état valide
    act(() => {
      useKarmycStore.setState({
        screens: {
          '1': {
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
        }
      });
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
    container.remove();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useKarmycStore(state => state));
    expect(result.current.screens).toBeDefined();
    expect(result.current.activeScreenId).toBe('1');
    expect(result.current.options.resizableAreas).toBe(true);
  });

  it('should add a new area', () => {
    const { result } = renderHook(() => useKarmycStore(state => state));
    const areaId = Date.now().toString();
    const newArea = {
      id: areaId,
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {
        isActive: false,
        isMinimized: false,
        isMaximized: false,
        isDetached: false
      }
    };

    act(() => {
      useKarmycStore.setState((state: RootStateType) => ({
        ...state,
        screens: {
          ...state.screens,
          [state.activeScreenId]: {
            areas: {
              ...state.screens[state.activeScreenId].areas,
              areas: {
                ...state.screens[state.activeScreenId].areas.areas,
                [areaId]: newArea
              }
            }
          }
        }
      }));
    });

    const state = result.current;
    expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(1);
    expect(state.screens[state.activeScreenId].areas.areas[areaId]).toEqual(newArea);
  });

  it('should remove an area', () => {
    const { result } = renderHook(() => useKarmycStore(state => state));
    const areaId = Date.now().toString();
    const newArea = {
      id: areaId,
      type: 'test-area',
      role: 'LEAD' as AreaRole,
      state: {
        isActive: false,
        isMinimized: false,
        isMaximized: false,
        isDetached: false
      }
    };

    // Add area first
    act(() => {
      useKarmycStore.setState((state: RootStateType) => ({
        ...state,
        screens: {
          ...state.screens,
          [state.activeScreenId]: {
            areas: {
              ...state.screens[state.activeScreenId].areas,
              areas: {
                ...state.screens[state.activeScreenId].areas.areas,
                [areaId]: newArea
              }
            }
          }
        }
      }));
    });

    // Remove area
    act(() => {
      useKarmycStore.setState((state: RootStateType) => {
        const { [areaId]: removedArea, ...remainingAreas } = state.screens[state.activeScreenId].areas.areas;
        return {
          ...state,
          screens: {
            ...state.screens,
            [state.activeScreenId]: {
              ...state.screens[state.activeScreenId],
              areas: {
                ...state.screens[state.activeScreenId].areas,
                areas: remainingAreas
              }
            }
          }
        };
      });
    });

    const state = result.current;
    expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(0);
  });
}); 
