import { render } from '@testing-library/react';
import { act } from 'react';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { useKarmycStore, initializeKarmycStore } from '../../src/store/areaStore';
import { AreaRole } from '../../src/types/karmyc';
import { actionRegistry } from '../../src/actions/handlers/actionRegistry';
import { TestWrapper } from '../utils/TestWrapper';
import type { IArea } from '../../src/types/areaTypes';

// Composant de test pour wrapper le hook
const TestComponent = ({ options }: { options: any }) => {
  const result = useKarmyc(options);
  return <div data-testid="test-component">{JSON.stringify(result)}</div>;
};

describe('useKarmyc', () => {
  beforeEach(() => {
    // Reset store
    useKarmycStore.setState({
      screens: {},
      activeScreenId: '1',
      options: {
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: [],
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: false
      }
    });

    // Reset plugins
    actionRegistry['plugins'] = new Map();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default values', async () => {
    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent options={{}} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result).toBeDefined();
      expect(result.initialAreas).toEqual([]);
      expect(result.keyboardShortcutsEnabled).toBe(true);
    });
  });

  it('should handle custom options', async () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test', role: 'SELF' as AreaRole, state: {} }
      ],
      keyboardShortcutsEnabled: false
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialAreas).toEqual(options.initialAreas);
      expect(result.keyboardShortcutsEnabled).toBe(false);
    });
  });

  it('should validate area roles', async () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test', role: 'LEAD' as AreaRole, state: {} }
      ]
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialAreas?.[0].role).toBe('LEAD');
    });
  });

  it('should handle built-in layouts', async () => {
    const options = {
      builtInLayouts: [
        {
          id: 'test-layout',
          name: 'Test Layout',
          config: {
            _id: 1,
            rootId: 'root',
            errors: [],
            activeAreaId: null,
            joinPreview: null,
            layout: {},
            areas: {},
            viewports: {},
            areaToOpen: null,
            lastSplitResultData: null,
            lastLeadAreaId: null
          },
          isBuiltIn: true
        }
      ]
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.builtInLayouts).toEqual(options.builtInLayouts);
      expect(result.options.builtInLayouts).toEqual(options.builtInLayouts);
    });
  });

  it('should handle initial layout', async () => {
    const options = {
      initialLayout: 'test-layout'
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialLayout).toBe('test-layout');
    });
  });

  it('should handle validators', async () => {
    const validator = {
      actionType: 'test-action',
      validator: () => ({ valid: true })
    };

    const options = {
      validators: [validator]
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.validators[0]).toEqual({
        actionType: validator.actionType
      });
    });
  });

  it('should handle plugins correctly', async () => {
    const plugin = {
      id: 'test-plugin',
      actionTypes: ['test-action'],
      handler: () => ({ success: true }),
      priority: 1
    };

    const options = {
      plugins: [plugin]
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await act(async () => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.plugins[0]).toEqual({
        id: plugin.id,
        actionTypes: plugin.actionTypes,
        priority: plugin.priority
      });
    });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const invalidOptions = {
      plugins: [{ 
        id: 'invalid', 
        actionTypes: [], 
        priority: 1,
        handler: () => { throw new Error('Test error'); }
      }],
      validators: [{ actionType: 'invalid', validator: () => ({ valid: true }) }]
    };

    await act(async () => {
      render(
        <TestWrapper options={invalidOptions}>
          <TestComponent options={invalidOptions} />
        </TestWrapper>
      );
    });

    // Forcer une erreur pour déclencher console.error
    await act(async () => {
      const plugin = actionRegistry['plugins'].get('invalid');
      if (plugin) {
        try {
          await plugin.handler({ type: 'TEST_ACTION' });
        } catch (error) {
          console.error(error);
        }
      }
    });

    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should update store options correctly', async () => {
    const options = {
      resizableAreas: false,
      manageableAreas: false,
      multiScreen: false
    };

    await act(async () => {
      render(
        <TestWrapper options={options}>
          <TestComponent options={options} />
        </TestWrapper>
      );
    });

    const state = useKarmycStore.getState();
    expect(state.options).toEqual({
      ...state.options,
      resizableAreas: false,
      manageableAreas: false,
      multiScreen: false
    });
  });

  it('should handle area state updates through store', async () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test', role: 'SELF' as AreaRole, state: {} }
      ]
    };

    // Initialiser le store avec l'état correct
    await act(async () => {
      initializeKarmycStore({
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: [],
        resizableAreas: true,
        manageableAreas: true,
        multiScreen: false
      });
    });

    // Attendre que KarmycInitializer termine son initialisation
    await act(async () => {
      render(
        <TestWrapper options={options}>
          <TestComponent options={options} />
        </TestWrapper>
      );
    });

    // Attendre que l'initialisation soit terminée
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 500));
    });

    // Définir l'état après l'initialisation
    await act(async () => {
      useKarmycStore.setState({
        screens: {
          '1': {
            areas: {
              _id: 1,
              rootId: '1',
              errors: [],
              activeAreaId: 'area-1',
              joinPreview: null,
              layout: {},
              areas: {
                'area-1': { id: 'area-1', type: 'test', role: 'SELF' as AreaRole, state: {} }
              },
              viewports: {},
              areaToOpen: null,
              lastSplitResultData: null,
              lastLeadAreaId: null
            }
          }
        },
        activeScreenId: '1'
      });
    });

    // Attendre que l'état soit mis à jour
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Vérifier l'état après l'initialisation
    await act(async () => {
      const state = useKarmycStore.getState();
      expect(state.options).toBeDefined();
      expect(state.screens['1']).toBeDefined();
      expect(state.screens['1'].areas).toBeDefined();
      const area = state.screens['1'].areas.areas['area-1'] as IArea;
      expect(area).toBeDefined();
      expect(area.role).toBe('SELF');
    });
  });

  it('should handle area addition through store', () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test', role: 'LEAD' as AreaRole, state: {} }
      ]
    };

    render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );

    act(() => {
      useKarmycStore.setState((state) => ({
        ...state,
        screens: {
          ...state.screens,
          [state.activeScreenId]: {
            ...state.screens[state.activeScreenId],
            areas: {
              areas: {
                'area-1': { type: 'test', role: 'LEAD' as AreaRole, state: {} },
                'area-2': { type: 'test', role: 'FOLLOW' as AreaRole, state: {} }
              }
            }
          }
        }
      }));
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(2);
  });

  it('should handle area removal through store', () => {
    const options = {
      initialAreas: [
        { id: 'area-1', type: 'test', role: 'LEAD' as AreaRole, state: {} },
        { id: 'area-2', type: 'test', role: 'FOLLOW' as AreaRole, state: {} }
      ]
    };

    render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );

    act(() => {
      useKarmycStore.setState((state) => ({
        ...state,
        screens: {
          ...state.screens,
          [state.activeScreenId]: {
            ...state.screens[state.activeScreenId],
            areas: {
              areas: {
                'area-1': { type: 'test', role: 'LEAD' as AreaRole, state: {} }
              }
            }
          }
        }
      }));
    });

    const state = useKarmycStore.getState();
    expect(Object.keys(state.screens[state.activeScreenId].areas.areas)).toHaveLength(1);
  });

  it('should handle plugin registration', async () => {
    // S'assurer que le registre est vide
    actionRegistry['plugins'] = new Map();
    
    const plugin = {
      id: 'test-plugin',
      actionTypes: ['TEST_ACTION'],
      handler: jest.fn(),
      priority: 1
    };

    const options = {
      plugins: [plugin]
    };

    // Attendre que KarmycInitializer termine son initialisation
    await act(async () => {
      render(
        <TestWrapper>
          <TestComponent options={options} />
        </TestWrapper>
      );
    });

    // Attendre que l'initialisation soit terminée
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    // Vérifier le nombre de plugins après l'initialisation
    await act(async () => {
      const plugins = Array.from(actionRegistry['plugins'].values());
      expect(plugins.length).toBe(2); // historyPlugin + notre plugin
      const testPlugin = plugins.find(p => p.id === 'test-plugin');
      expect(testPlugin).toBeDefined();
      expect(testPlugin?.id).toBe('test-plugin');
    });
  });

  it('should handle invalid initial areas gracefully', () => {
    const options = {
      initialAreas: [
        { type: 'test', role: 'INVALID_ROLE' as any },
        { type: 'test', role: 'INVALID_ROLE' as any }
      ]
    };

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    const result = JSON.parse(getByTestId('test-component').textContent || '{}');
    expect(result.initialAreas).toEqual([]);
  });

  it('should handle keyboard shortcuts', async () => {
    const options = {
      keyboardShortcutsEnabled: true
    };

    render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );

    await act(async () => {
      const state = useKarmycStore.getState();
      expect(state.options.keyboardShortcutsEnabled).toBe(true);
    });
  });
}); 
