import { type StateCreator, type StoreApi } from 'zustand';
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
export declare function usePluginSystem<T>(store: StoreApi<T>, initialPlugins?: ZustandPlugin<T>[]): {
    plugins: ZustandPlugin<T>[];
    registerPlugin: (plugin: ZustandPlugin<T>) => void;
    unregisterPlugin: (pluginName: string) => void;
    applyPluginTransformations: (state: T) => T;
};
type SetState<T> = (partial: T | Partial<T> | ((state: T) => T | Partial<T>), replace?: boolean | undefined, ...args: any[]) => void;
/**
 * Creates a Zustand middleware to integrate the plugin system
 */
export declare const createPluginMiddleware: <T>(plugins: ZustandPlugin<T>[]) => (config: StateCreator<T>) => (set: SetState<T>, get: () => T, api: StoreApi<T>) => T;
export default usePluginSystem;
