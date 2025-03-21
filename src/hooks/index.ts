/**
 * Hooks publics du module core
 * Ce fichier exporte tous les hooks publics du module
 */

import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from '~/store/store';

// Hooks de base
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hooks spécifiques
export * from './useActions';
export * from './useArea';
export * from './useContextMenu';
export * from './useInitialize';
export * from './useUndoable';

// Nouveaux hooks
export * from './useDiffSubscription';
export * from './useHistory';
export * from './usePerformance';
