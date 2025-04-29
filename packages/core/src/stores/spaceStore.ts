import { temporal } from 'zundo';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// Assuming a basic Space structure for now
// Adjust as needed based on the actual Space type used in the application
export interface Space {
    id: string;
    name: string;
    sharedState: Record<string, any>;
    // Add other space-specific properties if necessary
}

export interface SpaceState {
    _idCounter: number; // To generate unique IDs if needed
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    errors: string[]; // For potential validation errors

    // Actions
    addSpace: (spaceData: { name: string; sharedState?: Record<string, any> }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    updateSpace: (spaceData: Partial<Space> & { id: string }) => void;
    updateSpaceGenericSharedState: (payload: { spaceId: string; changes: Partial<Record<string, any>> }) => void;
    clearErrors: () => void; // Action to clear errors

    // Selectors (as methods in the store)
    getSpaceById: (id: string) => Space | undefined;
    getAllSpaces: () => Record<string, Space>;
    getActiveSpace: () => Space | null;
    getActiveSpaceId: () => string | null;
    getSpaceErrors: () => string[];
}

// Helper function for validation (optional, implement if needed)
// function validateSpace(space: Partial<Space>): { isValid: boolean; errors: string[] } {
//     const errors: string[] = [];
//     if (!space.name) errors.push("Space name is required.");
//     // Add more validation rules as needed
//     return { isValid: errors.length === 0, errors };
// }

// Define the core state logic with immer first
const immerConfig = immer<SpaceState>((set, get) => {
    console.log('[spaceStore] Initializing immer state logic');
    return {
        _idCounter: 0,
        spaces: {},
        activeSpaceId: null,
        errors: [],

        // Actions with logs
        addSpace: (spaceData) => {
            console.log('[spaceStore] addSpace called', spaceData);
            if (!spaceData.name) {
                set(state => {
                    console.log('[spaceStore] set (addSpace - validation error)');
                    state.errors = ["Space name cannot be empty."];
                });
                console.error("Validation failed for space:", get().errors);
                return undefined;
            }
            const newId = `space-${get()._idCounter + 1}`;
            const newSpace: Space = {
                id: newId,
                name: spaceData.name,
                sharedState: spaceData.sharedState || {},
            };
            set(state => {
                console.log('[spaceStore] set (addSpace - success)');
                state.spaces[newId] = newSpace;
                state._idCounter += 1;
                state.errors = [];
            });
            return newId;
        },
        removeSpace: (id) => {
            console.log('[spaceStore] removeSpace called', id);
            set(state => {
                console.log('[spaceStore] set (removeSpace)');
                delete state.spaces[id];
                if (state.activeSpaceId === id) {
                    state.activeSpaceId = null;
                }
                state.errors = [];
            });
        },
        setActiveSpace: (id) => {
            console.log('[spaceStore] setActiveSpace called', id);
            set(state => {
                console.log('[spaceStore] set (setActiveSpace)');
                if (id === null || state.spaces[id]) {
                    state.activeSpaceId = id;
                } else {
                    console.warn(`Attempted to set active space to non-existent ID: ${id}`);
                }
                state.errors = [];
            });
        },
        updateSpace: (spaceData) => {
            console.log('[spaceStore] updateSpace called', spaceData);
            set(state => {
                const space = state.spaces[spaceData.id];
                if (space) {
                    if (spaceData.name === '') {
                        console.log('[spaceStore] set (updateSpace - validation error)');
                        state.errors = ["Space name cannot be empty."];
                        console.error("Validation failed for space update:", state.errors);
                        return;
                    }
                    const { id, ...changes } = spaceData;
                    console.log('[spaceStore] set (updateSpace - success)');
                    state.spaces[id] = { ...space, ...changes };
                    state.errors = [];
                } else {
                    console.log('[spaceStore] set (updateSpace - not found)');
                    state.errors = [`Space with ID ${spaceData.id} not found for update.`];
                    console.error("Update failed:", state.errors);
                }
            });
        },
        updateSpaceGenericSharedState: (payload) => {
            console.log('[spaceStore] updateSpaceGenericSharedState called', payload);
            set(state => {
                const space = state.spaces[payload.spaceId];
                if (space) {
                    console.log('[spaceStore] set (updateSpaceGenericSharedState - success)');
                    space.sharedState = {
                        ...space.sharedState,
                        ...payload.changes,
                    };
                    state.errors = [];
                } else {
                    console.log('[spaceStore] set (updateSpaceGenericSharedState - not found)');
                    state.errors = [`Space with ID ${payload.spaceId} not found for shared state update.`];
                    console.error("Shared state update failed:", state.errors);
                }
            });
        },
        clearErrors: () => {
            console.log('[spaceStore] clearErrors called');
            set(state => {
                console.log('[spaceStore] set (clearErrors)');
                state.errors = [];
            });
        },

        // Selectors
        getSpaceById: (id) => get().spaces[id],
        getAllSpaces: () => get().spaces,
        getActiveSpace: () => {
            const state = get();
            return state.activeSpaceId ? state.spaces[state.activeSpaceId] : null;
        },
        getActiveSpaceId: () => get().activeSpaceId,
        getSpaceErrors: () => get().errors
    };
});

// Wrap with temporal
const temporalConfig = temporal(immerConfig, {
    partialize: (state: SpaceState): Partial<SpaceState> => {
        const { spaces } = state;
        console.log('[spaceStore temporal] Partialize called, tracking:', { spaces });
        return { spaces };
    },
    onSave: (pastState: SpaceState, currentState: SpaceState) => {
        console.log('[spaceStore temporal] onSave called', { pastState, currentState });
    }
    // limit: 100, // Optional limit
});

// Wrap with persist
const persistConfig = persist(temporalConfig, {
    name: 'space-storage',
    partialize: (state: SpaceState) => {
        const { _idCounter, spaces, activeSpaceId } = state;
        // console.log('[spaceStore persist] Partialize called, persisting:', { _idCounter, spaces, activeSpaceId });
        return { _idCounter, spaces, activeSpaceId };
    },
});

// Finally, wrap with devtools and create the store
export const useSpaceStore = create<SpaceState>()(
    devtools(persistConfig, { name: 'SpaceStore' })
);

// Example of how to use selectors outside components (e.g., in utility functions)
// export const selectAllSpacesFromStore = () => useSpaceStore.getState().getAllSpaces();
// export const selectActiveSpaceFromStore = () => useSpaceStore.getState().getActiveSpace(); 
