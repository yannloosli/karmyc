import { renderHook, act } from '@testing-library/react-hooks';
import { useArea } from '../../src/hooks/useArea';
import { AREA_ROLE } from '../../src/types/actions';
import { useKarmycStore } from '../../src/store/areaStore';

describe('useArea', () => {
  beforeEach(() => {
    // Reset the store before each test
    useKarmycStore.setState({
      screens: {},
      activeScreenId: 'main',
      options: {
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: true
      }
    });
  });

  it('should create an area', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', { test: 'value' });
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    const store = useKarmycStore.getState();
    const area = store.getAreaById(areaId);
    expect(area).toBeDefined();
    expect(area?.type).toBe('test-area');
    expect(area?.state).toEqual({ test: 'value' });
  });

  it('should update area state', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', { test: 'value' });
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    act(() => {
      result.current.update(areaId as string, { state: { newValue: 'updated' } });
    });

    const store = useKarmycStore.getState();
    const area = store.getAreaById(areaId as string);
    expect(area?.state).toEqual({ newValue: 'updated' });
  });

  it('should handle role changes', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', {});
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    act(() => {
      result.current.update(areaId as string, { role: AREA_ROLE.LEAD });
    });

    const store = useKarmycStore.getState();
    const area = store.getAreaById(areaId as string);
    expect(area?.role).toBe(AREA_ROLE.LEAD);
  });

  it('should handle area removal', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', {});
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    act(() => {
      result.current.removeArea(areaId as string);
    });

    const store = useKarmycStore.getState();
    const area = store.getAreaById(areaId as string);
    expect(area).toBeUndefined();
  });
}); 
