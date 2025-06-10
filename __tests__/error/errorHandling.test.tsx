import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { KarmycProvider } from '../../src/providers/KarmycProvider';
import { AREA_ROLE, AreaTypeValue, AreaRole } from '../../src/types/actions';
import { IArea } from '../../src/types/areaTypes';
import { IKarmycOptions, ISpace, LayoutPreset } from '../../src/types/karmyc';
import { 
  TestComponent, 
  setupErrorTest, 
  resetKarmycStore, 
  waitForInitialization,
  assertErrorLogged 
} from '../__mocks__/errorTestUtils';

// Composant ErrorBoundary pour capturer les erreurs
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error) {
        this.setState({ hasError: true, error });
    }

    render() {
        if (this.state.hasError) {
            return <div data-testid="error-boundary">{this.state.error?.message}</div>;
        }

        return this.props.children;
    }
}

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
      role: AREA_ROLE.LEAD
    };

    const duplicateArea2: IArea<AreaTypeValue> = {
      id: 'duplicate-id',
      type: 'test-area',
      role: AREA_ROLE.FOLLOW
    };

    await act(async () => {
      render(
        <ErrorBoundary>
          <TestComponent
            options={{
              initialAreas: [duplicateArea1, duplicateArea2]
            }}
          />
        </ErrorBoundary>
      );
    });

    await waitFor(() => {
      const errorMessage = screen.getByTestId('error-boundary');
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent('Invalid area type: test-area');
    }, { timeout: 1000 });

    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('[KarmycInitializer] Invalid area config'),
      expect.any(Error)
    );
    
    cleanup();
  });

  it('should handle invalid space configuration', async () => {
    const { consoleError, onError, cleanup } = setupErrorTest();
    
    const invalidSpace: ISpace = {
      id: 'invalid-space',
      name: '', // Nom vide pour rendre l'espace invalide
      state: {}
    };
    
    resetKarmycStore();
    
    await act(async () => {
      render(
        <KarmycProvider
          options={{
            initialAreas: [
              { type: 'test-area', role: 'LEAD' }
            ],
            spaces: {
              'invalid-space': invalidSpace
            }
          }}
          onError={onError}
        >
          <Karmyc />
        </KarmycProvider>
      );
    });

    await waitForInitialization();

    assertErrorLogged(consoleError, '[KarmycInitializer] Error during initialization');
    
    cleanup();
  });
}); 
