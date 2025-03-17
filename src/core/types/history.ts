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
export interface THistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

/**
 * Changement dans l'historique avec chemin
 */
export interface THistoryChange {
  path: string[];
  oldValue: any;
  newValue: any;
}

/**
 * Différence entre deux états
 */
export interface THistoryDiff {
  timestamp: number;
  actionType: string;
  changes: THistoryChange[];
}

/**
 * Action d'historique avec métadonnées
 */
export interface THistoryAction {
  id: string;
  type: string;
  timestamp: number;
  diffs: THistoryChange[];
  metadata?: Record<string, any>;
}

/**
 * État du système d'historique
 */
export interface IHistoryState {
  actions: THistoryAction[];
  currentIndex: number;
  isUndoing: boolean;
  isRedoing: boolean;
}

/**
 * Options pour le réducteur undoable
 */
export type TUndoableOptions = Omit<IHistoryOptions, 'groupBy'>;

export interface HistoryAction {
  id: string;
  type: string;
  timestamp: number;
  diffs: Array<{
    path: string[];
    oldValue: any;
    newValue: any;
  }>;
  metadata?: {
    areaId?: string;
    projectId?: string;
    userId?: string;
    duration?: number;
  };
}

export interface HistoryState {
  actions: HistoryAction[];
  currentIndex: number;
  isUndoing: boolean;
  isRedoing: boolean;
} 
