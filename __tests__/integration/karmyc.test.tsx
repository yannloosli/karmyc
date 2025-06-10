import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Karmyc } from '../../src/components/Karmyc';
import { AREA_ROLE } from '../../src/types/actions';
import { AreaRole } from '../../src/types/karmyc';
import { TestWrapper } from '../utils/TestWrapper';
import { useKarmycStore } from '../../src/store/areaStore';
import { useSpaceStore } from '../../src/store/spaceStore';
import { areaRegistry } from '../../src/store/registries/areaRegistry';
import { AreaComponentProps } from '../../src/types/areaTypes';

// Composant de test pour l'aire
const TestAreaComponent: React.FC<AreaComponentProps<any>> = ({ id, state, type, viewport }) => {
  return (
    <div data-testid="test-area-content">
      Test Area Content
      <div data-testid="test-area-id">{id}</div>
      <div data-testid="test-area-type">{type}</div>
      <div data-testid="test-area-state">{JSON.stringify(state)}</div>
      <div data-testid="test-area-viewport">{JSON.stringify(viewport)}</div>
    </div>
  );
};

// Icône par défaut pour les tests
const DefaultIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => {
  return <div style={{ ...style, backgroundColor: '#666' }} />;
};

// Activer les faux timers pour tous les tests
beforeAll(() => {
  jest.useFakeTimers();
  // Enregistrer le composant de test
  areaRegistry.registerComponent('test-area', TestAreaComponent);
  // Enregistrer l'icône par défaut
  areaRegistry.registerIcon('test-area', DefaultIcon);
  // Enregistrer le nom d'affichage
  areaRegistry.registerDisplayName('test-area', 'Test Area');
});

afterAll(() => {
  jest.useRealTimers();
  // Nettoyer l'enregistrement
  areaRegistry.unregisterAreaType('test-area');
});

describe('Karmyc Integration', () => {
  beforeEach(() => {
    // Reset store before each test
    act(() => {
      useKarmycStore.setState({
        screens: {
          main: {
            areas: {
              areas: {
                'area-1': {
                  id: 'area-1',
                  type: 'test-area',
                  role: 'LEAD',
                  state: {}
                },
                'area-2': {
                  id: 'area-2',
                  type: 'test-area',
                  role: 'FOLLOW',
                  state: {}
                }
              },
              layout: {
                'area-1': { type: 'area', id: 'area-1' },
                'area-2': { type: 'area', id: 'area-2' },
                'root': {
                  type: 'area_row',
                  id: 'root',
                  orientation: 'horizontal',
                  areas: [
                    { id: 'area-1', size: 0.5 },
                    { id: 'area-2', size: 0.5 }
                  ]
                }
              },
              rootId: 'root',
              activeAreaId: null,
              isDetached: false,
              _id: 1,
              errors: [],
              joinPreview: null,
              viewports: {
                'area-1': { left: 0, top: 0, width: 120, height: 120 },
                'area-2': { left: 120, top: 0, width: 120, height: 120 }
              },
              lastLeadAreaId: null,
              areaToOpen: null,
              lastSplitResultData: null
            }
          }
        },
        activeScreenId: 'main',
        options: {
          keyboardShortcutsEnabled: true,
          builtInLayouts: [],
          validators: [],
          resizableAreas: true,
          manageableAreas: true,
          multiScreen: false
        }
      });
    });

    // Enregistrer le composant test-area
    areaRegistry.registerComponent('test-area', TestAreaComponent);
    // Enregistrer une icône par défaut
    areaRegistry.registerIcon('test-area', () => <div data-testid="test-area-icon" />);
  });

  afterEach(() => {
    // Nettoyer l'enregistrement
    areaRegistry.unregisterAreaType('test-area');
  });

  it('should handle space switching', () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test-area', role: AREA_ROLE.LEAD as AreaRole, state: {} }
      ]
    };

    // Ajouter un espace initial
    act(() => {
      useSpaceStore.getState().addSpace({ name: 'test-space', sharedState: { color: '#ff0000' } });
    });

    render(
      <TestWrapper options={options}>
        <Karmyc />
      </TestWrapper>
    );

    const spaceButton = screen.getByTestId('space-switch-button');
    
    act(() => {
      fireEvent.click(spaceButton);
    });

    const spaces = useSpaceStore.getState().spaces;
    expect(Object.keys(spaces).length).toBeGreaterThan(0);
  });
}); 
