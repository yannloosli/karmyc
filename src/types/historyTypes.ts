import { IAction } from '../core/types/actions';

/**
 * Options for the history system
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
    groupBy?: (action: IAction) => string;
}

/**
 * State with history
 */
export interface THistoryState<T> {
    past: T[];
    present: T;
    future: T[];
}

/**
 * Change in history with path
 */
export interface THistoryChange {
    path: string[];
    oldValue: any;
    newValue: any;
}

/**
 * Difference between two states
 */
export interface THistoryDiff {
    timestamp: number;
    actionType: string;
    changes: THistoryChange[];
}

/**
 * History action with metadata
 */
export interface THistoryAction {
    id: string;
    type: string;
    timestamp: number;
    diffs: THistoryChange[];
    metadata?: Record<string, any>;
}

/**
 * History system state
 */
export interface IHistoryState {
    actions: THistoryAction[];
    currentIndex: number;
    isUndoing: boolean;
    isRedoing: boolean;
}

/**
 * Options for the undoable reducer
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

/**
 * Configuration de l'historique
 */
export interface HistoryConfig<S = any> {
    maxHistorySize?: number;
    filter?: (action: IAction, currentState: S, previousHistory: any) => boolean;
    groupBy?: (action: IAction) => string;
} 
