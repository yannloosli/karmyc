import { renderHook, act } from '@testing-library/react-hooks';
import { useSpace } from '../useSpace';

describe('useSpace', () => {
  beforeEach(() => {
    // Réinitialiser le localStorage avant chaque test
    localStorage.clear();
  });

  it('devrait créer un nouvel espace', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('Test Space', { color: '#ff0000' });
    });

    expect(result.current.spaceList).toHaveLength(1);
    expect(result.current.spaceList[0].name).toBe('Test Space');
    expect(result.current.spaceList[0].sharedState.color).toBe('#ff0000');
  });

  it('devrait mettre à jour l\'état partagé d\'un espace', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('Test Space', { color: '#ff0000' });
    });

    const spaceId = result.current.spaceList[0].id;

    act(() => {
      result.current.updateSharedState(spaceId, { color: '#00ff00' });
    });

    expect(result.current.spaceList[0].sharedState.color).toBe('#00ff00');
  });

  it('devrait changer l\'espace actif', () => {
    const { result } = renderHook(() => useSpace());

    act(() => {
      result.current.createSpace('Space 1', {});
      result.current.createSpace('Space 2', {});
    });

    const space2Id = result.current.spaceList[1].id;

    act(() => {
      result.current.setActive(space2Id);
    });

    expect(result.current.activeSpaceId).toBe(space2Id);
  });
}); 
