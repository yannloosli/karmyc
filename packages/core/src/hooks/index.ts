/**
 * Public hooks from the core module
 * This file exports all public hooks from the module
 */


// Main API hooks
export * from './useArea';
export * from './useAreaKeyboardShortcuts';
export * from './useContextMenu';
export * from './useRegisterActionHandler';
export * from './useRegisterAreaType';
export * from './useSpace';

// Specific hooks
export * from './useActions';
export * from './useInitialize';
export * from './useKarmyc';

// Utility hooks
export * from './useMouseInRect';
export * from './useNumberTransitionState';
export * from './usePerformance';

// Import UI hooks directly from components
import { useMenuBar } from '../components/area/components/MenuBar';
import { useStatusBar } from '../components/area/components/StatusBar';
import { useToolbar } from '../components/area/components/Toolbar';

// Import types from our internal module
import {
    MenuBarComponentProps,
    StatusBarComponentProps,
    ToolbarComponentProps,
    ToolbarSlotComponentProps
} from '../components/area/hooks';

// Re-export UI hooks
export {
    useMenuBar,
    useStatusBar,
    useToolbar
};

// Re-export UI types
export type {
    MenuBarComponentProps,
    StatusBarComponentProps,
    ToolbarComponentProps,
    ToolbarSlotComponentProps
};
