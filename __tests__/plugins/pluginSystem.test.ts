import { useKarmycStore } from '../../src/store/areaStore';
import { usePluginSystem } from '../../src/hooks/usePluginSystem';
import { ZustandPlugin } from '../../src/hooks/usePluginSystem';
import { IActionPlugin } from '../../src/types/actions';

describe('Plugin System', () => {
  beforeEach(() => {
    useKarmycStore.setState({
      screens: {
        main: {
          areas: {
            _id: 0,
            rootId: null,
            errors: [],
            activeAreaId: null,
            joinPreview: null,
            layout: {},
            areas: {},
            viewports: {},
            areaToOpen: null,
            lastSplitResultData: null,
            lastLeadAreaId: null
          }
        }
      },
      activeScreenId: 'main',
      options: {
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        validators: [],
        plugins: []
      }
    });
  });

  it('should register a plugin', () => {
    const { registerPlugin } = usePluginSystem(useKarmycStore);
    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };
    registerPlugin(plugin);
    const state = useKarmycStore.getState();
    const expectedPlugin: IActionPlugin = {
      id: plugin.name,
      actionTypes: ['TEST_ACTION'],
      priority: 500,
      handler: expect.any(Function)
    };
    expect(state.options.plugins).toContainEqual(expectedPlugin);
  });

  it('should unregister a plugin', () => {
    const { registerPlugin, unregisterPlugin } = usePluginSystem(useKarmycStore);
    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };
    registerPlugin(plugin);
    unregisterPlugin('test-plugin');
    const state = useKarmycStore.getState();
    const expectedPlugin: IActionPlugin = {
      id: plugin.name,
      actionTypes: ['TEST_ACTION'],
      priority: 500,
      handler: expect.any(Function)
    };
    expect(state.options.plugins).not.toContainEqual(expectedPlugin);
  });

  it('should execute plugin action', async () => {
    const { registerPlugin } = usePluginSystem(useKarmycStore);
    const handler = jest.fn();
    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: handler
      }
    };
    registerPlugin(plugin);
    
    const action = { type: 'TEST_ACTION', payload: { test: 'data' } };
    const state = useKarmycStore.getState();
    const actionPlugin = state.options.plugins?.find((p: IActionPlugin) => p.id === plugin.name);
    if (actionPlugin) {
      await actionPlugin.handler(action);
    }
    
    expect(handler).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should handle plugin dependencies', () => {
    const { registerPlugin } = usePluginSystem(useKarmycStore);
    const plugin1: ZustandPlugin<any> = {
      name: 'plugin-1',
      actions: {
        ACTION_1: jest.fn()
      }
    };
    const plugin2: ZustandPlugin<any> = {
      name: 'plugin-2',
      actions: {
        ACTION_2: jest.fn()
      }
    };
    registerPlugin(plugin1);
    registerPlugin(plugin2);
    const state = useKarmycStore.getState();
    const expectedPlugin: IActionPlugin = {
      id: plugin2.name,
      actionTypes: ['ACTION_2'],
      priority: 500,
      handler: expect.any(Function)
    };
    expect(state.options.plugins).toContainEqual(expectedPlugin);
  });

  it('should handle plugin conflicts', () => {
    const { registerPlugin } = usePluginSystem(useKarmycStore);
    const plugin1: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };
    const plugin2: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };
    registerPlugin(plugin1);
    expect(() => registerPlugin(plugin2)).toThrow();
  });
}); 
