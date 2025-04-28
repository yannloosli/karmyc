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

export const useSpaceStore = create<SpaceState>()(
    devtools(
        persist(
            immer((set, get) => ({
                _idCounter: 0,
                spaces: {},
                activeSpaceId: null,
                errors: [],

                // Actions
                addSpace: (spaceData) => {
                    // Basic validation example
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
                        sharedState: spaceData.sharedState || {},
                    };

                    set(state => {
                        state.spaces[newId] = newSpace;
                        state._idCounter += 1;
                        state.errors = []; // Clear errors on success
                        // Optionally set the new space as active
                        // state.activeSpaceId = newId;
                    });
                    return newId;
                },

                removeSpace: (id) => {
                    set(state => {
                        delete state.spaces[id];
                        if (state.activeSpaceId === id) {
                            state.activeSpaceId = null; // Reset active if deleted
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
                            // Basic validation example for update
                            if (spaceData.name === '') {
                                state.errors = ["Space name cannot be empty."];
                                console.error("Validation failed for space update:", state.errors);
                                return;
                            }
                            // Merge changes, ensuring id remains unchanged
                            const { id, ...changes } = spaceData;
                            state.spaces[id] = { ...space, ...changes };
                            state.errors = []; // Clear errors on success
                        } else {
                            state.errors = [`Space with ID ${spaceData.id} not found for update.`];
                            console.error("Update failed:", state.errors);
                        }
                    });
                },

                updateSpaceGenericSharedState: (payload) => {
                    set(state => {
                        const space = state.spaces[payload.spaceId];
                        if (space) {
                            space.sharedState = {
                                ...space.sharedState,
                                ...payload.changes,
                            };
                            state.errors = [];
                        } else {
                            state.errors = [`Space with ID ${payload.spaceId} not found for shared state update.`];
                            console.error("Shared state update failed:", state.errors);
                        }
                    });
                },

                clearErrors: () => {
                    set(state => {
                        state.errors = [];
                    });
                },

                // Selectors implemented as methods
                getSpaceById: (id) => {
                    return get().spaces[id];
                },

                getAllSpaces: () => {
                    return get().spaces;
                },

                getActiveSpace: () => {
                    const state = get();
                    return state.activeSpaceId ? state.spaces[state.activeSpaceId] : null;
                },

                getActiveSpaceId: () => {
                    return get().activeSpaceId;
                },

                getSpaceErrors: () => {
                    return get().errors;
                }

            })),
            {
                name: 'space-storage', // Unique name for localStorage persistence
                partialize: (state) => ({
                    // Select parts of the state to persist
                    _idCounter: state._idCounter,
                    spaces: state.spaces,
                    activeSpaceId: state.activeSpaceId,
                    // errors are typically not persisted
                }),
                // Optional: Add onRehydrateStorage if validation/cleanup is needed on load
                // onRehydrateStorage: () => (state) => {
                //     if (state) {
                //         console.log("Space state rehydrated from storage");
                //         // Perform validation or cleanup if necessary
                //     }
                // }
            }
        )
    )
);

// Example of how to use selectors outside components (e.g., in utility functions)
// export const selectAllSpacesFromStore = () => useSpaceStore.getState().getAllSpaces();
// export const selectActiveSpaceFromStore = () => useSpaceStore.getState().getActiveSpace(); 
