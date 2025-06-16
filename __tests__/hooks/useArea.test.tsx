import { renderHook, act } from '@testing-library/react';
import { useArea } from '../../src/hooks/useArea';
import { useKarmycStore } from '../../src/core/store';
import { resetKarmycStore, assertStoreState } from '../__mocks__/hookTestUtils';
import { areaRegistry } from '../../src/core/registries/areaRegistry';
import React from 'react';

// Composant de test pour l'aire
const TestAreaComponent: React.FC = () => {
  return <div data-testid="test-area">Test Area</div>;
};

describe('useArea', () => {
  beforeEach(() => {
    resetKarmycStore();
    // Enregistrer le composant de test
    areaRegistry.registerComponent('test-area', TestAreaComponent);
    // Enregistrer l'état initial
    areaRegistry.registerInitialState('test-area', {});
  });

  afterEach(() => {
    // Nettoyer l'enregistrement
    areaRegistry.unregisterAreaType('test-area');
  });

  it('should create an area', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', { test: 'value' });
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    assertStoreState(useKarmycStore, {
      [`screens.1.areas.areas.${areaId}.type`]: 'test-area',
      [`screens.1.areas.areas.${areaId}.state`]: { test: 'value' }
    });
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

    assertStoreState(useKarmycStore, {
      [`screens.1.areas.areas.${areaId}.state`]: { newValue: 'updated' }
    });
  });

  it('should handle area position updates', () => {
    const { result } = renderHook(() => useArea());
    
    let areaId: string | undefined;
    act(() => {
      areaId = result.current.createArea('test-area', {});
    });

    expect(areaId).toBeDefined();
    if (!areaId) return;

    const newPosition = { x: 100, y: 200 };
    act(() => {
      result.current.update(areaId as string, { position: newPosition });
    });

    assertStoreState(useKarmycStore, {
      [`screens.1.areas.areas.${areaId}.position`]: newPosition
    });
  });
}); 
