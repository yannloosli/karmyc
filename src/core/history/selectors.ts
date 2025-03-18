import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../store';

interface HistoryAction {
    id: string;
    type: string;
    timestamp: number;
    diffs: any[];
    metadata?: {
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

/**
 * Sélecteur pour vérifier si une action d'annulation est possible
 */
export const selectCanUndo = (state: RootState) => {
    return Object.keys(state).some(key => {
        const slice = state[key];
        return slice.past && slice.past.length > 0;
    });
};

/**
 * Sélecteur pour vérifier si une action de rétablissement est possible
 */
export const selectCanRedo = (state: RootState) => {
    return Object.keys(state).some(key => {
        const slice = state[key];
        return slice.future && slice.future.length > 0;
    });
};

/**
 * Sélecteur pour obtenir la longueur totale de l'historique
 */
export const selectHistoryLength = createSelector(
    (state: RootState) => state,
    (state) => {
        return Object.keys(state).reduce((total, key) => {
            const slice = state[key];
            return total + (slice.past ? slice.past.length : 0);
        }, 0);
    }
);

/**
 * Sélecteur pour obtenir l'historique d'un slice spécifique
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
 * Sélecteur pour obtenir le nombre d'actions annulables pour un slice spécifique
 */
export const selectSliceUndoCount = (sliceKey: string) => createSelector(
    (state: RootState) => state[sliceKey],
    (slice) => slice.past ? slice.past.length : 0
);

/**
 * Sélecteur pour obtenir le nombre d'actions rétablissables pour un slice spécifique
 */
export const selectSliceRedoCount = (sliceKey: string) => createSelector(
    (state: RootState) => state[sliceKey],
    (slice) => slice.future ? slice.future.length : 0
);

/**
 * Sélecteur pour obtenir les métadonnées de l'historique
 */
export const selectHistoryMetadata = createSelector(
    (state: RootState) => state.history,
    (history) => ({
        totalActions: history.actions.length,
        currentIndex: history.currentIndex,
        isUndoing: history.isUndoing,
        isRedoing: history.isRedoing,
    })
);

/**
 * Sélecteur pour obtenir les actions d'historique avec leurs métadonnées
 */
export const selectHistoryActions = createSelector(
    (state: RootState) => state.history.actions as HistoryAction[],
    (actions) => actions.map((action: HistoryAction) => ({
        id: action.id,
        type: action.type,
        timestamp: action.timestamp,
        diffsCount: action.diffs.length,
        metadata: action.metadata,
    }))
);

/**
 * Sélecteur pour obtenir les actions d'historique par type
 */
export const selectHistoryActionsByType = (actionType: string) => createSelector(
    (state: RootState) => state.history.actions as HistoryAction[],
    (actions) => actions.filter((action: HistoryAction) => action.type === actionType)
); 
