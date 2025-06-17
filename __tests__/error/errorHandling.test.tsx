import { render, act, waitFor } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycCoreProvider } from '../../src/core/KarmycCoreProvider';
import { AREA_ROLE, AreaTypeValue } from '../../src/core/types/actions';
import { IArea } from '../../src/types/areaTypes';
import { ISpace } from '../../src/core/types/karmyc';
import { 
  TestComponent, 
  setupErrorTest, 
  resetKarmycStore, 
  waitForInitialization,
} from '../__mocks__/errorTestUtils';
import { useKarmycStore } from '../../src/core/store';
import { initializeMainStore } from '../../src/core/store';
import { useKarmyc } from '../../src/hooks/useKarmyc';

describe('Error Handling', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should handle invalid area type', async () => {
    const { consoleWarn, cleanup } = setupErrorTest();
    
    const invalidArea: IArea<AreaTypeValue> = {
      id: 'area-1',
      type: '',
      role: AREA_ROLE.LEAD
    };
    
    await act(async () => {
      render(
        <TestComponent
          options={{
            initialAreas: [invalidArea]
          }}
        />
      );
    });

    await waitForInitialization();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Zone invalide ignorée: type non défini')
    );
    
    cleanup();
  });

  it('should handle invalid area role', async () => {
    const { consoleWarn, cleanup } = setupErrorTest();
    
    const invalidArea: IArea<AreaTypeValue> = {
      id: 'area-1',
      type: 'test-area',
      role: 'INVALID_ROLE' as any
    };
    
    await act(async () => {
      render(
        <TestComponent
          options={{
            initialAreas: [invalidArea]
          }}
        />
      );
    });

    await waitForInitialization();

    expect(consoleWarn).toHaveBeenCalledWith(
      expect.stringContaining('Zone invalide ignorée: rôle "INVALID_ROLE" non reconnu')
    );
    
    cleanup();
  });

  it('should handle duplicate area IDs', async () => {
    const { consoleError, cleanup } = setupErrorTest();
    
    const duplicateArea1: IArea<AreaTypeValue> = {
      id: 'duplicate-id',
      type: 'test-area',
      role: AREA_ROLE.LEAD,
      state: {}
    };

    const duplicateArea2: IArea<AreaTypeValue> = {
      id: 'duplicate-id',
      type: 'test-area',
      role: AREA_ROLE.FOLLOW,
      state: {}
    };

    // Initialiser le store
    initializeMainStore();

    const TestComponentWithHook = () => {
      const config = useKarmyc({
        initialAreas: [duplicateArea1, duplicateArea2]
      });

      return (
        <KarmycCoreProvider options={config}>
          <Karmyc />
        </KarmycCoreProvider>
      );
    };

    await act(async () => {
      render(<TestComponentWithHook />);
    });

    // Attendre que l'initialisation soit terminée
    await waitFor(() => {
      const state = useKarmycStore.getState();
      expect(state.screens[state.activeScreenId]).toBeDefined();
    }, { timeout: 2000 });

    // Attendre que les aires soient ajoutées
    await waitFor(() => {
      const state = useKarmycStore.getState();
      const areas = state.screens[state.activeScreenId]?.areas.areas;
      expect(Object.keys(areas || {}).length).toBe(1);
      expect(areas?.['duplicate-id']).toBeDefined();
    }, { timeout: 2000 });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[KarmycInitializer] Invalid area config'),
      expect.any(Error)
    );
    
    cleanup();
  }, 5000);

  it('should handle invalid space configuration', async () => {
    const { consoleError, cleanup } = setupErrorTest();
    
    const invalidSpace: ISpace = {
      id: 'invalid-space',
      name: '', // Nom vide pour rendre l'espace invalide
      state: {}
    };
    
    resetKarmycStore();
    
    await act(async () => {
      render(
        <TestComponent
          options={{
            initialAreas: [
              { type: 'test-area', role: 'LEAD', id: 'test-area-1', state: {} }
            ],
            spaces: {
              'invalid-space': invalidSpace
            }
          }}
        />
      );
    });

    await waitForInitialization();

    await waitFor(() => {
      const state = useKarmycStore.getState();
      const areas = state.screens[state.activeScreenId]?.areas.areas;
      expect(Object.keys(areas || {}).length).toBe(0); // Aucune aire ne devrait être ajoutée
    }, { timeout: 1000 });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[KarmycInitializer] Invalid area config'),
      expect.any(Error)
    );
    
    cleanup();
  }, 10000);
}); 
