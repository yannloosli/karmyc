import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { generateDiff, applyDiff, invertDiff } from '../utils/history';
import { 
    THistoryDiff, 
    EnhancedSpaceSharedState, 
    EnhancedHistoryAction, 
    Diff,
    HistoryResult,
    HistoryStats,
    HISTORY_ACTION_TYPES,
    HISTORY_EVENTS,
    DEFAULT_HISTORY_CONFIG
} from '../types/historyTypes';
import { v4 as uuidv4 } from 'uuid';

// ============================================================================
// TYPES LEGACY (à déprécier progressivement)
// ============================================================================

/**
 * État partagé d'un espace (space) - LEGACY
 * @deprecated Use EnhancedSpaceSharedState instead
 */
export interface SpaceSharedState {
    pastDiffs: THistoryDiff[];
    futureDiffs: THistoryDiff[];
    actionType?: string;
    payload?: Record<string, any>;
}

export interface Space {
    id: string;
    name: string;
    color?: string;
    description?: string;
    sharedState: EnhancedSpaceSharedState; // Mise à jour vers le nouveau système
}

export interface SpaceState {
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    openSpaceIds: string[]; // Liste des IDs des espaces ouverts
    errors: string[];
    pilotMode: 'MANUAL' | 'AUTO'; // Nouveau champ pour le mode de pilotage
}

export interface SpaceActions {
    addSpace: (spaceData: { name: string; description?: string; color?: string; sharedState?: Partial<Omit<EnhancedSpaceSharedState, 'pastActions' | 'futureActions'>> }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    setPilotMode: (mode: 'MANUAL' | 'AUTO') => void; // Nouvelle action
    openSpace: (id: string) => void; // Nouvelle action pour ouvrir un space
    closeSpace: (id: string) => void; // Nouvelle action pour fermer un space
    updateSpace: (spaceData: Partial<Space> & { id: string }) => void;
    updateSpaceGenericSharedState: (payload: { spaceId: string; changes: Partial<Omit<EnhancedSpaceSharedState, 'pastActions' | 'futureActions'>> }) => void;
    clearErrors: () => void;
    
    // Actions d'historique améliorées
    startAction: (spaceId: string, actionId: string) => HistoryResult;
    submitAction: (spaceId: string, name: string, diffs?: Diff[], allowIndexShift?: boolean, modifiedKeys?: string[]) => HistoryResult;
    cancelAction: (spaceId: string) => HistoryResult;
    undoEnhanced: (spaceId: string) => HistoryResult;
    redoEnhanced: (spaceId: string) => HistoryResult;
    
    // Gestion des sélections
    setSelectionState: (spaceId: string, selectionState: any) => void;
    
    // Notifications
    subscribeToHistory: (spaceId: string, subscriber: (action: EnhancedHistoryAction) => void) => () => void;
    
    // Utilitaires
    canUndo: (spaceId: string) => boolean;
    canRedo: (spaceId: string) => boolean;
    getCurrentAction: (spaceId: string) => EnhancedHistoryAction | null;
    getHistoryLength: (spaceId: string) => number;
    getHistoryStats: (spaceId: string) => HistoryStats;
    clearHistory: (spaceId: string) => void;
    migrateSpaceHistory: (spaceId: string) => void;
    
    // Actions legacy (à déprécier)
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

    // =========================================================================
    // TIME TRAVEL: JUMP TO ACTION
    // =========================================================================
    jumpToHistoryAction: (spaceId: string, actionId: string) => void;
}

export type SpaceStateType = SpaceState & SpaceActions;

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Créer un état partagé d'espace amélioré par défaut
 */
const createDefaultEnhancedSharedState = (): EnhancedSpaceSharedState => ({
    currentState: {},
    pastActions: [],
    futureActions: [],
    isActionInProgress: false,
    currentActionId: null,
    actionMetadata: {},
    subscribers: [],
});

/**
 * Créer une action d'historique améliorée
 */
const createEnhancedHistoryAction = (
    id: string,
    name: string,
    diffs: Diff[] = [],
    state: any,
    allowIndexShift: boolean = false,
    modifiedKeys: string[] = []
): EnhancedHistoryAction => ({
    id,
    name,
    timestamp: Date.now(),
    diffs,
    state,
    allowIndexShift,
    modifiedRelated: modifiedKeys.includes('selection'),
    metadata: {
        actionType: name,
        payload: {},
        duration: 0,
    },
    indexDirection: 1,
});

/**
 * Notifier les subscribers d'un changement d'historique
 */
const notifySubscribers = (space: Space, action: EnhancedHistoryAction) => {
    space.sharedState.subscribers.forEach(subscriber => {
        try {
            subscriber(action);
        } catch (error) {
            console.error('Error in history subscriber:', error);
        }
    });
};

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
                    
