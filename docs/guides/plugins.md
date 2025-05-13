# Plugins System (Zustand Integration)

This guide explains how to work with the Karmyc plugin system, which is now integrated with Zustand stores and the action registry.

## Overview

The plugin system in Karmyc allows extending core functionality. With the migration to Zustand, plugins can now interact with Zustand stores directly or continue to hook into the action registry for specific action types.

Plugins can:

- React to state changes in specific Zustand stores.
- Transform state before it's updated in a store.
- Add custom actions and handlers integrated with the action registry.
- Implement cross-cutting concerns like logging, analytics, performance monitoring, etc.

## Using Plugins

Plugins are typically integrated in two main ways:

1.  **Store-Specific Plugins (via Middleware):** When creating a Zustand store, you can pass plugins directly to the `createPluginMiddleware`.
2.  **Global/Dynamic Plugins (via Hook):** The `usePluginSystem` hook allows managing plugins dynamically within a component or context.

```tsx
// 1. Example: Using createPluginMiddleware during store creation
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createPluginMiddleware, ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';

interface MyStoreState { value: number; }

const loggingPlugin: ZustandPlugin<MyStoreState> = {
  name: 'store-logger',
  onStoreChange: (newState, prevState) => {
    console.log('Store changed:', prevState, '->', newState);
  }
};

export const useMyStore = create<MyStoreState>()(
  createPluginMiddleware([loggingPlugin])(
    immer((set) => ({
      value: 0,
      increment: () => set(state => { state.value += 1; }),
    }))
  )
);

// 2. Example: Using usePluginSystem hook in a component
import React, { useEffect } from 'react';
import { usePluginSystem, ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore'; // Example store

const analyticsPlugin: ZustandPlugin<any> = {
  name: 'area-analytics',
  onStoreChange: (state, prevState) => {
    if (state.activeAreaId !== prevState.activeAreaId) {
      console.log(`Analytics: Area changed to ${state.activeAreaId}`);
      // window.analyticsService.trackEvent('area_change', { areaId: state.activeAreaId });
    }
  },
};

function PluginManagerComponent() {
  const areaStore = useAreaStore.getStore(); // Get the store API instance
  const { registerPlugin, unregisterPlugin } = usePluginSystem(areaStore);

  useEffect(() => {
    console.log('Registering analytics plugin');
    registerPlugin(analyticsPlugin);

    return () => {
      console.log('Unregistering analytics plugin');
      unregisterPlugin(analyticsPlugin.name);
    };
  }, [registerPlugin, unregisterPlugin]);

  return null; // This component only manages the plugin lifecycle
}
```

## The Plugin Structure (ZustandPlugin)

A Zustand-integrated plugin is defined by the `ZustandPlugin<T>` type, where `T` is the type of the store's state:

```typescript
export type ZustandPlugin<T> = {
    name: string; // Unique name for the plugin
    onStoreInit?: (store: StoreApi<T>) => void; // Called when the plugin is initialized with the store
    onStoreChange?: (state: T, prevState: T) => void; // Called after the store state has changed
    transformState?: (state: T) => Partial<T>; // Allows modifying state before it's set
    actions?: Record<string, (...args: any[]) => void>; // Defines actions that can be registered with the actionRegistry
};
```

## Creating Custom Plugins

Here's how you can create different types of custom plugins:

### 1. State Change Listener Plugin

```typescript
import { ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';
import { AreaState } from '@gamesberry/karmyc-core/stores/areaStore'; // Adjust path/type as needed

const areaLoggerPlugin: ZustandPlugin<AreaState> = {
  name: 'area-change-logger',
  onStoreChange: (newState, prevState) => {
    if (newState.layout !== prevState.layout) {
      console.log('Layout changed:', newState.layout);
    }
    if (newState.activeAreaId !== prevState.activeAreaId) {
        console.log(`Active area changed from ${prevState.activeAreaId} to ${newState.activeAreaId}`);
    }
  },
};

export default areaLoggerPlugin;
```

### 2. State Transformation Plugin

