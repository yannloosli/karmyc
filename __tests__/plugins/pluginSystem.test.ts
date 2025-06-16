import { renderHook, act } from '@testing-library/react';
import { useKarmycStore } from '../../src/core/store';
import { usePluginSystem } from '../../src/hooks/usePluginSystem';
import { ZustandPlugin } from '../../src/hooks/usePluginSystem';
import { TestWrapper } from '../utils/TestWrapper';
import { actionRegistry } from '../../src/core/registries/actionRegistry';

describe('Plugin System', () => {
  beforeEach(() => {
    // Reset action registry
    actionRegistry['plugins'] = new Map();
  });

  it('should register a plugin', async () => {
    const { result } = renderHook(() => usePluginSystem(useKarmycStore), {
      wrapper: TestWrapper
    });

    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };

    await act(async () => {
      result.current.registerPlugin(plugin);
    });

    const action = { type: 'TEST_ACTION', payload: { test: 'data' } };
    await act(async () => {
      actionRegistry.handleAction(action);
    });

    expect(plugin.actions?.TEST_ACTION).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should unregister a plugin', async () => {
    const { result } = renderHook(() => usePluginSystem(useKarmycStore), {
      wrapper: TestWrapper
    });

    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: jest.fn()
      }
    };

    await act(async () => {
      result.current.registerPlugin(plugin);
      result.current.unregisterPlugin('test-plugin');
    });

    const action = { type: 'TEST_ACTION', payload: { test: 'data' } };
    await act(async () => {
      actionRegistry.handleAction(action);
    });

    expect(plugin.actions?.TEST_ACTION).not.toHaveBeenCalled();
  });

  it('should execute plugin action', async () => {
    const { result } = renderHook(() => usePluginSystem(useKarmycStore), {
      wrapper: TestWrapper
    });

    const handler = jest.fn();
    const plugin: ZustandPlugin<any> = {
      name: 'test-plugin',
      actions: {
        TEST_ACTION: handler
      }
    };

    await act(async () => {
      result.current.registerPlugin(plugin);
    });
    
    const action = { type: 'TEST_ACTION', payload: { test: 'data' } };
    await act(async () => {
      actionRegistry.handleAction(action);
    });

    expect(handler).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should handle plugin dependencies', async () => {
    const { result } = renderHook(() => usePluginSystem(useKarmycStore), {
      wrapper: TestWrapper
    });

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

    await act(async () => {
      result.current.registerPlugin(plugin1);
      result.current.registerPlugin(plugin2);
    });
    
    const action1 = { type: 'ACTION_1', payload: { test: 'data' } };
    const action2 = { type: 'ACTION_2', payload: { test: 'data' } };
    
    await act(async () => {
      actionRegistry.handleAction(action1);
      actionRegistry.handleAction(action2);
    });
    
    expect(plugin1.actions?.ACTION_1).toHaveBeenCalledWith({ test: 'data' });
    expect(plugin2.actions?.ACTION_2).toHaveBeenCalledWith({ test: 'data' });
  });

  it('should handle plugin conflicts', async () => {
    const { result } = renderHook(() => usePluginSystem(useKarmycStore), {
      wrapper: TestWrapper
    });

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

    await act(async () => {
      result.current.registerPlugin(plugin1);
    });

    let error: Error | undefined;
    try {
      await act(async () => {
        result.current.registerPlugin(plugin2);
      });
    } catch (e) {
      error = e as Error;
    }

    expect(error).toBeDefined();
    expect(error?.message).toBe('Plugin with name "test-plugin" already exists');
  });
}); 
