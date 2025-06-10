import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { useSpace } from '../../src/hooks/useSpace';
import { useSpaceStore } from '../../src/store/spaceStore';
import { resetSpaceStore, createTestSpace, assertStoreState } from '../__mocks__/hookTestUtils';

describe('useSpace', () => {
  beforeEach(() => {
    resetSpaceStore();
  });

  it('should create a new space', async () => {
    const { result } = renderHook(() => useSpace());

    let spaceId: string | undefined;
    await act(async () => {
      spaceId = result.current.createSpace('test-space', { color: '#ff0000' });
    });

    expect(spaceId).toBeDefined();
    assertStoreState(useSpaceStore, {
      [`spaces.${spaceId}.name`]: 'test-space',
      [`spaces.${spaceId}.sharedState.color`]: '#ff0000',
      'openSpaceIds': [spaceId]
    });
  });

  it('should remove a space', async () => {
    const { result } = renderHook(() => useSpace());

    let spaceId: string | undefined;
    await act(async () => {
      spaceId = result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.deleteSpace(spaceId!);
    });

    assertStoreState(useSpaceStore, {
      [`spaces.${spaceId}`]: undefined,
      'openSpaceIds': []
    });
  });

  it('should update space state', async () => {
    const { result } = renderHook(() => useSpace());

    let spaceId: string | undefined;
    await act(async () => {
      spaceId = result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.updateSharedState(spaceId!, { color: '#00ff00' });
    });

    assertStoreState(useSpaceStore, {
      [`spaces.${spaceId}.sharedState.color`]: '#00ff00',
      [`spaces.${spaceId}.sharedState.pastDiffs`]: expect.any(Array),
      [`spaces.${spaceId}.sharedState.futureDiffs`]: []
    });
  });

  it('should switch active space', async () => {
    const { result } = renderHook(() => useSpace());

    let space1Id: string | undefined;
    let space2Id: string | undefined;
    await act(async () => {
      space1Id = result.current.createSpace('space-1', { color: '#ff0000' });
      space2Id = result.current.createSpace('space-2', { color: '#00ff00' });
      result.current.setActive(space2Id!);
    });

    assertStoreState(useSpaceStore, {
      'activeSpaceId': space2Id,
      'openSpaceIds': [space1Id, space2Id]
    });
  });

  it('should handle space persistence', async () => {
    const { result } = renderHook(() => useSpace());

    let spaceId: string | undefined;
    await act(async () => {
      spaceId = result.current.createSpace('test-space', { color: '#ff0000' });
    });

    // Simulate page reload by creating a new store instance
    const persistedState = useSpaceStore.getState();
    await act(async () => {
      resetSpaceStore();
    });

    // Simulate loading persisted state
    await act(async () => {
      useSpaceStore.setState(persistedState);
    });

    assertStoreState(useSpaceStore, {
      [`spaces.${spaceId}`]: expect.any(Object),
      'openSpaceIds': [spaceId]
    });
  });

  it('should handle space synchronization', async () => {
    const { result } = renderHook(() => useSpace());

    let spaceId: string | undefined;
    await act(async () => {
      spaceId = result.current.createSpace('test-space', { color: '#ff0000' });
      result.current.updateSharedState(spaceId!, { color: '#00ff00' });
    });

    assertStoreState(useSpaceStore, {
      [`spaces.${spaceId}.sharedState.color`]: '#00ff00',
      [`spaces.${spaceId}.sharedState.pastDiffs`]: expect.any(Array),
      [`spaces.${spaceId}.sharedState.futureDiffs`]: []
    });
  });

  it('should handle pilot mode', async () => {
    const { result } = renderHook(() => useSpace());

    await act(async () => {
      result.current.setPilotMode('AUTO');
    });

    assertStoreState(useSpaceStore, {
      'pilotMode': 'AUTO'
    });
  });
}); 
