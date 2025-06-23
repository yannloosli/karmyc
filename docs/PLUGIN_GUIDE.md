# Complete Guide: Using usePluginSystem with SpaceStore

## 🎯 Overview

This comprehensive guide shows you how to use the `usePluginSystem` hook to add custom properties and actions to the `spaceStore` without modifying the original source code. The plugin system allows you to extend the store's functionality in a modular and reusable way.

## 📋 Prerequisites

- Basic knowledge of TypeScript and React
- Understanding of Zustand store system
- Access to Karmyc Core project files

## 🚀 Quick Start

### 1. Create a Simple Plugin

```typescript
import { ZustandPlugin } from '../hooks/usePluginSystem';
import { useSpaceStore, SpaceStateType } from '../core/spaceStore';

const myPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'my-plugin',
    
    // Initialization (called once at startup)
    onStoreInit: (store) => {
        console.log('My plugin initialized');
        // Add default properties to existing spaces
    },
    
    // Custom actions
    actions: {
        'MY_ACTION': (payload: any) => {
            // Your action logic
            console.log('Action executed:', payload);
        }
    }
};
```

### 2. Use the Plugin in a Component

```typescript
import { usePluginSystem } from '../hooks/usePluginSystem';
import { useSpaceStore } from '../core/spaceStore';

function MyComponent() {
    const spaceStore = useSpaceStore;
    
    // Initialize the plugin
    const pluginSystem = usePluginSystem(spaceStore, [myPlugin]);
    
    // Use the store normally
    const spaces = spaceStore.getState().spaces;
    
    return (
        <div>
            <h2>My component with plugin</h2>
            {/* Your user interface */}
        </div>
    );
}
```

## 🔧 Plugin Structure

A plugin is an object that implements the `ZustandPlugin<T>` interface:

```typescript
export type ZustandPlugin<T> = {
    name: string;                                    // Unique plugin name
    onStoreChange?: (state: T, prevState: T) => void; // Called on every state change
    onStoreInit?: (store: StoreApi<T>) => void;      // Called at initialization
    transformState?: (state: T) => Partial<T>;       // Transforms the state
    actions?: Record<string, (...args: any[]) => void>; // Custom actions
};
```

## 📝 Concrete Examples

### Example 1: View Counter Plugin

```typescript
const spaceViewCounterPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-view-counter',
    
    onStoreInit: (store) => {
        // Add view counter to all spaces
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
        Object.keys(updatedSpaces).forEach(spaceId => {
            const space = updatedSpaces[spaceId];
            if (!space.sharedState.payload) {
                space.sharedState.payload = { viewCount: 0 };
            }
        });
        
        store.setState({ spaces: updatedSpaces });
    },
    
    actions: {
        'INCREMENT_VIEW_COUNT': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const payload = space.sharedState.payload as any;
                payload.viewCount = (payload.viewCount || 0) + 1;
                useSpaceStore.setState({ spaces: { ...store.spaces } });
            }
        }
    }
};
```

### Example 2: Tags System Plugin

```typescript
const spaceTagsPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-tags',
    
    onStoreInit: (store) => {
        // Initialize tags for existing spaces
        const state = store.getState();
        const updatedSpaces = { ...state.spaces };
        
        Object.keys(updatedSpaces).forEach(spaceId => {
            const space = updatedSpaces[spaceId];
            if (!space.sharedState.payload) {
                space.sharedState.payload = { tags: [] };
            }
        });
        
        store.setState({ spaces: updatedSpaces });
    },
    
    actions: {
        'ADD_SPACE_TAG': (payload: { spaceId: string; tag: string; color?: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                const tags = spacePayload.tags || [];
                spacePayload.tags = [...tags, { name: payload.tag, color: payload.color }];
                useSpaceStore.setState({ spaces: { ...store.spaces } });
            }
        },
        'REMOVE_SPACE_TAG': (payload: { spaceId: string; tagName: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const spacePayload = space.sharedState.payload as any;
                const tags = spacePayload.tags || [];
                spacePayload.tags = tags.filter((t: any) => t.name !== payload.tagName);
                useSpaceStore.setState({ spaces: { ...store.spaces } });
            }
        }
    }
};
```

### Example 3: Statistics Plugin

```typescript
const spaceStatsPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'space-stats',
    
    onStoreInit: (store) => {
        console.log('Statistics plugin initialized');
        // Add default properties to existing spaces
    },
    
    onStoreChange: (newState, prevState) => {
        // Increment modification counter
        Object.keys(newState.spaces).forEach(spaceId => {
            const newSpace = newState.spaces[spaceId];
            const prevSpace = prevState.spaces[spaceId];
            
            if (newSpace !== prevSpace) {
                const payload = newSpace.sharedState.payload as any;
                payload.modificationCount = (payload.modificationCount || 0) + 1;
            }
        });
    },
    
    actions: {
        'RESET_SPACE_STATS': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const payload = space.sharedState.payload as any;
                payload.modificationCount = 0;
                useSpaceStore.setState({ spaces: { ...store.spaces } });
            }
        },
        'GET_SPACE_STATS': (payload: { spaceId: string }) => {
            const store = useSpaceStore.getState();
            const space = store.spaces[payload.spaceId];
            
            if (space) {
                const payload = space.sharedState.payload as any;
                return {
                    modificationCount: payload.modificationCount || 0,
                    viewCount: payload.viewCount || 0
                };
            }
        }
    }
};
```

## 🎨 Advanced Usage

### Custom Hook

