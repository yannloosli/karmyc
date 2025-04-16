import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * History entry type
 */
export interface HistoryEntry {
    name: string;
    timestamp?: number;
    prevState: any;
    nextState: any;
    metadata?: {
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

/**
 * History state type
 */
export interface HistoryState {
    past: HistoryEntry[];
    future: HistoryEntry[];
    inProgress: boolean;
}

/**
 * Initial state
 */
const initialState: HistoryState = {
    past: [],
    future: [],
    inProgress: false
};

/**
 * Payload pour les actions undo/redo permettant de spécifier une area
 */
export interface UndoRedoPayload {
    areaId?: string;
}

/**
 * Slice for managing action history
 */
export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        // Add an entry to the history
        addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
            const entry = {
                ...action.payload,
                timestamp: action.payload.timestamp || Date.now()
            };

            // Ne pas enregistrer si nous sommes déjà en train de traiter une action d'historique
            if (!state.inProgress) {
                const areaId = entry.metadata?.areaId;
                console.log("Ajout d'une entrée d'historique:", entry.name, "pour area:", areaId || 'global');

                // Force vider la pile future AVANT d'ajouter la nouvelle action
                // Cela garantit qu'après un undo, toute nouvelle action efface les actions annulées
                console.log("  => VIDAGE COMPLET DES ACTIONS FUTURES");
                state.future = [];

                // Puis ajouter la nouvelle action
                state.past.push(entry);
            }
        },

        // Undo the last action
        undo: (state, action: PayloadAction<UndoRedoPayload | undefined>) => {
            if (state.past.length === 0) return;

            // Vérifier si l'action a un areaId spécifié
            const areaId = action.payload?.areaId;
            console.log("Slice: Undo pour area:", areaId || 'global');

            // Si un ID d'area est spécifié, annuler uniquement l'action correspondante
            if (areaId) {
                // Trouver la dernière action pour cette area en partant de la fin
                for (let i = state.past.length - 1; i >= 0; i--) {
                    if (state.past[i].metadata?.areaId === areaId) {
                        console.log("  => Annulation de l'action à l'index:", i, "type:", state.past[i].name);

                        // Obtenir l'entrée à déplacer
                        const entry = state.past[i];

                        // Supprimer l'entrée de past
                        state.past.splice(i, 1);

                        // Ajouter au début de future pour maintenir l'ordre chronologique inverse
                        state.future.unshift(entry);

                        // Marquer que nous sommes en cours d'opération
                        state.inProgress = true;

                        // Sortir après avoir traité la première action trouvée
                        break;
                    }
                }
            } else {
                // Undo global (dernière action, quelle que soit l'area)
                const entry = state.past.pop();
                if (entry) {
                    state.inProgress = true;
                    state.future.unshift(entry);
                }
            }
        },

        // Redo the last undone action
        redo: (state, action: PayloadAction<UndoRedoPayload | undefined>) => {
            if (state.future.length === 0) return;

            const areaId = action.payload?.areaId;
            console.log("Slice: Redo pour area:", areaId || 'global');

            // Si un ID d'area est spécifié, ne rétablir que les actions pour cette area
            if (areaId) {
                // Trouver la première action pour cette area
                const areaActionIndex = state.future.findIndex(
                    entry => entry.metadata?.areaId === areaId
                );

                if (areaActionIndex !== -1) {
                    const entry = state.future[areaActionIndex];

                    console.log("  => Rétablissement de l'action à l'index:", areaActionIndex, "type:", entry.name);

                    // Déplacer l'entrée de future vers past
                    state.future.splice(areaActionIndex, 1);
                    state.past.push(entry);
                    state.inProgress = true;
                } else {
                    console.log("  => Aucune action future trouvée pour cette area");
                }
            } else {
                // Rétablissement global (toutes les areas)
                const entry = state.future.shift();
                if (entry) {
                    state.inProgress = true;
                    state.past.push(entry);
                }
            }
        },

        // Cancel all actions
        reset: (state) => {
            state.past = [];
            state.future = [];
            state.inProgress = false;
        },

        // Mark the end of an undo/redo operation
        finishAction: (state) => {
            state.inProgress = false;
        }
    }
});

export const { addHistoryEntry, undo, redo, reset, finishAction } = historySlice.actions;

// Selector pour vérifier s'il y a des entrées futures pour une area spécifique
export const hasFutureEntriesForArea = (state: any, areaId: string): boolean => {
    if (!state.history || !state.history.future) return false;

    // Vérifier si des entrées dans le futur correspondent à cette area
    return state.history.future.some((entry: HistoryEntry) =>
        entry.metadata?.areaId === areaId
    );
};

// Selector pour vérifier s'il y a des entrées passées pour une area spécifique
export const hasPastEntriesForArea = (state: any, areaId: string): boolean => {
    if (!state.history || !state.history.past) return false;

    // Vérifier si des entrées dans le passé correspondent à cette area
    return state.history.past.some((entry: HistoryEntry) =>
        entry.metadata?.areaId === areaId
    );
};

export default historySlice.reducer; 
