import { AnyAction } from '@reduxjs/toolkit';

/**
 * Options pour le système d'historique
 */
export interface IHistoryOptions {
  limit?: number;
  undoType?: string;
  redoType?: string;
  clearHistoryType?: string;
  jumpToFutureType?: string;
  jumpToPastType?: string;
  includeActions?: string[];
  excludeActions?: string[];
  groupBy?: (action: AnyAction) => string;
}

/**
 * État avec historique
 */
export interface IStateWithHistory<S> {
  past: S[];
  present: S;
  future: S[];
}

/**
 * Différence entre deux états
 */
export interface IDiff {
  path: string[];
  oldValue: any;
  newValue: any;
}

/**
 * Action d'historique
 */
export interface IHistoryAction {
  id: string;
  type: string;
  timestamp: number;
  diffs: IDiff[];
  metadata?: Record<string, any>;
}

/**
 * État du système d'historique
 */
export interface IHistoryState {
  actions: IHistoryAction[];
  currentIndex: number;
  isUndoing: boolean;
  isRedoing: boolean;
}

/**
 * Options pour le réducteur undoable
 */
export type TUndoableOptions = Omit<IHistoryOptions, 'groupBy'>; 