```typescript
export function useSpaceStoreWithPlugins() {
    const spaceStore = useSpaceStore;
    
    // Combine multiple plugins
    const pluginSystem = usePluginSystem(spaceStore, [
        spaceViewCounterPlugin,
        spaceTagsPlugin,
        spaceStatsPlugin
    ]);
    
    // Utility functions
    const customActions = {
        incrementView: (spaceId: string) => {
            pluginSystem.dispatch('INCREMENT_VIEW_COUNT', { spaceId });
        },
        addTag: (spaceId: string, tag: string, color?: string) => {
            pluginSystem.dispatch('ADD_SPACE_TAG', { spaceId, tag, color });
        },
        resetStats: (spaceId: string) => {
            pluginSystem.dispatch('RESET_SPACE_STATS', { spaceId });
        }
    };
    
    return {
        ...spaceStore.getState(),
        ...customActions,
        pluginSystem
    };
}
```

### React Component

```typescript
export function SpaceManagerWithPlugins() {
    const { 
        spaces, 
        addSpace, 
        addTag, 
        incrementView,
        resetStats,
        pluginSystem 
    } = useSpaceStoreWithPlugins();
    
    const handleCreateSpace = () => {
        const spaceId = addSpace({ 
            name: 'New space with plugins',
            description: 'Space with statistics and tags'
        });
        
        if (spaceId) {
            // Use plugin actions
            addTag(spaceId, 'important', '#ff0000');
            incrementView(spaceId);
        }
    };
    
    return (
        <div>
            <button onClick={handleCreateSpace}>
                Create space with plugins
            </button>
            
            <div>
                {Object.entries(spaces).map(([id, space]) => {
                    const payload = space.sharedState.payload as any;
                    return (
                        <div key={id}>
                            <h3>{space.name}</h3>
                            <p>Views: {payload?.viewCount || 0}</p>
                            <p>Modifications: {payload?.modificationCount || 0}</p>
                            <p>Tags: {payload?.tags?.map((t: any) => t.name).join(', ') || 'None'}</p>
                            <button onClick={() => resetStats(id)}>Reset Stats</button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
```

### State Change Listening

```typescript
const myPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'my-plugin',
    
    // Called on every state change
    onStoreChange: (newState, prevState) => {
        // Compare states and react to changes
        Object.keys(newState.spaces).forEach(spaceId => {
            const newSpace = newState.spaces[spaceId];
            const prevSpace = prevState.spaces[spaceId];
            
            if (newSpace !== prevSpace) {
                console.log(`Space ${spaceId} modified`);
            }
        });
    }
};
```

### State Transformation

```typescript
const myPlugin: ZustandPlugin<SpaceStateType> = {
    name: 'my-plugin',
    
    // Transform state before use
    transformState: (state) => {
        const transformedSpaces = { ...state.spaces };
        
        Object.keys(transformedSpaces).forEach(spaceId => {
            const space = transformedSpaces[spaceId];
            // Add computed properties
            space.sharedState.payload = {
                ...space.sharedState.payload,
                computedProperty: 'computed value'
            };
        });
        
        return { spaces: transformedSpaces };
    }
};
```

## 🔗 Integration with Action System

Plugins can also integrate with the global action system:

```typescript
import { actionRegistry } from '../core/registries/actionRegistry';

// Register an action plugin
const actionPlugin: IActionPlugin = {
    id: 'space-stats-actions',
    priority: 500,
    actionTypes: ['RESET_SPACE_STATS', 'GET_SPACE_STATS'],
    handler: (action: Action) => {
        // Handle actions
    }
};

actionRegistry.registerPlugin(actionPlugin);
```

## 📋 Best Practices

### 1. Naming
- Use descriptive and unique names for your plugins
- Prefix with functional domain (e.g., `space-stats`, `space-tags`)

### 2. Type Management
- Use `as any` for custom properties in `sharedState.payload`
- Define TypeScript interfaces for your custom data

### 3. Performance
- Avoid expensive calculations in `onStoreChange`
- Use `transformState` for light transformations

### 4. Error Handling
- Validate data in your actions
- Handle cases where custom properties don't exist

### 5. Persistence
- Properties added via `sharedState.payload` are automatically persisted
- Avoid storing sensitive data in state

## 🔍 Troubleshooting

### Common Issues

1. **Plugin not initialized**
   ```typescript
   // Check that the plugin is properly passed to the hook
   const pluginSystem = usePluginSystem(spaceStore, [myPlugin]);
   ```

2. **Actions not triggered**
   ```typescript
   // Ensure action types match
   actions: {
       'MY_ACTION': (payload) => { /* ... */ }
   }
   ```

3. **Missing properties**
   ```typescript
   // Check initialization in onStoreInit
   onStoreInit: (store) => {
       // Initialize default properties
   }
   ```

4. **Type errors**
   ```typescript
   // Use as any for custom properties
   const payload = space.sharedState.payload as any;
   ```

### Debug

```typescript
// Enable debug logs
const pluginSystem = usePluginSystem(spaceStore, plugins);
console.log('Active plugins:', pluginSystem.plugins);

// Check state
console.log('Current state:', spaceStore.getState());
```

## 📚 Resources

- **Example files**: `spaceStorePluginExample.tsx` and `simpleSpacePlugin.ts`
- **Source code**: `usePluginSystem.ts`
- **Store implementation**: `spaceStore.ts`

## 🎉 Conclusion

The plugin system allows you to easily extend the `spaceStore` with custom functionality while keeping the code modular and reusable. Start with simple plugins and evolve toward more complex features based on your needs.

The system provides a powerful way to add features without modifying core code, making your application more maintainable and extensible. 
