/**
 * Middleware for managing action history
 * 
 * This middleware is responsible for:
 * 1. Intercepting actions to generate state differences
 * 2. Managing undo/redo history
 * 3. Visualizing state changes
 * 
 * @see docs/StoreReduxDesign.md - Section 4.2 History Middleware
 */
import { Action, Middleware } from '@reduxjs/toolkit';
import { updateArea } from '../slices/areaSlice';
import { addHistoryEntry } from '../slices/historySlice';

// Drapeau pour éviter de capturer les actions secondaires
let isPerformingHistoryAction = false;

// Liste des types d'actions qui doivent être enregistrés dans l'historique
const HISTORY_ACTION_TYPES = [
    'area/addArea',
    'area/removeArea',
    'area/updateArea',
    'area/moveArea',
    'area/resizeArea',
    'composition/update',
    'composition/addElement',
    'composition/removeElement',
    'composition/updateElement',
    'project/update',
];

// Fonction pour extraire l'ID de l'area à partir d'une action
function getAreaIdFromAction(action: any): string | null {
    if (!action || !action.type) return null;

    // Pour les actions area/updateArea, l'ID est dans action.payload.id
    if (action.type === 'area/updateArea' && action.payload && action.payload.id) {
        console.log('Middleware: action sur area', action.payload.id);
        return action.payload.id;
    }

    // Pour les autres types d'actions area
    if (action.type.startsWith('area/') && action.payload && action.payload.id) {
        return action.payload.id;
    }

    return null;
}

