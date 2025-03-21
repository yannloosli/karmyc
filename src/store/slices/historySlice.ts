import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/**
 * Type d'entrée d'historique
 */
export interface HistoryEntry {
    name: string;
    timestamp?: number;
    prevState: any;
    nextState: any;
}

/**
 * État du slice historique
 */
export interface HistoryState {
    past: HistoryEntry[];
    future: HistoryEntry[];
    inProgress: boolean;
}

const initialState: HistoryState = {
    past: [],
    future: [],
    inProgress: false
};

/**
 * Slice pour la gestion de l'historique des actions
 */
export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        // Ajoute une entrée à l'historique
        addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
            const entry = {
                ...action.payload,
                timestamp: action.payload.timestamp || Date.now()
            };

            state.past.push(entry);
            state.future = [];
        },

        // Annule la dernière action (undo)
        undo: (state) => {
            const entry = state.past.pop();
            if (entry) {
                state.inProgress = true;
                state.future.unshift(entry);
            }
        },

        // Rétablit la dernière action annulée (redo)
        redo: (state) => {
            const entry = state.future.shift();
            if (entry) {
                state.inProgress = true;
                state.past.push(entry);
            }
        },

        // Annule toutes les actions
        reset: (state) => {
            state.past = [];
            state.future = [];
            state.inProgress = false;
        },

        // Marque la fin d'une opération d'annulation/rétablissement
        finishAction: (state) => {
            state.inProgress = false;
        }
    }
});

export const { addHistoryEntry, undo, redo, reset, finishAction } = historySlice.actions;

export default historySlice.reducer; 
