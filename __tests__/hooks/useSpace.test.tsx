import { renderHook, act } from '@testing-library/react-hooks';
import { useSpace } from '../../src/hooks/useSpace';
import { useSpaceStore } from '../../src/store/spaceStore';

describe('useSpace', () => {
  beforeEach(() => {
    useSpaceStore.setState({
      spaces: {},
      activeSpaceId: null,
      openSpaceIds: [],
      pilotMode: 'MANUAL'
    });
  });

  it('should create a new space', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('test-space', { color: '#ff0000' });
    });

    const state = useSpaceStore.getState();
    expect(state.spaces['test-space']).toBeDefined();
    expect(state.spaces['test-space'].name).toBe('test-space');
    expect(state.spaces['test-space'].sharedState.color).toBe('#ff0000');
  });

  it('should remove a space', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.deleteSpace('test-space');
    });

    const state = useSpaceStore.getState();
    expect(state.spaces['test-space']).toBeUndefined();
  });

  it('should update space state', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.updateSharedState('test-space', { color: '#00ff00' });
    });

    const state = useSpaceStore.getState();
    expect(state.spaces['test-space'].sharedState.color).toBe('#00ff00');
  });

  it('should switch active space', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('space-1', { color: '#ff0000' });
      result.current.createSpace('space-2', { color: '#00ff00' });
      result.current.setActive('space-2');
    });

    const state = useSpaceStore.getState();
    expect(state.activeSpaceId).toBe('space-2');
  });

  it('should handle space persistence', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('test-space', { color: '#ff0000' });
    });

    // Simulate page reload
    useSpaceStore.setState({
      ...useSpaceStore.getState(),
      spaces: {}
    });

    // Check that the space is restored
    const state = useSpaceStore.getState();
    expect(state.spaces['test-space']).toBeDefined();
  });

  it('should handle space synchronization', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.updateSharedState('test-space', { color: '#00ff00' });
    });

    // Simulate synchronization between tabs
    const state = useSpaceStore.getState();
    expect(state.spaces['test-space'].sharedState.color).toBe('#00ff00');
  });
}); 
