// Core Provider
export { KarmycCoreProvider } from './KarmycCoreProvider';

// Store
export { useKarmycStore, initializeMainStore } from './store';
export type { RootStateType } from './store';

// Space Store
export { useSpaceStore } from './spaceStore';
export type { 
    SpaceStateType, 
    Space, 
    SpaceState, 
    SpaceActions, 
    SpaceSharedState 
} from './spaceStore';

// Types
export * from './types/karmyc';
export * from './types/actions';
export * from './types/areas-type';
export * from './types/context-menu-types';

// Registries
export { actionRegistry } from './registries/actionRegistry';
export { keyboardShortcutRegistry } from './registries/keyboardShortcutRegistry';
export { areaRegistry } from './registries/areaRegistry';

// Plugins
export { historyPlugin } from './plugins/historyPlugins';


export type { CoreSlice } from './slices/core-slice';
export type { ContextMenuSlice } from './slices/context-menu-slice';
export type { ScreensSlice } from './slices/screens-slice';
export type { AreasSlice } from './slices/areas-slice';
export type { ActionRegistry } from './registries/actionRegistry';
