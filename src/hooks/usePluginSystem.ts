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
 * Hook pour intégrer le système de plugins avec Zustand
 * 
 * @param store Le store Zustand à étendre avec les plugins
 * @param initialPlugins Les plugins à initialiser
 */
export function usePluginSystem<T>(
    store: StoreApi<T>,
    initialPlugins: ZustandPlugin<T>[] = []
) {
    const [plugins, setPlugins] = useState<ZustandPlugin<T>[]>(initialPlugins);
    const [registeredActionPlugins, setRegisteredActionPlugins] = useState<IActionPlugin[]>([]);

    // Enregistre les plugins au montage et les désenregistre au démontage
    useEffect(() => {
        // Initialiser les plugins Zustand
        const unsubscribers: (() => void)[] = [];

        plugins.forEach(plugin => {
            // Initialiser le plugin avec le store
            if (plugin.onStoreInit) {
                plugin.onStoreInit(store);
            }

            // S'abonner aux changements du store pour ce plugin
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

        // Nettoyer les abonnements au démontage
        return () => {
            unsubscribers.forEach(unsubscribe => unsubscribe());
        };
    }, [store, plugins]);

    // Gère l'enregistrement/désenregistrement des plugins d'action
    useEffect(() => {
        // Convertir les plugins Zustand en plugins d'action
        const actionPlugins = plugins
            .filter(plugin => plugin.actions && Object.keys(plugin.actions).length > 0)
            .map(plugin => {
                const actionPlugin: IActionPlugin = {
                    id: plugin.name,
                    priority: 500, // Priorité moyenne par défaut
                    actionTypes: null, // Gérer tous les types d'actions
                    handler: (action: Action) => {
                        // Vérifier si ce plugin a une action pour ce type
                        if (plugin.actions && action.type in plugin.actions) {
                            plugin.actions[action.type](action.payload);
                        }
                    }
                };
                return actionPlugin;
            });

        // Enregistrer les nouveaux plugins d'action
        actionPlugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
        });
        setRegisteredActionPlugins(actionPlugins);

        // Nettoyer lors du démontage
        return () => {
            registeredActionPlugins.forEach(plugin => {
                actionRegistry.unregisterPlugin(plugin.id);
            });
        };
    }, [plugins]);

    // Fonctions pour gérer les plugins
    const registerPlugin = (plugin: ZustandPlugin<T>) => {
        setPlugins(prev => [...prev, plugin]);
    };

    const unregisterPlugin = (pluginName: string) => {
        setPlugins(prev => prev.filter(p => p.name !== pluginName));
    };

    // Fonction pour transformer l'état en utilisant tous les plugins
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

// Type pour set dans Zustand
type SetState<T> = (
    partial: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean | undefined,
    ...args: any[]
) => void;

/**
 * Crée un middleware Zustand pour intégrer le système de plugins
 */
export const createPluginMiddleware = <T>(plugins: ZustandPlugin<T>[]) => {
    return (config: StateCreator<T>) => (set: SetState<T>, get: () => T, api: StoreApi<T>) => {
        // Initialiser les plugins avec le store
        plugins.forEach(plugin => {
            if (plugin.onStoreInit) {
                plugin.onStoreInit(api);
            }
        });

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
