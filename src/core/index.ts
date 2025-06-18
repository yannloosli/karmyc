// Core Provider
export { KarmycCoreProvider } from './KarmycCoreProvider';

// Store
export { useKarmycStore, initializeMainStore } from './store';
export type { RootStateType } from './store';

// Types
export type { IKarmycCoreProviderProps, IKarmycOptions } from './types/karmyc';
export type { IActionPlugin } from './types/actions';

// Registries
export { actionRegistry } from './registries/actionRegistry';
export { keyboardShortcutRegistry } from './registries/keyboardShortcutRegistry';

// Plugins
export { historyPlugin } from './plugins/historyPlugins';


export type { CoreSlice } from './slices/core-slice';
export type { ContextMenuSlice } from './slices/context-menu-slice';
export type { ScreensSlice } from './slices/screens-slice';
export type { AreasSlice } from './slices/areas-slice';
export type { ActionRegistry } from './registries/actionRegistry';
