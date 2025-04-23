/**
 * History system of the core module
 * This file exports the functionalities of the history system
 */

// The history system will be implemented and exported here as
// the system implementation progresses

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
