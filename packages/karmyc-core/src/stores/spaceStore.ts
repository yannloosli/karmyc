import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { THistoryDiff, applyDiff, generateDiff, invertDiff } from '../history/diff'; // Adjust path as needed
import { Line } from './src/types/drawingTypes';

export interface SpaceSharedState extends Record<string, any> {
    lines: Line[];
    strokeWidth: number;
    color: string;
    pastDiffs: THistoryDiff[];
    futureDiffs: THistoryDiff[];
}

export interface Space {
    id: string;
    name: string;
    sharedState: SpaceSharedState;
}

export interface SpaceState {
    _idCounter: number;
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    errors: string[];

    // Actions
    addSpace: (spaceData: { name: string; sharedState?: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    updateSpace: (spaceData: Partial<Space> & { id: string }) => void;
    updateSpaceGenericSharedState: (payload: { spaceId: string; changes: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }) => void;
    clearErrors: () => void;
    // New history actions for spaces
    undoSharedState: (spaceId: string) => void;
    redoSharedState: (spaceId: string) => void;

    // Selectors
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
    return {
        _idCounter: 0,
        spaces: {},
        activeSpaceId: null,
        errors: [],

        // Actions with logs
        addSpace: (spaceData) => {
            if (!spaceData.name) {
                set(state => {
                    state.errors = ["Space name cannot be empty."];
                });
                console.error("Validation failed for space:", get().errors);
                return undefined;
            }
            const newId = `space-${get()._idCounter + 1}`;
            const newSpace: Space = {
                id: newId,
                name: spaceData.name,
                sharedState: {
                    lines: spaceData.sharedState?.lines ?? [],
                    strokeWidth: spaceData.sharedState?.strokeWidth ?? 3,
                    color: spaceData.sharedState?.color ?? '#000000',
                    pastDiffs: [],
                    futureDiffs: [],
                    ...(spaceData.sharedState || {}),
                },
            };
            set(state => {
                state.spaces[newId] = newSpace;
                state._idCounter += 1;
                state.errors = [];
            });
            return newId;
        },
        removeSpace: (id) => {
            set(state => {
                delete state.spaces[id];
                if (state.activeSpaceId === id) {
                    state.activeSpaceId = null;
                }
                state.errors = [];
            });
        },
        setActiveSpace: (id) => {
            set(state => {
                if (id === null || state.spaces[id]) {
                    state.activeSpaceId = id;
                } else {
                    console.warn(`Attempted to set active space to non-existent ID: ${id}`);
                }
                state.errors = [];
            });
        },
        updateSpace: (spaceData) => {
            set(state => {
                const space = state.spaces[spaceData.id];
                if (space) {
                    if (spaceData.name === '') {
                        state.errors = ["Space name cannot be empty."];
                        console.error("Validation failed for space update:", state.errors);
                        return;
                    }
                    const { id, ...changes } = spaceData;
                    state.spaces[id] = { ...space, ...changes };
                    state.errors = [];
                } else {
                    state.errors = [`Space with ID ${spaceData.id} not found for update.`];
                    console.error("Update failed:", state.errors);
                }
            });
        },
        updateSpaceGenericSharedState: (payload) => {
            const { spaceId, changes } = payload;
            const space = get().spaces[spaceId];

            if (!space) {
                set(state => {
                    state.errors = [`Space with ID ${payload.spaceId} not found for shared state update.`];
                });
                console.error("Shared state update failed: Space not found");
                return;
            }

            const prevState = space.sharedState;

            set(state => {
                const currentSpace = state.spaces[spaceId];
                if (currentSpace) {
                    currentSpace.sharedState = { ...currentSpace.sharedState, ...changes };
                    state.errors = [];
                }
            });
            const nextState = get().spaces[spaceId]?.sharedState;

            if (!nextState) {
                console.error("Shared state update failed: Space disappeared after update?");
                return;
            }
            const diff = generateDiff(prevState, nextState, { type: 'UPDATE_SHARED_STATE', payload });
            if (diff.changes.length > 0) {
                set(state => {
                    const currentSpace = state.spaces[spaceId];
                    if (currentSpace) {
                        if (!currentSpace.sharedState.pastDiffs) currentSpace.sharedState.pastDiffs = [];
                        currentSpace.sharedState.pastDiffs.push(diff);
                        currentSpace.sharedState.futureDiffs = [];
                    }
                });
            }
        },
        clearErrors: () => {
            set(state => {
                state.errors = [];
            });
        },
        undoSharedState: (spaceId: string) => {
            set(state => {
                const space = state.spaces[spaceId];
                if (!space?.sharedState?.pastDiffs?.length) {
                    return;
                }
                const diffToUndo = space.sharedState.pastDiffs.pop()!;

                // *** Apply the ORIGINAL diff directly to restore oldValue ***
                const stateBeforeUndo = space.sharedState;
                const stateAfterUndo = applyDiff(stateBeforeUndo, diffToUndo);

                space.sharedState = stateAfterUndo as SpaceSharedState; // Cast result
                if (!space.sharedState.futureDiffs) space.sharedState.futureDiffs = [];
                space.sharedState.futureDiffs.push(diffToUndo);
            });
        },
        redoSharedState: (spaceId: string) => {
            set(state => {
                const space = state.spaces[spaceId];
                if (!space?.sharedState?.futureDiffs?.length) {
                    return;
                }
                const diffToRedo = space.sharedState.futureDiffs.pop()!;

                // *** Invert the diff to get the future state into oldValue for applyDiff ***
                const invertedDiffToRedo = invertDiff(diffToRedo);

                const stateBeforeRedo = space.sharedState;
                const stateAfterRedo = applyDiff(stateBeforeRedo, invertedDiffToRedo);

                space.sharedState = stateAfterRedo as SpaceSharedState; // Cast result
                if (!space.sharedState.pastDiffs) space.sharedState.pastDiffs = [];
                space.sharedState.pastDiffs.push(diffToRedo);
            });
        },
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

// Wrap with persist
const persistConfig = persist(immerConfig, {
    name: 'space-storage',
    partialize: (state: SpaceState) => {
        const spacesToPersist: Record<string, Partial<Omit<Space, 'sharedState'>> & { sharedState: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }> = {};
        for (const spaceId in state.spaces) {
            const { sharedState, ...restOfSpace } = state.spaces[spaceId];
            const { pastDiffs, futureDiffs, ...restOfSharedState } = sharedState ?? {};
            spacesToPersist[spaceId] = {
                ...restOfSpace,
                sharedState: restOfSharedState
            };
        }
        const { _idCounter, activeSpaceId } = state;
        return { _idCounter, spaces: spacesToPersist, activeSpaceId };
    },
    merge: (persistedState: unknown, currentState: SpaceState): SpaceState => {
        const loadedState = persistedState as Partial<SpaceState>; // Cast persisted state

        // Validate loaded spaces and merge with defaults
        const validatedSpaces: Record<string, Space> = {};
        const spacesFromStorage = loadedState?.spaces ?? {};

        // Use current state spaces as a base
        const baseSpaces = currentState.spaces;

        // Combine keys from storage and initial state
        const allSpaceIds = new Set([...Object.keys(spacesFromStorage), ...Object.keys(baseSpaces)]);

        for (const spaceId of allSpaceIds) {
            const spaceFromStorage = spacesFromStorage[spaceId];
            const spaceFromCode = baseSpaces[spaceId];

            if (!spaceFromStorage && !spaceFromCode) continue;

            const baseShared = spaceFromCode?.sharedState ?? {};
            const loadedShared = spaceFromStorage?.sharedState ?? {};

            validatedSpaces[spaceId] = {
                id: spaceFromStorage?.id ?? spaceFromCode?.id ?? spaceId,
                name: spaceFromStorage?.name ?? spaceFromCode?.name ?? `Space ${spaceId}`,
                // Corrected Merge: Base -> Loaded -> Reset History
                sharedState: {
                    // 1. Start with base state from code (contains defaults like color, width, etc.)
                    ...baseShared,
                    // 2. Overwrite with loaded state from storage (if any)
                    ...loadedShared,
                    // 3. ALWAYS reset history arrays, overwriting any persisted history
                    pastDiffs: [],
                    futureDiffs: [],
                },
            };
            // Ensure defaults if loaded state completely misses sharedState
            if (!validatedSpaces[spaceId].sharedState.lines) validatedSpaces[spaceId].sharedState.lines = [];
            if (validatedSpaces[spaceId].sharedState.strokeWidth === undefined) validatedSpaces[spaceId].sharedState.strokeWidth = 3;
            if (!validatedSpaces[spaceId].sharedState.color) validatedSpaces[spaceId].sharedState.color = '#000000';

        }

        // Return the fully merged state, prioritizing loaded simple values
        const finalState = {
            ...currentState, // Start with current state (functions, initial structure)
            _idCounter: loadedState?._idCounter ?? currentState._idCounter,
            activeSpaceId: loadedState?.activeSpaceId ?? currentState.activeSpaceId,
            spaces: validatedSpaces, // Use the carefully merged spaces
            errors: [], // Always reset errors on load
        };
        return finalState;
    }
});

// Finally, wrap with devtools and create the store
export const useSpaceStore = create<SpaceState>()(
    devtools(persistConfig, { name: 'SpaceStore' })
);

// Example of how to use selectors outside components (e.g., in utility functions)
// export const selectAllSpacesFromStore = () => useSpaceStore.getState().getAllSpaces();
// export const selectActiveSpaceFromStore = () => useSpaceStore.getState().getActiveSpace(); 
