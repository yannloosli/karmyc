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
export * from './types/actions';
export * from './types/areaTypes';

// Export public constants
export * from './constants';

// Export main provider
export { KarmycProvider } from './providers/KarmycProvider';

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

// Export context menu hooks
export { useSyncContextMenuActions } from './hooks/useSyncContextMenuActions';

// Export stores
export { useKarmycStore } from './stores/areaStore';
export { useAreaStore } from './stores/areaStore';

export * from './actions/plugins/performance';
export * from './components/area/components/AreaToOpenPreview';

export * from './hooks/useSpace';
export * from './hooks/useArea';
export * from './stores/spaceStore';
export * from './stores/areaStore';
export * from './stores/contextMenuStore';
