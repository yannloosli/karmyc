/**
 * Hooks publics du module core
 * Ce fichier exporte tous les hooks publics du module
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '~/store/store';

// Hooks de base
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hooks d'API principale
export * from './useArea';
export * from './useAreaKeyboardShortcuts';
export * from './useContextMenu';
export * from './useRegisterActionHandler';
export * from './useRegisterAreaType';
export * from './useRegisterContextMenuAction';

// Hooks spécifiques
export * from './useActions';
export * from './useInitialize';
export * from './useKarmycLayout';
export * from './useKarmycLayoutProvider';
export * from './useUndoable';

// Hooks utilitaires
export * from './useDiffSubscription';
export * from './useHistory';
export * from './useMouseInRect';
export * from './useNotifications';
export * from './useNumberTransitionState';
export * from './usePerformance';

// Import des hooks d'interface utilisateur depuis les composants directement
import { useMenuBar } from '../components/area/components/MenuBar';
import { useStatusBar } from '../components/area/components/StatusBar';
import { useToolbar } from '../components/area/components/Toolbar';

// Import des types depuis notre module interne
import {
    MenuBarComponentProps,
    StatusBarComponentProps,
    ToolbarComponentProps,
    ToolbarSlotComponentProps
} from '../components/area/hooks';

// Re-export des hooks d'interface utilisateur
export {
    useMenuBar,
    useStatusBar,
    useToolbar
};

// Re-export des types d'interface utilisateur
export type {
    MenuBarComponentProps,
    StatusBarComponentProps,
    ToolbarComponentProps,
    ToolbarSlotComponentProps
};
