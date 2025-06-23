// Core
export * from './core';


// Components
export * from './components';

// Hooks
export * from './hooks';    
export type { ZustandPlugin } from './hooks/usePluginSystem';
export { createPluginMiddleware } from './hooks/usePluginSystem';

// Store
export * from './core/store';

// Space Store
export { useSpaceStore } from './core/spaceStore';
export type { 
    SpaceStateType, 
    Space, 
    SpaceState, 
    SpaceActions, 
    SpaceSharedState 
} from './core/spaceStore';

// Utils
export * from './utils';

// Types
export type { PlaceArea } from './core/types/areas-type';
export type { THistoryDiff } from './types/historyTypes';

// Action system
export { actionRegistry } from './core/registries/actionRegistry';
export type { Action, IActionPlugin } from './core/types/actions';

// Next.js compatibility
export { KarmycNextWrapper } from './components/KarmycNextWrapper';
