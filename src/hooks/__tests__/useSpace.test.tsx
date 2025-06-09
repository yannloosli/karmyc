import { renderHook, act } from '@testing-library/react';
import { useSpace } from '../useSpace';
import { KarmycProvider } from '../../providers/KarmycProvider';
import { useSpaceStore } from '../../store/spaceStore';

describe('useSpace', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <KarmycProvider options={{}}>
      {children}
    </KarmycProvider>
  );

  beforeEach(() => {
    useSpaceStore.setState({ spaces: {}, activeSpaceId: null, openSpaceIds: [] });
  });

  it('should create a new space', () => {
    const { result } = renderHook(() => useSpace(), { wrapper });

    act(() => {
      result.current.createSpace('Test Space', { color: '#ff0000' });
    });

    expect(result.current.spaceList).toHaveLength(1);
    expect(result.current.spaceList[0].name).toBe('Test Space');
    const space = result.current.getSpaceById(result.current.spaceList[0].id);
    expect(space?.sharedState).toMatchObject({ color: '#ff0000' });
  });

  it('should switch between spaces', () => {
    const { result } = renderHook(() => useSpace(), { wrapper });

    act(() => {
      result.current.createSpace('Space 1', {});
      result.current.createSpace('Space 2', {});
    });

    expect(result.current.spaceList).toHaveLength(2);

    act(() => {
      result.current.setActive(result.current.spaceList[1].id);
    });

    expect(result.current.activeSpaceId).toBe(result.current.spaceList[1].id);
  });

  it('should update shared state', () => {
    const { result } = renderHook(() => useSpace(), { wrapper });

    act(() => {
      result.current.createSpace('Test Space', { color: '#ff0000' });
    });

    act(() => {
      result.current.updateSharedState(result.current.spaceList[0].id, { color: '#00ff00' });
    });

    const space = result.current.getSpaceById(result.current.spaceList[0].id);
    expect(space?.sharedState).toMatchObject({ color: '#00ff00' });
  });

  it('should create a new space with multiple properties', () => {
    const { result } = renderHook(() => useSpace(), { wrapper });

    act(() => {
      result.current.createSpace('Test Space', { color: '#ff0000', additionalProperty: 'value' });
    });

    expect(result.current.spaceList).toHaveLength(1);
    expect(result.current.spaceList[0].name).toBe('Test Space');
    const space = result.current.getSpaceById(result.current.spaceList[0].id);
    expect(space?.sharedState).toMatchObject({ color: '#ff0000', additionalProperty: 'value' });
  });

  it('should switch between spaces and have more than two spaces', () => {
    const { result } = renderHook(() => useSpace(), { wrapper });

    act(() => {
      result.current.createSpace('Space 1', {});
      result.current.createSpace('Space 2', {});
      result.current.createSpace('Space 3', {});
    });

    expect(result.current.spaceList).toHaveLength(3);

    act(() => {
      result.current.setActive(result.current.spaceList[2].id);
    });

    expect(result.current.activeSpaceId).toBe(result.current.spaceList[2].id);
  });
}); 
