/**
 * Hooks publics du module core
 * Ce fichier exporte tous les hooks publics du module
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '~/store/store';

// Hooks de base
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hooks d'API principale (API modulaire)
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
// Note: useVec2TransitionState est déjà exporté par useNumberTransitionState
// export * from './useVec2TransitionState';
