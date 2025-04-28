/**
 * Main entry point for the Karmyc module
 * This file exports the public API of the Karmyc module
 */

// Point d'entrée pour le package core
// Import des dépendances (décommentez quand le package shared sera prêt)
// import { } from '@gamesberry/karmyc-shared';

// Export public hooks
export * from './hooks';

// Export main hook
export { useKarmyc } from './hooks/useKarmyc';

// Export public components
export * from './components';

// Export public types
export type * from './types/actions';

// Export public constants
export * from './constants';

// Export main provider
export { KarmycProvider } from './providers/KarmycProvider';

// Export store and store types
export { store } from './store';
export type { AppDispatch, RootState } from './store';

// Export public actions
export {
    // Area actions
    addArea, removeArea, setActiveArea, updateArea
} from './store';

// Export utilities
export * from './utils/history';

// Export action registry
export { actionRegistry } from './actions/registry';

// Export hooks
export { useActions } from './hooks/useActions';

// Export actions
export * from './actions/validators';

// Export area registry
export { areaRegistry } from './area/registry';

// Export action registry from store registries (with registerActionHandler)
export { actionRegistry as actionRegistryWithHandlers } from './store/registries/actionRegistry';

// Export area slice
export { areaSlice, setAreaType, setFields } from './store/slices/areaSlice';

// Export context menu hooks
export { useSyncContextMenuActions } from './hooks/useSyncContextMenuActions';

// Exports
export { };