```typescript
import { ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';

interface SettingsState { theme: string; fontSize: number; }

const settingsValidationPlugin: ZustandPlugin<SettingsState> = {
  name: 'settings-validator',
  transformState: (state) => {
    let changes: Partial<SettingsState> = {};
    // Ensure font size is within bounds
    if (state.fontSize < 8) changes.fontSize = 8;
    if (state.fontSize > 24) changes.fontSize = 24;
    return changes;
  },
};

export default settingsValidationPlugin;
```

### 3. Action Plugin (Integrating with Action Registry)

If a plugin defines `actions`, the `usePluginSystem` hook will automatically convert it into an `IActionPlugin` and register it with the `actionRegistry`. This allows these plugins to handle specific dispatched actions.

```typescript
import { ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';
import { Action, ActionPriority } from '@gamesberry/karmyc-core/types/actions';

// Assume MyStoreState exists
const customActionPlugin: ZustandPlugin<MyStoreState> = {
  name: 'custom-action-handler',
  // This plugin doesn't need to react to store changes directly
  // It integrates via the action registry
  actions: {
    'CUSTOM_ACTION': (payload: { message: string }) => {
      console.log(`Custom action handled by plugin: ${payload.message}`);
      // Potentially interact with stores or services here
    },
    'OTHER_ACTION': (payload: any) => {
      console.log('Other action handled by plugin');
    }
  }
};

// When usePluginSystem manages this plugin, it will effectively register:
// actionRegistry.registerPlugin({
//   id: 'custom-action-handler',
//   priority: 500, // Default priority
//   actionTypes: null, // Handles actions based on the keys in 'actions'
//   handler: (action: Action) => {
//     if (action.type === 'CUSTOM_ACTION') {
//       customActionPlugin.actions['CUSTOM_ACTION'](action.payload);
//     }
//     if (action.type === 'OTHER_ACTION') {
//       customActionPlugin.actions['OTHER_ACTION'](action.payload);
//     }
//   }
// });

export default customActionPlugin;
```

## Dynamic Plugin Management with `usePluginSystem`

The `usePluginSystem` hook provides functions to dynamically add or remove plugins associated with a specific store instance.

```typescript
import React, { useState, useEffect } from 'react';
import { usePluginSystem, ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';

const myDynamicPlugin: ZustandPlugin<any> = { /* ... plugin definition ... */ };

function DynamicPluginController() {
  const [isEnabled, setIsEnabled] = useState(false);
  const areaStoreApi = useAreaStore.getStore();
  const { registerPlugin, unregisterPlugin, plugins } = usePluginSystem(areaStoreApi);

  useEffect(() => {
    const pluginExists = plugins.some(p => p.name === myDynamicPlugin.name);

    if (isEnabled && !pluginExists) {
      console.log('Registering dynamic plugin');
      registerPlugin(myDynamicPlugin);
    } else if (!isEnabled && pluginExists) {
      console.log('Unregistering dynamic plugin');
      unregisterPlugin(myDynamicPlugin.name);
    }
  }, [isEnabled, registerPlugin, unregisterPlugin, plugins]);

  return (
    <button onClick={() => setIsEnabled(!isEnabled)}>
      {isEnabled ? 'Disable' : 'Enable'} Dynamic Plugin
    </button>
  );
}
```

## Action Plugin Priorities

For plugins that integrate with the `actionRegistry` (by defining the `actions` property), the concept of priority still applies as defined in `ActionPriority` enum (`packages/karmyc-core/src/types/actions.ts`). When `usePluginSystem` registers these plugins with the `actionRegistry`, it uses a default priority (`NORMAL` = 500). If specific priorities are needed for these action handlers, you might need to register them directly with `actionRegistry` using the `IActionPlugin` interface instead of relying on the automatic conversion by `usePluginSystem`.

