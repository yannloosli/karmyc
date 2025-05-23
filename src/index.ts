/**
 * Main entry point for the Karmyc module
 * This file exports the public API of the Karmyc module
 */

// Export public hooks
export * from './hooks';

// Export main hook
export { useKarmyc } from './hooks/useKarmyc';

// Export public types
export * from './types/actions';
// export * from './types/areaTypes';
export * from './types/drawingTypes'

// Export public constants
export * from './constants';

// Export main provider
export { KarmycProvider } from './providers/KarmycProvider';

// Export utilities
export * from './utils';

// Export action registry
export { actionRegistry } from './stores/registries/actionRegistry';

// Export hooks
export { useActions } from './hooks/useActions';

// Export area registry
export { areaRegistry } from './stores/registries/areaRegistry';

// Export action registry from store registries (with registerActionHandler)
export { actionRegistry as actionRegistryWithHandlers } from './stores/registries/actionRegistry';

// Export stores
export { useKarmycStore } from './stores/areaStore';
export { useSpaceStore } from './stores/spaceStore';

export * from './components';

export * from './hooks/useArea';
export * from './stores/areaStore';

// Export public hooks
export * from './hooks';

// Export public types
export * from './types';

// Export public constants
export * from './constants';

export { DetachedWindowCleanup } from './components/DetachedWindowCleanup';
