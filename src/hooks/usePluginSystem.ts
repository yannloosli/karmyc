import { useEffect, useState } from 'react';
import { type StateCreator, type StoreApi } from 'zustand';
import { actionRegistry } from '../actions/handlers/actionRegistry';
import { Action, IActionPlugin } from '../types/actions';

// Type de fonction pour les plugins Zustand
export type ZustandPlugin<T> = {
    name: string;
    onStoreChange?: (state: T, prevState: T) => void;
    onStoreInit?: (store: StoreApi<T>) => void;
    transformState?: (state: T) => Partial<T>;
    actions?: Record<string, (...args: any[]) => void>;
};

/**
 * Hook to integrate the plugin system with Zustand
 * @param store The Zustand store to extend with plugins
 * @param initialPlugins The plugins to initialize
 */
export function usePluginSystem<T>(
    store: StoreApi<T>,
    initialPlugins: ZustandPlugin<T>[] = []
) {
    const [plugins, setPlugins] = useState<ZustandPlugin<T>[]>(initialPlugins);
    const [registeredActionPlugins, setRegisteredActionPlugins] = useState<IActionPlugin[]>([]);

    // Register plugins on mount and unregister them on unmount
    useEffect(() => {
        // Initializer Zustand plugins
        const unsubscribers: (() => void)[] = [];

        plugins.forEach(plugin => {
            // Initialize plugin with store
            if (plugin.onStoreInit) {
                plugin.onStoreInit(store);
            }

            // Subscribe to store changes for this plugin
            if (plugin.onStoreChange) {
                let previousState = store.getState();
                const unsubscribe = store.subscribe((state) => {
                    if (state !== previousState) {
                        plugin.onStoreChange?.(state, previousState);
                        previousState = state;
                    }
                });
                unsubscribers.push(unsubscribe);
            }
        });

        // Clean up subscriptions on unmount
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [store, plugins]);

    // Handle action plugin registration/unregistration
    useEffect(() => {
        // Convert Zustand plugins to action plugins
        const actionPlugins = plugins
            .filter(plugin => plugin.actions && Object.keys(plugin.actions).length > 0)
            .map(plugin => {
                const actionPlugin: IActionPlugin = {
                    id: plugin.name,
                    priority: 500, // Default medium priority
                    actionTypes: null, // Handle all action types
                    handler: (action: Action) => {
                        // Check if this plugin has an action for this type
                        if (plugin.actions && action.type in plugin.actions) {
                            plugin.actions[action.type](action.payload);
                        }
                    }
                };
                return actionPlugin;
            });

        // Register new action plugins
        actionPlugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
        });
        setRegisteredActionPlugins(actionPlugins);

        // Clean up on unmount
        return () => {
            registeredActionPlugins.forEach(plugin => {
                actionRegistry.unregisterPlugin(plugin.id);
            });
        };
    }, [plugins]);

    // Functions to manage plugins
    const registerPlugin = (plugin: ZustandPlugin<T>) => {
        setPlugins(prev => [...prev, plugin]);
    };

    const unregisterPlugin = (pluginName: string) => {
        setPlugins(prev => prev.filter(p => p.name !== pluginName));
    };

    // Function to transform state using all plugins
    const applyPluginTransformations = (state: T): T => {
        let transformedState = { ...state };

        for (const plugin of plugins) {
            if (plugin.transformState) {
                const changes = plugin.transformState(transformedState);
                transformedState = { ...transformedState, ...changes };
            }
        }

        return transformedState;
    };

    return {
        plugins,
        registerPlugin,
        unregisterPlugin,
        applyPluginTransformations
    };
}

// Type for set in Zustand
type SetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined,
    ...args: any[]
) => void;

/**
 * Creates a Zustand middleware to integrate the plugin system
 */
export const createPluginMiddleware = <T>(plugins: ZustandPlugin<T>[]) => {
    return (config: StateCreator<T>) => (set: SetState<T>, get: () => T, api: StoreApi<T>) => {
        // Initialize plugins with store
        plugins.forEach(plugin => {
            if (plugin.onStoreInit) {
                plugin.onStoreInit(api);
            }
        });

        // Apply plugin transformations on state changes
        // Appliquer les transformations des plugins sur les changements d'état
        const pluginsSet: SetState<T> = (updater: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean, ...args: any[]) => {
            const applyUpdate = (state: T) => {
                let newState = typeof updater === 'function'
                    ? (updater as Function)(state)
                    : updater;

                // Appliquer les transformations des plugins
                for (const plugin of plugins) {
                    if (plugin.transformState) {
                        const changes = plugin.transformState(newState as T);
                        newState = { ...newState, ...changes };
                    }
                }

                return newState;
            };

            const prevState = get();

            // Mettre à jour l'état
            set(applyUpdate as any, replace, ...args);

            // Notifier les plugins du changement
            const currentState = get();
            plugins.forEach(plugin => {
                if (plugin.onStoreChange) {
                    plugin.onStoreChange(currentState, prevState);
                }
            });
        };

        return config(pluginsSet, get, api);
    };
};

export default usePluginSystem; 
