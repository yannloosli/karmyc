/**
 * Système d'historique du module core
 * Ce fichier exporte les fonctionnalités du système d'historique
 */

// Le système d'historique sera implémenté et exporté ici au fur et à mesure
// de l'implémentation du système 

export * from './diff';
export * from './selectors';
export * from './undoable';

// Types
export type { TUndoableOptions } from '../types/history';

// Actions
export const UNDO = 'history/UNDO';
export const REDO = 'history/REDO';
export const UPDATE_HISTORY = 'history/UPDATE_HISTORY';
export const CLEAR_HISTORY = 'history/CLEAR_HISTORY';

// Action creators
export const undo = () => ({ type: UNDO });
export const redo = () => ({ type: REDO });
export const updateHistory = (diff: any) => ({ type: UPDATE_HISTORY, payload: diff });
export const clearHistory = () => ({ type: CLEAR_HISTORY }); 