```typescript
// From packages/karmyc-core/src/types/actions.ts
export enum ActionPriority {
  CRITICAL = 1000,  // Critical actions (security, validation)
  HIGH = 800,       // Important actions (history, logging)
  NORMAL = 500,     // Standard actions
  LOW = 200,        // Low priority actions (analytics, etc.)
  BACKGROUND = 100  // Background actions
}
```

## Example: Area Usage Tracker (Zustand Version)

Here's how the previous area usage tracker example might be adapted for Zustand:

```typescript
import { ZustandPlugin } from '@gamesberry/karmyc-core/hooks/usePluginSystem';
import { useAreaStore } from '@gamesberry/karmyc-core/stores/areaStore';

// Define the state type for the store this plugin targets
interface AreaState {
    activeAreaId: string | null;
    // ... other area state properties
}

const areaUsagePlugin: ZustandPlugin<AreaState> = {
    name: 'zustand-area-usage-tracker',
    _areaUsage: new Map<string, number>(),
    _activeAreaId: null as string | null,
    _lastAreaActivationTime: null as number | null,

    onStoreInit: (store) => {
        console.log('Area usage tracker initialized with store');
        // Initialize state from the store if needed
        const initialState = store.getState();
        areaUsagePlugin._activeAreaId = initialState.activeAreaId;
        areaUsagePlugin._lastAreaActivationTime = initialState.activeAreaId ? Date.now() : null;

        // Expose stats globally (consider a better approach for real apps)
        (window as any).getAreaUsageStats = () => {
            const stats: Record<string, { timeSpentMs: number; timeSpentMinutes: number }> = {};
            areaUsagePlugin._areaUsage.forEach((timeSpent, areaId) => {
                stats[areaId] = {
                    timeSpentMs: timeSpent,
                    timeSpentMinutes: Math.round(timeSpent / 60000 * 10) / 10
                };
            });
            // Include current area if active
            if (areaUsagePlugin._activeAreaId && areaUsagePlugin._lastAreaActivationTime) {
                 const currentDuration = Date.now() - areaUsagePlugin._lastAreaActivationTime;
                 const totalTime = (stats[areaUsagePlugin._activeAreaId]?.timeSpentMs || 0) + currentDuration;
                 stats[areaUsagePlugin._activeAreaId] = {
                     timeSpentMs: totalTime,
                     timeSpentMinutes: Math.round(totalTime / 60000 * 10) / 10
                 };
            }
            return stats;
        };
    },

    onStoreChange: (newState, prevState) => {
        if (newState.activeAreaId !== prevState.activeAreaId) {
            const previousAreaId = prevState.activeAreaId;
            const newAreaId = newState.activeAreaId;

            // Record time spent in previous area
            if (previousAreaId && areaUsagePlugin._lastAreaActivationTime) {
                const timeSpent = Date.now() - areaUsagePlugin._lastAreaActivationTime;
                const currentTotal = areaUsagePlugin._areaUsage.get(previousAreaId) || 0;
                areaUsagePlugin._areaUsage.set(previousAreaId, currentTotal + timeSpent);
                console.log(`Recorded ${timeSpent}ms for area ${previousAreaId}`);
            }

            // Update active area and activation time
            areaUsagePlugin._activeAreaId = newAreaId;
            areaUsagePlugin._lastAreaActivationTime = newAreaId ? Date.now() : null;
            console.log(`Area activated: ${newAreaId}`);
        }
    },

    // No onUnregister needed for window property in this simple example,
    // but real plugins should clean up side effects.
};

export default areaUsagePlugin;

// To use this plugin:
// 1. Pass it to createPluginMiddleware when creating useAreaStore
// OR
// 2. Use usePluginSystem(useAreaStore.getStore()) and registerPlugin(areaUsagePlugin)
```

## Best Practices

1. **Use unique IDs**: Ensure your plugin IDs don't conflict with built-in plugins
2. **Set appropriate priorities**: Consider when your plugin should run relative to others
3. **Clean up resources**: Always implement `onUnregister` to clean up any resources
4. **Be performance-conscious**: Avoid heavy processing in action handlers
5. **Follow immutability patterns**: Don't mutate state or action objects directly 