                    // ============================================================================
                    // ACTIONS DE BASE
                    // ============================================================================
                    
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
                            color: spaceData.color ?? '#000000',
                            sharedState: {
                                ...createDefaultEnhancedSharedState(),
                                ...(spaceData.sharedState || {}),
                            },
                        };
                        set(state => {
                            state.spaces[newId] = newSpace;
                            state.openSpaceIds.push(newId);
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
                    
                    // ============================================================================
                    // ACTIONS D'HISTORIQUE AMÉLIORÉES
                    // ============================================================================
                    
                    startAction: (spaceId: string, actionId: string): HistoryResult => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                success: false,
                                error: `Space with ID ${spaceId} not found`,
                            };
                        }
                        
                        if (space.sharedState.isActionInProgress) {
                            return {
                                success: false,
                                error: 'Another action is already in progress',
                            };
                        }
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                currentSpace.sharedState.isActionInProgress = true;
                                currentSpace.sharedState.currentActionId = actionId;
                                currentSpace.sharedState.currentState = { ...currentSpace.sharedState.currentState };
                            }
                        });
                        
                        return {
                            success: true,
                            metadata: { actionId },
                        };
                    },
                    
                    submitAction: (spaceId: string, name: string, diffs: Diff[] = [], allowIndexShift: boolean = false, modifiedKeys: string[] = []): HistoryResult => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                success: false,
                                error: `Space with ID ${spaceId} not found`,
                            };
                        }
                        
                        if (!space.sharedState.isActionInProgress) {
                            return {
                                success: false,
                                error: 'No action in progress to submit',
                            };
                        }
                        
                        const historyAction = createEnhancedHistoryAction(
                            space.sharedState.currentActionId!,
                            name,
                            diffs,
                            space.sharedState.currentState,
                            allowIndexShift,
                            modifiedKeys
                        );
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                // Supprimer l'historique après l'index actuel
                                currentSpace.sharedState.pastActions.push(historyAction);
                                currentSpace.sharedState.futureActions = [];
                                currentSpace.sharedState.isActionInProgress = false;
                                currentSpace.sharedState.currentActionId = null;
                                
                                // Limiter la taille de l'historique
                                if (currentSpace.sharedState.pastActions.length > DEFAULT_HISTORY_CONFIG.maxHistorySize!) {
                                    currentSpace.sharedState.pastActions.shift();
                                }
                            }
                        });
                        
                        // Notifier les subscribers
                        notifySubscribers(space, historyAction);
                        
                        return {
                            success: true,
                            action: historyAction,
                        };
                    },
                    
                    cancelAction: (spaceId: string): HistoryResult => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                success: false,
                                error: `Space with ID ${spaceId} not found`,
                            };
                        }
                        
                        if (!space.sharedState.isActionInProgress) {
                            return {
                                success: false,
                                error: 'No action in progress to cancel',
                            };
                        }
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                currentSpace.sharedState.isActionInProgress = false;
                                currentSpace.sharedState.currentActionId = null;
                            }
                        });
                        
                        return {
                            success: true,
                        };
                    },
                    
                    undoEnhanced: (spaceId: string): HistoryResult => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                success: false,
                                error: `Space with ID ${spaceId} not found`,
                            };
                        }
                        
                        console.log(`[undoEnhanced] Début pour space ${spaceId}:`, {
                            pastActionsLength: space.sharedState.pastActions?.length || 0,
                            futureActionsLength: space.sharedState.futureActions?.length || 0,
                            pastActions: space.sharedState.pastActions,
                            futureActions: space.sharedState.futureActions
                        });
                        
                        // Vérification de sécurité pour s'assurer que pastActions est un tableau
                        if (!Array.isArray(space.sharedState.pastActions)) {
                            console.warn(`Space ${spaceId} has invalid pastActions, initializing...`);
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = [];
                                    currentSpace.sharedState.futureActions = [];
                                }
                            });
                            return {
                                success: false,
                                error: 'History was corrupted, please try again',
                            };
                        }
                        
                        if (space.sharedState.pastActions.length === 0) {
                            console.log(`[undoEnhanced] Aucune action à annuler pour space ${spaceId}`);
                            return {
                                success: false,
                                error: 'No actions to undo',
                            };
                        }
                        
                        // Vérification supplémentaire avant pop()
                        const pastActions = space.sharedState.pastActions;
                        if (!Array.isArray(pastActions) || pastActions.length === 0) {
                            console.error(`Space ${spaceId} has invalid pastActions after validation:`, pastActions);
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = [];
                                    currentSpace.sharedState.futureActions = [];
                                }
                            });
                            return {
                                success: false,
                                error: 'History was corrupted, please try again',
                            };
                        }
                        
                        // Utiliser une approche plus sûre au lieu de pop()
                        const lastIndex = pastActions.length - 1;
                        const actionToUndo = pastActions[lastIndex];
                        if (!actionToUndo) {
                            console.error(`Space ${spaceId} failed to get action from pastActions at index ${lastIndex}`);
                            return {
                                success: false,
                                error: 'Failed to retrieve action for undo',
                            };
                        }
                        
                        console.log(`[undoEnhanced] Action à annuler:`, actionToUndo);
                        console.log(`[undoEnhanced] État à restaurer:`, actionToUndo.state);
                        
                        // Créer un nouveau tableau sans l'élément au lieu de modifier l'existant
                        const newPastActions = pastActions.slice(0, lastIndex);
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                currentSpace.sharedState.pastActions = newPastActions;
                                currentSpace.sharedState.currentState = actionToUndo.state;
                                if (!Array.isArray(currentSpace.sharedState.futureActions)) {
                                    currentSpace.sharedState.futureActions = [];
                                }
                                currentSpace.sharedState.futureActions.push(actionToUndo);
                            }
                        });
                        
                        console.log(`[undoEnhanced] Après undo pour space ${spaceId}:`, {
                            newPastActionsLength: newPastActions.length,
                            futureActionsLength: get().spaces[spaceId]?.sharedState?.futureActions?.length || 0,
                            restoredState: get().spaces[spaceId]?.sharedState?.currentState
                        });
                        
                        // Notifier les subscribers
                        notifySubscribers(space, actionToUndo);
                        
                        return {
                            success: true,
                            action: actionToUndo,
                        };
                    },
                    
                    redoEnhanced: (spaceId: string): HistoryResult => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                success: false,
                                error: `Space with ID ${spaceId} not found`,
                            };
                        }
                        
                        console.log(`[redoEnhanced] Début pour space ${spaceId}:`, {
                            pastActionsLength: space.sharedState.pastActions?.length || 0,
                            futureActionsLength: space.sharedState.futureActions?.length || 0,
                            pastActions: space.sharedState.pastActions,
                            futureActions: space.sharedState.futureActions
                        });
                        
                        // Vérification de sécurité pour s'assurer que futureActions est un tableau
                        if (!Array.isArray(space.sharedState.futureActions)) {
                            console.warn(`Space ${spaceId} has invalid futureActions, initializing...`);
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = [];
                                    currentSpace.sharedState.futureActions = [];
                                }
                            });
                            return {
                                success: false,
                                error: 'History was corrupted, please try again',
                            };
                        }
                        
                        if (space.sharedState.futureActions.length === 0) {
                            console.log(`[redoEnhanced] Aucune action à refaire pour space ${spaceId}`);
                            return {
                                success: false,
                                error: 'No actions to redo',
                            };
                        }
                        
                        // Vérification supplémentaire avant pop()
                        const futureActions = space.sharedState.futureActions;
                        if (!Array.isArray(futureActions) || futureActions.length === 0) {
                            console.error(`Space ${spaceId} has invalid futureActions after validation:`, futureActions);
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = [];
                                    currentSpace.sharedState.futureActions = [];
                                }
                            });
                            return {
                                success: false,
                                error: 'History was corrupted, please try again',
                            };
                        }
                        
                        // Utiliser une approche plus sûre au lieu de pop()
                        const lastIndex = futureActions.length - 1;
                        const actionToRedo = futureActions[lastIndex];
                        if (!actionToRedo) {
                            console.error(`Space ${spaceId} failed to get action from futureActions at index ${lastIndex}`);
                            return {
                                success: false,
                                error: 'Failed to retrieve action for redo',
                            };
                        }
                        
                        console.log(`[redoEnhanced] Action à refaire:`, actionToRedo);
                        
                        // Utiliser l'état après les modifications pour le redo
                        const stateToRestore = actionToRedo.metadata?.nextState || actionToRedo.state;
                        console.log(`[redoEnhanced] État à restaurer pour redo:`, stateToRestore);
                        
                        // Créer un nouveau tableau sans l'élément au lieu de modifier l'existant
                        const newFutureActions = futureActions.slice(0, lastIndex);
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                currentSpace.sharedState.futureActions = newFutureActions;
                                currentSpace.sharedState.currentState = stateToRestore; // Restaurer l'état après les modifications
                                if (!Array.isArray(currentSpace.sharedState.pastActions)) {
                                    currentSpace.sharedState.pastActions = [];
                                }
                                currentSpace.sharedState.pastActions.push(actionToRedo);
                            }
                        });
                        
                        console.log(`[redoEnhanced] Après redo pour space ${spaceId}:`, {
                            pastActionsLength: get().spaces[spaceId]?.sharedState?.pastActions?.length || 0,
                            newFutureActionsLength: newFutureActions.length
                        });
                        
                        // Notifier les subscribers
                        notifySubscribers(space, actionToRedo);
                        
                        return {
                            success: true,
                            action: actionToRedo,
                        };
                    },
                    
                    // ============================================================================
                    // GESTION DES SÉLECTIONS
                    // ============================================================================
                    
                    setSelectionState: (spaceId: string, selectionState: any) => {
                        set(state => {
                            const space = state.spaces[spaceId];
                            if (space) {
                                space.sharedState.selectionState = selectionState;
                            }
                        });
                    },
                    
                    // ============================================================================
                    // NOTIFICATIONS
                    // ============================================================================
                    
                    subscribeToHistory: (spaceId: string, subscriber: (action: EnhancedHistoryAction) => void) => {
                        set(state => {
                            const space = state.spaces[spaceId];
                            if (space) {
                                space.sharedState.subscribers.push(subscriber);
                            }
                        });
                        
                        // Retourner une fonction de désabonnement
                        return () => {
                            set(state => {
                                const space = state.spaces[spaceId];
                                if (space) {
                                    space.sharedState.subscribers = space.sharedState.subscribers.filter(
                                        sub => sub !== subscriber
                                    );
                                }
                            });
                        };
                    },
                    
                    // ============================================================================
                    // UTILITAIRES
                    // ============================================================================
                    
                    canUndo: (spaceId: string): boolean => {
                        const space = get().spaces[spaceId];
                        if (!space) return false;
                        
                        // Migration automatique si nécessaire
                        if (!Array.isArray(space.sharedState.pastActions)) {
                            get().migrateSpaceHistory(spaceId);
                            return false;
                        }
                        
                        return space.sharedState.pastActions.length > 0;
                    },
                    
                    canRedo: (spaceId: string): boolean => {
                        const space = get().spaces[spaceId];
                        if (!space) return false;
                        
                        // Migration automatique si nécessaire
                        if (!Array.isArray(space.sharedState.futureActions)) {
                            get().migrateSpaceHistory(spaceId);
                            return false;
                        }
                        
                        return space.sharedState.futureActions.length > 0;
                    },
                    
                    getCurrentAction: (spaceId: string): EnhancedHistoryAction | null => {
                        const space = get().spaces[spaceId];
                        if (!space || !space.sharedState.currentActionId) {
                            return null;
                        }
                        
                        // Trouver l'action en cours dans l'historique
                        return space.sharedState.pastActions.find(
                            action => action.id === space.sharedState.currentActionId
                        ) || null;
                    },
                    
                    getHistoryLength: (spaceId: string): number => {
                        const space = get().spaces[spaceId];
                        return space ? space.sharedState.pastActions.length : 0;
                    },
                    
                    getHistoryStats: (spaceId: string): HistoryStats => {
                        const space = get().spaces[spaceId];
                        if (!space) {
                            return {
                                totalActions: 0,
                                pastActions: 0,
                                futureActions: 0,
                                memoryUsage: 0,
                                lastActionTime: 0,
                                averageActionDuration: 0,
                            };
                        }
                        
                        const { pastActions, futureActions } = space.sharedState;
                        const totalActions = pastActions.length + futureActions.length;
                        const lastAction = pastActions[pastActions.length - 1];
                        
                        return {
                            totalActions,
                            pastActions: pastActions.length,
                            futureActions: futureActions.length,
                            memoryUsage: JSON.stringify(space.sharedState).length,
                            lastActionTime: lastAction?.timestamp || 0,
                            averageActionDuration: totalActions > 0 
                                ? pastActions.reduce((sum, action) => sum + (action.metadata.duration || 0), 0) / totalActions
                                : 0,
                        };
                    },
                    
                    clearHistory: (spaceId: string) => {
                        set(state => {
                            const space = state.spaces[spaceId];
                            if (space) {
                                space.sharedState.pastActions = [];
                                space.sharedState.futureActions = [];
                                space.sharedState.isActionInProgress = false;
                                space.sharedState.currentActionId = null;
                            }
                        });
                    },
                    
                    // Fonction de migration pour corriger les espaces corrompus
                    migrateSpaceHistory: (spaceId: string) => {
                        set(state => {
                            const space = state.spaces[spaceId];
                            if (space) {
                                // S'assurer que les tableaux d'historique sont correctement initialisés
                                if (!Array.isArray(space.sharedState.pastActions)) {
                                    space.sharedState.pastActions = [];
                                }
                                if (!Array.isArray(space.sharedState.futureActions)) {
                                    space.sharedState.futureActions = [];
                                }
                                
                                // S'assurer que les autres propriétés sont initialisées
                                if (typeof space.sharedState.isActionInProgress !== 'boolean') {
                                    space.sharedState.isActionInProgress = false;
                                }
                                if (space.sharedState.currentActionId === undefined) {
                                    space.sharedState.currentActionId = null;
                                }
                                if (!space.sharedState.currentState) {
                                    space.sharedState.currentState = {};
                                }
                                if (!space.sharedState.actionMetadata) {
                                    space.sharedState.actionMetadata = {};
                                }
                                if (!Array.isArray(space.sharedState.subscribers)) {
                                    space.sharedState.subscribers = [];
                                }
                                
                                console.log(`Space ${spaceId} history migrated successfully`);
                            }
                        });
                    },
                    
                    clearErrors: () => {
                        set(state => {
                            state.errors = [];
                        });
                    },
                    
                    // ============================================================================
                    // ACTIONS LEGACY (à déprécier)
                    // ============================================================================
                    
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
            
                        const prevState = space.sharedState.currentState;
                        const actionType = (changes as any).actionType || 'UPDATE_SHARED_STATE';
                        const actionPayload = (changes as any).payload || {};
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                const { actionType, payload, ...actualChanges } = changes as any;
                                currentSpace.sharedState.currentState = { 
                                    ...currentSpace.sharedState.currentState, 
                                    ...actualChanges 
                                };
                                state.errors = [];
                            }
                        });
                        
                        const nextState = get().spaces[spaceId]?.sharedState.currentState;
            
                        if (!nextState) {
                            console.error("Shared state update failed: Space disappeared after update?");
                            return;
                        }
                        
                        console.log(`[updateSpaceGenericSharedState] Création d'action pour space ${spaceId}:`, {
                            actionType,
                            actionPayload,
                            prevState,
                            nextState,
                            pastActionsLength: space.sharedState.pastActions?.length || 0,
                            futureActionsLength: space.sharedState.futureActions?.length || 0
                        });
                        
                        // Créer une action d'historique améliorée avec l'état avant ET après
                        const historyAction = createEnhancedHistoryAction(
                            `${actionType}-${Date.now()}`,
                            actionType,
                            [], // Diffs à implémenter
                            prevState, // État AVANT les modifications (pour undo)
                            false,
                            []
                        );
                        
                        // Ajouter l'état après les modifications dans les métadonnées
                        historyAction.metadata = {
                            ...historyAction.metadata,
                            nextState: nextState // État APRÈS les modifications (pour redo)
                        };
                        
                        console.log(`[updateSpaceGenericSharedState] Action créée:`, historyAction);
                        
                        set(state => {
                            const currentSpace = state.spaces[spaceId];
                            if (currentSpace) {
                                currentSpace.sharedState.pastActions.push(historyAction);
                                currentSpace.sharedState.futureActions = [];
                            }
                        });
                        
                        console.log(`[updateSpaceGenericSharedState] Après ajout pour space ${spaceId}:`, {
                            pastActionsLength: get().spaces[spaceId]?.sharedState?.pastActions?.length || 0,
                            futureActionsLength: get().spaces[spaceId]?.sharedState?.futureActions?.length || 0
                        });
                    },
                    
                    undoSharedState: (spaceId: string) => {
                        const result = get().undoEnhanced(spaceId);
                        if (!result.success) {
                            console.error('Undo failed:', result.error);
                        }
                    },
                    
                    redoSharedState: (spaceId: string) => {
                        const result = get().redoEnhanced(spaceId);
                        if (!result.success) {
                            console.error('Redo failed:', result.error);
                        }
                    },
                    
                    // =========================================================================
                    // TIME TRAVEL: JUMP TO ACTION
                    // =========================================================================
                    jumpToHistoryAction: (spaceId: string, actionId: string) => {
                        const space = get().spaces[spaceId];
                        if (!space) return;
                        const past = space.sharedState.pastActions || [];
                        const future = space.sharedState.futureActions || [];

                        // Chercher dans pastActions
                        let idx = past.findIndex(a => a.id === actionId);
                        if (idx !== -1) {
                            // L'action est dans le passé
                            const newPast = past.slice(0, idx + 1);
                            const newFuture = [...past.slice(idx + 1), ...future];
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = newPast;
                                    currentSpace.sharedState.futureActions = newFuture;
                                    currentSpace.sharedState.currentState = past[idx].state;
                                }
                            });
                            return;
                        }

                        // Chercher dans futureActions
                        idx = future.findIndex(a => a.id === actionId);
                        if (idx !== -1) {
                            // L'action est dans le futur
                            const newPast = [...past, ...future.slice(0, idx + 1)];
                            const newFuture = future.slice(idx + 1);
                            set(state => {
                                const currentSpace = state.spaces[spaceId];
                                if (currentSpace) {
                                    currentSpace.sharedState.pastActions = newPast;
                                    currentSpace.sharedState.futureActions = newFuture;
                                    currentSpace.sharedState.currentState = future[idx].state;
                                }
                            });
                        }
                    },
                    
                    // ============================================================================
                    // SELECTORS
                    // ============================================================================
                    
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
                        const spacesToPersist: Record<string, Partial<Omit<Space, 'sharedState'>> & { sharedState: Partial<Omit<EnhancedSpaceSharedState, 'pastActions' | 'futureActions' | 'subscribers'>> }> = {};
                        for (const spaceId in state.spaces) {
                            const { sharedState, ...restOfSpace } = state.spaces[spaceId];
                            const { pastActions, futureActions, subscribers, ...restOfSharedState } = sharedState ?? {};
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
                        const loadedState = persistedState as Partial<SpaceStateType>;
                        const validatedSpaces: Record<string, Space> = {};
                        const spacesFromStorage = loadedState?.spaces ?? {};
            
                        const baseSpaces = currentState.spaces;
                        const allSpaceIds = new Set([...Object.keys(spacesFromStorage), ...Object.keys(baseSpaces)]);
            
                        for (const spaceId of allSpaceIds) {
                            const spaceFromStorage = spacesFromStorage[spaceId];
                            const spaceFromCode = baseSpaces[spaceId];
            
                            if (!spaceFromStorage && !spaceFromCode) continue;
            
                            const baseShared = spaceFromCode?.sharedState ?? createDefaultEnhancedSharedState();
                            const loadedShared = spaceFromStorage?.sharedState ?? {};
            
                            validatedSpaces[spaceId] = {
                                id: spaceFromStorage?.id ?? spaceFromCode?.id ?? spaceId,
                                name: spaceFromStorage?.name ?? spaceFromCode?.name ?? `Space ${spaceId}`,
                                description: spaceFromStorage?.description ?? spaceFromCode?.description ?? '',
                                color: spaceFromStorage?.color ?? spaceFromCode?.color ?? '#0000ff',
                                sharedState: {
                                    ...baseShared,
                                    ...loadedShared,
                                    pastActions: [],
                                    futureActions: [],
                                    subscribers: [],
                                },
                            };
                            if (!validatedSpaces[spaceId].color) validatedSpaces[spaceId].color = '#000000';
                        }
            
                        const finalState = {
                            ...currentState,
                            activeSpaceId: loadedState?.activeSpaceId ?? currentState.activeSpaceId,
                            spaces: validatedSpaces,
                            errors: [],
                        };
                        return finalState;
                    }
                }
            )
        )
    )
);