export const historyMiddleware: Middleware = store => next => (action: unknown) => {
    console.log('MIDDLEWARE HISTORY - Action reçue:', action);

    // Si c'est une action d'undo ou redo, il faut un traitement spécial
    if (typeof action === 'object' && action !== null && 'type' in action) {
        const actionType = (action as Action).type;

        if (actionType === 'history/undo') {
            console.log('Middleware: Action undo détectée');

            // Récupérer l'ID de l'area cible si spécifié
            const areaId = (action as any).payload?.areaId;
            console.log('Undo pour area:', areaId || 'global');

            // Exécuter l'action normale d'undo
            const result = next(action);

            // Restaurer les données après le undo
            const state = store.getState();
            console.log('MIDDLEWARE HISTORY - après undo, state.history:', state.history);

            if (state.history.future.length > 0) {
                // Si c'est un undo pour une area spécifique, chercher l'entrée correspondante
                let entryToRestore;

                if (areaId) {
                    // Chercher la dernière entrée dans le future pour cette area
                    const entryIndex = state.history.future.findIndex(
                        (entry: any) => entry.metadata?.areaId === areaId
                    );

                    if (entryIndex !== -1) {
                        entryToRestore = state.history.future[entryIndex];
                    }
                } else {
                    // Pour un undo global, prendre la première entrée du future
                    entryToRestore = state.history.future[0];
                }

                if (entryToRestore && entryToRestore.prevState && entryToRestore.prevState.area) {
                    // Éviter les enregistrements en cascade
                    isPerformingHistoryAction = true;

                    console.log('Restauration de l\'état après undo pour entry:', entryToRestore.name);

                    // Si l'action est pour une area spécifique, ne restaurer que cette area
                    if (areaId) {
                        // Restaurer uniquement l'état de l'area spécifiée, en préservant les autres
                        const areaState = entryToRestore.prevState.area.areas[areaId]?.state;
                        if (areaState) {
                            console.log('Restauration état spécifique pour area:', areaId);

                            // Récupérer l'état actuel de toutes les autres areas
                            const currentAreas = store.getState().area.areas;

                            // Construire un nouvel état qui préserve les autres areas
                            const updatedAreas = { ...currentAreas };

                            // Mettre à jour uniquement la zone spécifiée
                            store.dispatch(updateArea({
                                id: areaId,
                                changes: { state: areaState }
                            }));
                        }
                    } else {
                        // Pour un undo global, restaurer toutes les areas affectées
                        // mais préserver l'état des areas non concernées
                        const prevAreas = entryToRestore.prevState.area.areas;
                        const currentAreas = store.getState().area.areas;

                        // Mettre à jour uniquement les areas qui existaient dans l'état précédent
                        for (const id in prevAreas) {
                            if (prevAreas[id] && prevAreas[id].state) {
                                console.log('Restauration état pour area:', id);
                                store.dispatch(updateArea({
                                    id,
                                    changes: { state: prevAreas[id].state }
                                }));
                            }
                        }
                    }

                    isPerformingHistoryAction = false;
                }
            }

            return result;
        }

        if (actionType === 'history/redo') {
            console.log('Middleware: Action redo détectée');

            // Récupérer l'ID de l'area cible si spécifié
            const areaId = (action as any).payload?.areaId;
            console.log('Rétablissement pour area:', areaId || 'global');

            // Exécuter l'action normale de redo
            const result = next(action);

            // Restaurer les données après le redo
            const state = store.getState();

            if (state.history.past.length > 0) {
                // Si c'est un redo pour une area spécifique, chercher l'entrée correspondante
                let entryToRestore;

                if (areaId) {
                    // Chercher la dernière entrée dans le past pour cette area
                    const pastEntries = [...state.history.past].reverse();
                    const entryIndex = pastEntries.findIndex(
                        (entry: any) => entry.metadata?.areaId === areaId
                    );

                    if (entryIndex !== -1) {
                        entryToRestore = pastEntries[entryIndex];
                    }
                } else {
                    // Pour un redo global, prendre la dernière entrée du past
                    entryToRestore = state.history.past[state.history.past.length - 1];
                }

                if (entryToRestore && entryToRestore.nextState && entryToRestore.nextState.area) {
                    // Éviter les enregistrements en cascade
                    isPerformingHistoryAction = true;

                    console.log('Restauration de l\'état après redo pour entry:', entryToRestore.name);

                    // Si l'action est pour une area spécifique, ne restaurer que cette area
                    if (areaId) {
                        // Restaurer uniquement l'état de l'area spécifiée, en préservant les autres
                        const areaState = entryToRestore.nextState.area.areas[areaId]?.state;
                        if (areaState) {
                            console.log('Restauration état spécifique pour area:', areaId);

                            // Récupérer l'état actuel de toutes les autres areas
                            const currentAreas = store.getState().area.areas;

                            // Construire un nouvel état qui préserve les autres areas
                            const updatedAreas = { ...currentAreas };

                            // Mettre à jour uniquement la zone spécifiée
                            store.dispatch(updateArea({
                                id: areaId,
                                changes: { state: areaState }
                            }));
                        }
                    } else {
                        // Pour un redo global, restaurer toutes les areas affectées
                        // mais préserver l'état des areas non concernées
                        const nextAreas = entryToRestore.nextState.area.areas;
                        const currentAreas = store.getState().area.areas;

                        // Mettre à jour uniquement les areas qui existaient dans l'état futur
                        for (const id in nextAreas) {
                            if (nextAreas[id] && nextAreas[id].state) {
                                console.log('Restauration état pour area:', id);
                                store.dispatch(updateArea({
                                    id,
                                    changes: { state: nextAreas[id].state }
                                }));
                            }
                        }
                    }

                    isPerformingHistoryAction = false;
                }
            }

            return result;
        }
    }

    // Si nous sommes en train de traiter une action d'historique, ne pas l'enregistrer
    if (isPerformingHistoryAction) {
        return next(action);
    }

    // Capture state before action execution
    const prevState = store.getState();

    // Execute the action normally
    const result = next(action);

    // Capture state after action execution
    const nextState = store.getState();

    // Check if this action should be recorded in history
    if (typeof action === 'object' && action !== null && 'type' in action) {
        const actionType = (action as Action).type;

        // Only record specific action types 
        if (HISTORY_ACTION_TYPES.some(type => actionType.startsWith(type))) {
            console.log('Enregistrement action dans l\'historique:', actionType);

            // Récupérer l'ID de l'area concernée par cette action
            const areaId = getAreaIdFromAction(action);
            if (areaId) {
                console.log('  => Action pour area:', areaId);
            }

            // Create a history entry with area metadata
            console.log('MIDDLEWARE HISTORY - Dispatch addHistoryEntry pour action:', actionType);

            store.dispatch(addHistoryEntry({
                name: actionType,
                timestamp: Date.now(),
                prevState: prevState,
                nextState: nextState,
                metadata: {
                    areaId: areaId || undefined  // Éviter les valeurs null
                }
            }));

            // Vérifier l'état après l'ajout
            console.log('MIDDLEWARE HISTORY - État après ajout:', store.getState().history);
        }
    }

    return result;
}; 
