import { StateCreator, StoreMutatorIdentifier } from 'zustand';
import { performanceMonitor } from '../../actions/plugins/performance';

// Redefine middleware type to potentially accept mutated store API (like from immer)
type PerformanceMiddleware = <
    T,
    Mps extends [StoreMutatorIdentifier, unknown][] = [],
    Mcs extends [StoreMutatorIdentifier, unknown][] = []
>(f: StateCreator<T, Mps, Mcs>, _options?: any)
    => StateCreator<T, Mps, Mcs>;

// Adjust internal implementation type signature if needed, though the main change is below
type PerformanceMiddlewareImpl = <T>(
    config: StateCreator<T, [], [['zustand/immer', never]]> // Add explicit type for config
) => StateCreator<T, [], [['zustand/immer', never]]>; // Output keeps immer signature

// Define the implementation directly with the explicit type for config
const performanceMiddlewareImpl = <T>(
    config: StateCreator<T, [], [['zustand/immer', never]]>
): StateCreator<T, [], [['zustand/immer', never]]> => {
    return (set, get, api) => {
        // Original state definition call
        // Pass the original set/get/api. Immer (applied before this middleware) should handle it.
        const stateDefinition = config(set, get, api);

        const wrappedStateAndActions = { ...stateDefinition } as typeof stateDefinition;

        for (const key in stateDefinition) {
            const property = stateDefinition[key];
            if (typeof property === 'function') {
                const originalAction = property as (...args: any[]) => any;

                (wrappedStateAndActions as any)[key] = (...args: any[]) => {
                    const syntheticAction = {
                        type: key,
                        payload: args[0],
                        meta: { timestamp: Date.now() }
                    };
                    performanceMonitor.startTracking(syntheticAction);
                    let success = true;
                    let result;
                    try {
                        result = originalAction(...args);
                        if (result instanceof Promise) {
                            return result.then(res => {
                                performanceMonitor.endTracking(syntheticAction, true);
                                return res;
                            }).catch(error => {
                                success = false;
                                console.error(`[Performance Middleware] Error in async action "${key}":`, error);
                                performanceMonitor.endTracking(syntheticAction, false);
                                throw error;
                            });
                        } else {
                            performanceMonitor.endTracking(syntheticAction, true);
                        }
                    } catch (error) {
                        success = false;
                        console.error(`[Performance Middleware] Error in sync action "${key}":`, error);
                        performanceMonitor.endTracking(syntheticAction, false);
                        throw error;
                    }
                    return result;
                };
            }
        }
        return wrappedStateAndActions;
    };
};

export const performance = performanceMiddlewareImpl as PerformanceMiddleware; 
