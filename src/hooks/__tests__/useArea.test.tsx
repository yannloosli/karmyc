import { renderHook, act } from '@testing-library/react';
import { useArea } from '../useArea';
import { KarmycProvider } from '../../providers/KarmycProvider';
import { useKarmycStore } from '../../store/areaStore';

describe('useArea', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <KarmycProvider options={{}}>
      {children}
    </KarmycProvider>
  );

  beforeEach(() => {
    // Réinitialiser le store à son état initial
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
      nextScreenId: 2,
      options: { allowStackMixedRoles: true },
      lastUpdated: Date.now()
    });
  });

  it('should create a new area', () => {
    const { result } = renderHook(() => useArea(), { wrapper });

    let areaId = '';
    act(() => {
      areaId = result.current.createArea('test-area', { content: 'test' });
    });

    const area = result.current.getById(areaId);
    expect(area).toBeDefined();
    expect(area?.type).toBe('test-area');
    expect(area?.state).toEqual({ content: 'test' });
  });

  it('should update an existing area', () => {
    const { result } = renderHook(() => useArea(), { wrapper });

    let areaId = '';
    act(() => {
      areaId = result.current.createArea('test-area', { content: 'test' });
    });

    act(() => {
      result.current.update(areaId, { state: { content: 'updated' } });
    });

    const area = result.current.getById(areaId);
    expect(area?.state).toEqual({ content: 'updated' });
  });

  it('should get areas by space id', () => {
    const { result } = renderHook(() => useArea(), { wrapper });

    act(() => {
      result.current.createArea('test-area', { content: 'test' }, { x: 0, y: 0 });
      result.current.createArea('test-area', { content: 'test2' }, { x: 0, y: 0 });
      result.current.createArea('test-area', { content: 'test3' }, { x: 0, y: 0 });
    });

    const areas = result.current.getAll();
    expect(Object.values(areas)).toHaveLength(3);
    expect(Object.values(areas)[0].state.content).toBe('test');
    expect(Object.values(areas)[1].state.content).toBe('test2');
  });
}); 
