import { render, act, waitFor } from '@testing-library/react';
import { useKarmyc } from '../../src/hooks/useKarmyc';
import { useKarmycStore } from '../../src/store/areaStore';
import { AreaRole } from '../../src/types/area';
import { actionRegistry } from '../../src/actions/handlers/actionRegistry';
import { TestWrapper } from '../utils/TestWrapper';
import type { RootState } from '../../src/store/areaStore';

// Composant de test pour wrapper le hook
const TestComponent = ({ options }: { options: any }) => {
  const result = useKarmyc(options);
  return <div data-testid="test-component">{JSON.stringify(result)}</div>;
};

describe('useKarmyc', () => {
  beforeEach(async () => {
    // Reset stores and registries before each test
    await act(async () => {
      useKarmycStore.setState({
        screens: {},
        activeScreenId: 'main',
        options: {
          keyboardShortcutsEnabled: true,
          builtInLayouts: [],
          validators: []
        }
      });
    });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result).toBeDefined();
      expect(result.initialAreas).toEqual([]);
      expect(result.keyboardShortcutsEnabled).toBe(true);
    }, { timeout: 1000 });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialAreas).toEqual(options.initialAreas);
      expect(result.keyboardShortcutsEnabled).toBe(false);
    }, { timeout: 1000 });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialAreas?.[0].role).toBe('LEAD');
    }, { timeout: 1000 });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.builtInLayouts).toEqual(options.builtInLayouts);
      expect(result.options.builtInLayouts).toEqual(options.builtInLayouts);
    }, { timeout: 1000 });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.initialLayout).toBe('test-layout');
    }, { timeout: 1000 });
  });

  it('should handle validators', async () => {
    const validator = {
      actionType: 'test-action',
      validator: (action: any) => ({ valid: true })
    };

    const options = {
      validators: [validator]
    };

    const { getByTestId } = render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.validators[0]).toEqual({
        actionType: validator.actionType
      });
    }, { timeout: 1000 });
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
    
    await waitFor(() => {
      const result = JSON.parse(getByTestId('test-component').textContent || '{}');
      expect(result.plugins[0]).toEqual({
        id: plugin.id,
        actionTypes: plugin.actionTypes,
        priority: plugin.priority
      });
    }, { timeout: 1000 });
  });

  it('should handle initialization errors gracefully', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    
    const invalidOptions = {
      plugins: [{ 
        id: 'invalid', 
        actionTypes: [], 
        priority: 1,
        handler: () => ({ success: false })
      }],
      validators: [{ actionType: 'invalid', validator: () => ({ valid: true }) }]
    };

    render(
      <TestWrapper options={invalidOptions}>
        <TestComponent options={invalidOptions} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalled();
    }, { timeout: 1000 });

    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('should update store options correctly', async () => {
    const options = {
      resizableAreas: false,
      manageableAreas: false,
      multiScreen: false
    };

    render(
      <TestWrapper options={options}>
        <TestComponent options={options} />
      </TestWrapper>
    );

    await waitFor(() => {
      const state = useKarmycStore.getState();
      expect(state.options).toEqual({
        ...state.options,
        resizableAreas: false,
        manageableAreas: false,
        multiScreen: false
      });
    }, { timeout: 1000 });
  });

  it('should handle area state updates through store', async () => {
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

    await waitFor(() => {
      const state = useKarmycStore.getState();
      const activeScreenAreas = state.screens['main'].areas;
      expect(activeScreenAreas.areas['area-1']).toBeDefined();
      expect(activeScreenAreas.areas['area-1'].role).toBe('LEAD');
    }, { timeout: 1000 });
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

  it('should handle plugin registration', () => {
    const plugin = {
      id: 'test-plugin',
      actionTypes: ['TEST_ACTION'],
      handler: jest.fn(),
      priority: 1
    };

    const options = {
      plugins: [plugin]
    };

    const { getByTestId } = render(
      <TestWrapper>
        <TestComponent options={options} />
      </TestWrapper>
    );
    
    const result = JSON.parse(getByTestId('test-component').textContent || '{}');
    // Vérifier uniquement les propriétés qui peuvent être sérialisées
    expect(result.plugins[0]).toEqual({
      id: plugin.id,
      actionTypes: plugin.actionTypes,
      priority: plugin.priority
    });
    expect(actionRegistry['plugins'].size).toBe(1);
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
}); 
