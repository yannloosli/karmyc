/**
 * Main entry point for the Karmyc module
 * This file exports the public API of the Karmyc module
 */

// Export public hooks
export * from './src/hooks';

// Export main hook
export { useKarmyc } from './src/hooks/useKarmyc';

// Export public components
export * from './src/components';
export { AreaToOpenPreview } from './src/components/area/components/AreaToOpenPreview'; // Export spécifique

// Export public types
export * from './src/types/actions';
export * from './src/types/areaTypes';
export * from './src/types/image'; // Ajout pour ImageData etc.

// Export public constants
export * from './src/constants';

// Export main provider
export { KarmycProvider } from './src/providers/KarmycProvider';

// Export utilities
export * from './src/utils/history';
export * from './src/utils/areaToViewport';
export * from './src/utils/areaUtils';
export { getAreaRootViewport } from './src/utils/getAreaViewport'; // Export spécifique

// Export action registry
export { actionRegistry } from './src/actions/registry';

// Export hooks (déjà couverts par export * from './src/hooks'; mais on garde pour clarté si besoin)
// export { useActions } from './src/hooks/useActions';

// Export actions
export * from './src/actions/validators';
export * from './src/actions/plugins/performance'; // Ajout de l'export pour le plugin performance

// Export area registry
export { areaRegistry } from './src/area/registry';

// Export action registry from store registries (with registerActionHandler)
export { actionRegistry as actionRegistryWithHandlers } from './src/store/registries/actionRegistry';

// Export context menu hooks
export { useSyncContextMenuActions } from './src/hooks/useSyncContextMenuActions';

// Export stores
export { useKarmycStore, useAreaStore } from './src/stores/areaStore'; // Export groupé
export { useSpaceStore } from './src/stores/spaceStore'; // Export de useSpaceStore
