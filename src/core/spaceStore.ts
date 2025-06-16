import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { generateDiff, applyDiff, invertDiff } from '../utils/history';
import { THistoryDiff } from '../types/historyTypes';
import { v4 as uuidv4 } from 'uuid';

export interface SpaceSharedState extends Record<string, any> {
    pastDiffs: THistoryDiff[];
    futureDiffs: THistoryDiff[];
}

export interface Space {
    id: string;
    name: string;
    color: string;
    /**
     * Optional description for the space (user-defined, can be empty).
     */
    description?: string;
    sharedState: SpaceSharedState;
}

export interface SpaceState {
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    openSpaceIds: string[]; // Liste des IDs des espaces ouverts
    errors: string[];
    pilotMode: 'MANUAL' | 'AUTO'; // Nouveau champ pour le mode de pilotage
}

export interface SpaceActions {
    addSpace: (spaceData: { name: string; description?: string; sharedState?: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    setPilotMode: (mode: 'MANUAL' | 'AUTO') => void; // Nouvelle action
    openSpace: (id: string) => void; // Nouvelle action pour ouvrir un space
    closeSpace: (id: string) => void; // Nouvelle action pour fermer un space
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
    getOpenSpaces: () => Space[]; // Nouveau sélecteur pour obtenir la liste des espaces ouverts
    getSpaceErrors: () => string[];
    getPilotMode: () => 'MANUAL' | 'AUTO'; // Nouveau sélecteur
}

export type SpaceStateType = SpaceState & SpaceActions;

export const useSpaceStore = create<SpaceStateType>()(
    immer(
        devtools(
            persist(
                (set, get) => ({
                    spaces: {},
                    activeSpaceId: null,
                    openSpaceIds: [],
                    errors: [],
                    pilotMode: 'AUTO',
                    // Actions with logs
                    addSpace: (spaceData) => {
                        if (!spaceData.name) {
                            set(state => {
                                state.errors = ["Space name cannot be empty."];
                            });
                            console.error("Validation failed for space:", get().errors);
                            return undefined;
                        }
                        const newId = uuidv4();
                        const newSpace: Space = {
                            id: newId,
                            name: spaceData.name,
                            description: spaceData.description ?? '',
                            color: spaceData.sharedState?.color ?? '#ff0000',
                            sharedState: {
                                pastDiffs: [],
                                futureDiffs: [],
                                ...(spaceData.sharedState || {}),
                            },
                        };
                        set(state => {
                            state.spaces[newId] = newSpace;
                            state.openSpaceIds.push(newId); // Ajouter le nouvel espace à la liste des espaces ouverts
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
                            // Retirer l'espace de la liste des espaces ouverts
                            state.openSpaceIds = state.openSpaceIds.filter(spaceId => spaceId !== id);
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
                    setPilotMode: (mode) => {
                        set(state => {
                            state.pilotMode = mode;
                        });
                    },
                    openSpace: (id) => {
                        set(state => {
                            if (state.spaces[id] && !state.openSpaceIds.includes(id)) {
                                state.openSpaceIds.push(id);
                            }
                        });
                    },
                    closeSpace: (id) => {
                        set(state => {
                            state.openSpaceIds = state.openSpaceIds.filter(spaceId => spaceId !== id);
                            if (state.activeSpaceId === id) {
                                // Si on ferme l'espace actif, on active le dernier espace ouvert
                                state.activeSpaceId = state.openSpaceIds[state.openSpaceIds.length - 1] || null;
                            }
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
                        const actionType = changes.actionType || 'UPDATE_SHARED_STATE';
                        const actionPayload = changes.payload || {};
            
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                // Supprimer actionType et payload des changements avant de les appliquer
                                const { actionType, payload, ...actualChanges } = changes;
                                currentSpace.sharedState = { ...currentSpace.sharedState, ...actualChanges };
                                state.errors = [];
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
                                        actionType,
                                        // @ts-expect-error - payload is used in the next line
                                        payload: actionPayload,
                                        changes: diff,
                                    });
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
                    getOpenSpaces: () => {
                        const state = get();
                        return state.openSpaceIds
                            .map(id => state.spaces[id])
                            .filter((space): space is Space => space !== undefined);
                    },
                    getSpaceErrors: () => get().errors,
                    getPilotMode: () => get().pilotMode,
                }),
                {
                    name: 'karmyc-space-store',
                    partialize: (state: SpaceStateType) => {
                        const spacesToPersist: Record<string, Partial<Omit<Space, 'sharedState'>> & { sharedState: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>> }> = {};
                        for (const spaceId in state.spaces) {
                            const { sharedState, ...restOfSpace } = state.spaces[spaceId];
                            const { pastDiffs, futureDiffs, ...restOfSharedState } = sharedState ?? {};
                            spacesToPersist[spaceId] = {
                                ...restOfSpace,
                                sharedState: restOfSharedState
                            };
                        }
                        const { activeSpaceId } = state;
                        const result = { spaces: spacesToPersist, activeSpaceId };
                        return result;
                    },
                    merge: (persistedState: unknown, currentState: SpaceStateType): SpaceStateType => {
                        const loadedState = persistedState as Partial<SpaceStateType>; // Cast persisted state
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
                                color: spaceFromStorage?.color ?? spaceFromCode?.color ?? '#0000ff',
                                sharedState: {
                                    ...baseShared,
                                    ...loadedShared,
                                    pastDiffs: [],
                                    futureDiffs: [],
                                },
                            };
                            if (!validatedSpaces[spaceId].color) validatedSpaces[spaceId].color = '#000000';
                        }
            
                        // Return the fully merged state, prioritizing loaded simple values
                        const finalState = {
                            ...currentState, // Start with current state (functions, initial structure)
                            activeSpaceId: loadedState?.activeSpaceId ?? currentState.activeSpaceId,
                            spaces: validatedSpaces, // Use the carefully merged spaces
                            errors: [], // Always reset errors on load
                        };
                        return finalState;
                    }
                }
            )
        )
    )
);
