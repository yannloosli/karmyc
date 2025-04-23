import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from ".."; // Assurez-vous que ce chemin est correct

/**
 * History entry type
 */
export interface HistoryEntry {
    name: string;
    timestamp?: number;
    prevState: any;
    nextState: any;
    metadata?: {
        spaceId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

/**
 * History state type
 */
export interface HistoryState {
    spaces: {
        [spaceId: string]: {
            past: HistoryEntry[];
            future: HistoryEntry[];
        };
    };
    inProgressSpaceId: string | null;
}

/**
 * Initial state
 */
const initialState: HistoryState = {
    spaces: {},
    inProgressSpaceId: null
};

/**
 * Payload pour les actions undo/redo utilisant spaceId
 */
export interface UndoRedoPayload {
    spaceId?: string;
}

/**
 * Slice for managing action history
 */
export const historySlice = createSlice({
    name: 'history',
    initialState,
    reducers: {
        addHistoryEntry: (state, action: PayloadAction<HistoryEntry>) => {
            const entry = {
                ...action.payload,
                timestamp: action.payload.timestamp || Date.now()
            };
            const spaceId = entry.metadata?.spaceId;

            if (state.inProgressSpaceId === spaceId) return;

            if (!spaceId) {
                console.warn("addHistoryEntry: Action sans spaceId reçue, ignorée.");
                return;
            }

            console.log("Ajout d'historique pour space:", spaceId, "Action:", entry.name);

            if (!state.spaces[spaceId]) {
                state.spaces[spaceId] = { past: [], future: [] };
            }

            if (state.spaces[spaceId].future.length > 0) {
                console.log(`  => VIDAGE de ${state.spaces[spaceId].future.length} action(s) future(s) pour l'espace ${spaceId}`);
                state.spaces[spaceId].future = [];
            }

            state.spaces[spaceId].past.push(entry);
        },

        undo: (state, action: PayloadAction<UndoRedoPayload | undefined>) => {
            const spaceId = action.payload?.spaceId;
            if (!spaceId || !state.spaces[spaceId] || state.spaces[spaceId].past.length === 0) {
                console.log("Slice: Undo ignoré (pas de spaceId, historique vide ou inconnu)");
                return;
            }
            console.log("Slice: Undo pour space:", spaceId);

            const entry = state.spaces[spaceId].past.pop();
            if (entry) {
                state.spaces[spaceId].future.unshift(entry);
                state.inProgressSpaceId = spaceId;
                console.log("  => Action annulée:", entry.name);
            }
        },

        redo: (state, action: PayloadAction<UndoRedoPayload | undefined>) => {
            const spaceId = action.payload?.spaceId;
            if (!spaceId || !state.spaces[spaceId] || state.spaces[spaceId].future.length === 0) {
                console.log("Slice: Redo ignoré (pas de spaceId, historique vide ou inconnu)");
                return;
            }
            console.log("Slice: Redo pour space:", spaceId);

            const entry = state.spaces[spaceId].future.shift();
            if (entry) {
                state.spaces[spaceId].past.push(entry);
                state.inProgressSpaceId = spaceId;
                console.log("  => Action rétablie:", entry.name);
            }
        },

        reset: (state) => {
            state.spaces = {};
            state.inProgressSpaceId = null;
        },

        finishAction: (state, action: PayloadAction<{ spaceId?: string } | undefined>) => {
            const spaceId = action.payload?.spaceId;
            if (state.inProgressSpaceId === spaceId || !spaceId) {
                console.log("FinishAction pour space:", spaceId ?? 'global');
                state.inProgressSpaceId = null;
            }
        }
    }
});

export const { addHistoryEntry, undo, redo, reset, finishAction } = historySlice.actions;

export const hasPastEntriesForSpace = (state: RootState, spaceId: string | null): boolean => {
    if (!spaceId) return false;
    return (state.history.spaces[spaceId]?.past?.length ?? 0) > 0;
};

export const hasFutureEntriesForSpace = (state: RootState, spaceId: string | null): boolean => {
    if (!spaceId) return false;
    return (state.history.spaces[spaceId]?.future?.length ?? 0) > 0;
};

export default historySlice.reducer; 
