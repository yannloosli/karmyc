import { useKarmycStore } from '../../src/store/areaStore';
import { AreaRole } from '../../src/types/area';
import type { RootState } from '../../src/store/areaStore';
import { renderHook } from '@testing-library/react-hooks';

describe('Karmyc Store', () => {
  beforeEach(() => {
    // Réinitialiser le store avec un état valide
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
      }
    });
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useKarmycStore(state => state));
    expect(result.current.screens).toBeDefined();
    expect(result.current.activeScreenId).toBe('main');
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

    useKarmycStore.setState((state: RootState) => ({
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
    useKarmycStore.setState((state: RootState) => ({
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

    // Remove area
    useKarmycStore.setState((state: RootState) => {
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

    const state = result.current;
    expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(0);
  });
}); 
