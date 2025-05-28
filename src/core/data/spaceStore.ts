import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { generateDiff, applyDiff, invertDiff } from '../../garbage/utils/history';
import { THistoryDiff } from '../../garbage/history/history';

// Type pour les calques
export interface LayerLike {
    id: string;
    type: string;
    name?: string;
    visible: boolean;
    enabled: boolean;
    zIndex: number;
    blendMode?: string;
    opacity: number;
    locked: boolean;
    layerStyle?: {
        filters: {
            blur?: number;
            brightness?: number;
            contrast?: number;
            dropShadow?: {
                offsetX: number;
                offsetY: number;
                blur: number;
                color: string;
            };
            grayscale?: number;
            hueRotate?: number;
            invert?: number;
            saturate?: number;
            sepia?: number;
        };
        enabled?: boolean;
    };
    [key: string]: any;
}

export interface SpaceSharedState extends Record<string, any> {
    lines: any[];
    strokeWidth: number;
    color: string;
    pastDiffs: THistoryDiff[];
    futureDiffs: THistoryDiff[];
    layers: LayerLike[]; // Utilisation du type LayerLike
    activeLayerId?: string | null; // Nouveau champ pour l'ID du calque actif
    zoom: number;
    pan: { x: number; y: number };
}

export interface Space {
    id: string;
    name: string;
    /**
     * Optional description for the space (user-defined, can be empty).
     */
    description?: string;
    sharedState: SpaceSharedState;
}

export interface SpaceState {
    _idCounter: number;
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    errors: string[];

    // Actions
    addSpace: (spaceData: { name: string; description?: string; sharedState?: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    updateSpace: (spaceData: Partial<Space> & { id: string }) => void;
    updateSpaceGenericSharedState: (payload: { spaceId: string; changes: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }) => void;
    setActiveLayerId: (payload: { spaceId: string; layerId: string | null }) => void;
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
                description: spaceData.description ?? '',
                sharedState: {
                    lines: spaceData.sharedState?.lines ?? [],
                    strokeWidth: spaceData.sharedState?.strokeWidth ?? 3,
                    color: spaceData.sharedState?.color ?? '#ff0000',
                    pastDiffs: [],
                    futureDiffs: [],
                    layers: spaceData.sharedState?.layers ?? [],
                    activeLayerId: spaceData.sharedState?.activeLayerId ?? null,
                    zoom: spaceData.sharedState?.zoom ?? 1,
                    pan: spaceData.sharedState?.pan ?? { x: 0, y: 0 },
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

            // Garde-fou : layers ne doit contenir que des objets valides
            if (Array.isArray(changes.layers)) {
                changes.layers = [...changes.layers.filter((l: LayerLike) => !!l)]; // force un nouveau tableau et type `l`
                // Si la liste des calques est modifiée, et que activeLayerId n'est plus dans la liste, le réinitialiser.
                // Note: on suppose que les `changes.layers` sont la nouvelle liste complète des calques.
                // Si `changes.layers` est une mise à jour partielle, cette logique devra être ajustée.
                const currentActiveLayerId = space.sharedState.activeLayerId;
                if (currentActiveLayerId && changes.layers.findIndex((l: LayerLike) => l.id === currentActiveLayerId) === -1) { // type `l`
                    changes.activeLayerId = null;
                }
            }

            const prevState = space.sharedState;

            console.log('[STORE] updateSpaceGenericSharedState appelé avec :', { spaceId, changes });

            set(state => {
                const currentSpace = state.spaces[spaceId];
                if (currentSpace) {
                    currentSpace.sharedState = { ...currentSpace.sharedState, ...changes };
                    state.errors = [];
                    // Log l'ordre des layers après update
                    if (Array.isArray(currentSpace.sharedState.layers)) {
                        console.log('[STORE] Nouvelle ordre layers:', currentSpace.sharedState.layers.map(l => l.id));
                    }
                }
            });
            const nextState = get().spaces[spaceId]?.sharedState;

            if (!nextState) {
                console.error("Shared state update failed: Space disappeared after update?");
                return;
            }
            const diff = generateDiff(prevState, nextState);
            if (Array.isArray(diff) && diff.length > 0) {
                set(state => {
                    const currentSpace = state.spaces[spaceId];
                    if (currentSpace) {
                        if (!currentSpace.sharedState.pastDiffs) currentSpace.sharedState.pastDiffs = [];
                        currentSpace.sharedState.pastDiffs.push({
                            timestamp: Date.now(),
                            actionType: 'UPDATE_SHARED_STATE',
                            changes: diff,
                        });
                        currentSpace.sharedState.futureDiffs = [];
                    }
                });
            }
        },
        setActiveLayerId: (payload) => {
            const { spaceId, layerId } = payload;
            set(state => {
                const space = state.spaces[spaceId];
                if (space) {
                    // Vérifier si le layerId existe dans la liste des layers du space (optionnel mais recommandé)
                    const layerExists = space.sharedState.layers.some((l: LayerLike) => l.id === layerId); // type `l`
                    if (layerId === null || layerExists) {
                        space.sharedState.activeLayerId = layerId;
                    } else {
                        console.warn(`Attempted to set active layer to non-existent ID: ${layerId} in space ${spaceId}`);
                        // Optionnel : ne pas changer activeLayerId ou le mettre à null
                        // space.sharedState.activeLayerId = null;
                    }
                } else {
                    console.warn(`Attempted to set active layer for non-existent space ID: ${spaceId}`);
                }
            });
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
        const result = { _idCounter, spaces: spacesToPersist, activeSpaceId };
        return result;
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
                description: spaceFromStorage?.description ?? spaceFromCode?.description ?? '',
                sharedState: {
                    ...baseShared,
                    ...loadedShared,
                    layers: loadedShared.layers ?? baseShared.layers ?? [], // Priorité au localStorage
                    pastDiffs: [],
                    futureDiffs: [],
                    zoom: loadedShared.zoom ?? baseShared.zoom ?? 1,
                    pan: loadedShared.pan ?? baseShared.pan ?? { x: 0, y: 0 },
                },
            };
            if (!validatedSpaces[spaceId].sharedState.lines) validatedSpaces[spaceId].sharedState.lines = [];
            if (validatedSpaces[spaceId].sharedState.strokeWidth === undefined) validatedSpaces[spaceId].sharedState.strokeWidth = 3;
            if (!validatedSpaces[spaceId].sharedState.color) validatedSpaces[spaceId].sharedState.color = '#000000';
            if (validatedSpaces[spaceId].sharedState.zoom === undefined) validatedSpaces[spaceId].sharedState.zoom = 1;
            if (!validatedSpaces[spaceId].sharedState.pan) validatedSpaces[spaceId].sharedState.pan = { x: 0, y: 0 };
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
