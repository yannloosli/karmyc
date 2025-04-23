/**
 * Public hooks from the core module
 * This file exports all public hooks from the module
 */

import type { AppDispatch, RootState } from '@gamesberry/karmyc-core/store/store';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Base hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Main API hooks
export * from './useArea';
export * from './useAreaKeyboardShortcuts';
export * from './useContextMenu';
export * from './useRegisterActionHandler';
export * from './useRegisterAreaType';
export * from './useRegisterContextMenuAction';
export * from './useSpace';

// Specific hooks
export * from './useActions';
export * from './useInitialize';
export * from './useKarmycLayout';
export * from './useKarmycLayoutProvider';
export * from './useUndoable';

// Utility hooks
export * from './useDiffSubscription';
export * from './useHistory';
export * from './useMouseInRect';
export * from './useNotifications';
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
