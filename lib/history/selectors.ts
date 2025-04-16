import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';
import { HistoryEntry } from '../store/slices/historySlice';

interface HistoryAction {
    id: string;
    type: string;
    timestamp: number;
    diffsCount: number;
    metadata?: {
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

/**
 * Selector to check if an undo action is possible
 */
export const selectCanUndo = (state: RootState) => {
    console.log('SÉLECTEUR CanUndo - state.history:', state.history, 'past:', state.history?.past?.length);
    return state.history && state.history.past && state.history.past.length > 0;
};

/**
 * Selector to check if a redo action is possible
 */
export const selectCanRedo = (state: RootState) => {
    console.log('SÉLECTEUR CanRedo - state.history:', state.history, 'future:', state.history?.future?.length);
    return state.history && state.history.future && state.history.future.length > 0;
};

/**
 * Selector to check if an undo action is possible for a specific area
 */
export const hasPastEntriesForArea = (state: RootState, areaId: string): boolean => {
    if (!state.history || !state.history.past) return false;

    // Vérifier si des entrées dans le passé correspondent à cette area
    return state.history.past.some((entry: HistoryEntry) =>
        entry.metadata?.areaId === areaId
    );
};

/**
 * Selector to check if a redo action is possible for a specific area
 */
export const hasFutureEntriesForArea = (state: RootState, areaId: string): boolean => {
    if (!state.history || !state.history.future) return false;

    // Vérifier si des entrées dans le futur correspondent à cette area
    return state.history.future.some((entry: HistoryEntry) =>
        entry.metadata?.areaId === areaId
    );
};

/**
 * Selector to get the total history length
 */
export const selectHistoryLength = createSelector(
    (state: RootState) => state.history?.past || [],
    (past) => past.length
);

/**
 * Selector to get the history of a specific slice
 */
export const selectSliceHistory = (sliceKey: string) => createSelector(
    (state: RootState) => state[sliceKey],
    (slice) => ({
        past: slice.past || [],
        present: slice.present,
        future: slice.future || [],
    })
);

/**
 * Selector to get the number of undoable actions for a specific slice
 */
export const selectSliceUndoCount = (sliceKey: string) => createSelector(
    (state: RootState) => state[sliceKey],
    (slice) => slice.past ? slice.past.length : 0
);

/**
 * Selector to get the number of redoable actions for a specific slice
 */
export const selectSliceRedoCount = (sliceKey: string) => createSelector(
    (state: RootState) => state[sliceKey],
    (slice) => slice.future ? slice.future.length : 0
);

/**
 * Selector to get the history metadata
 */
export const selectHistoryMetadata = createSelector(
    (state: RootState) => state.history,
    (history) => ({
        totalActions: history.past ? history.past.length : 0,
        currentIndex: 0,
        isUndoing: history.inProgress,
        isRedoing: history.inProgress,
    })
);

/**
 * Selector to get history actions with their metadata
 */
export const selectHistoryActions = createSelector(
    (state: RootState) => state.history?.past || [],
    (past) => past.map((entry: HistoryEntry) => ({
        id: entry.name || `action-${entry.timestamp}`,
        type: entry.name || 'unknown',
        timestamp: entry.timestamp || 0,
        diffsCount: 1,
        metadata: entry.metadata || {},
    }))
);

/**
 * Selector to get history actions by type
 */
export const selectHistoryActionsByType = (actionType: string) => createSelector(
    (state: RootState) => state.history?.past || [],
    (past) => past
        .filter((entry: HistoryEntry) => entry.name === actionType)
        .map((entry: HistoryEntry) => ({
            id: entry.name || `action-${entry.timestamp}`,
            type: entry.name || 'unknown',
            timestamp: entry.timestamp || 0,
            diffsCount: 1,
            metadata: entry.metadata || {},
        }))
); 
