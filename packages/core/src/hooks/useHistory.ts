import { useCallback, useMemo } from 'react';
import {
    hasFutureEntriesForSpace,
    hasPastEntriesForSpace,
    redo,
    undo
} from '../store/slices/historySlice';
import { useAppDispatch, useAppSelector } from './index';

declare global {
    interface Window {
        store: any;
    }
}

// Interface pour une action d'historique
interface HistoryAction {
    id: string;
    type: string;
    timestamp: number;
    metadata?: {
        spaceId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

export function useHistory() {
    const dispatch = useAppDispatch();

    // Ces sélecteurs globaux sont-ils encore corrects avec l'état par espace ?
    // Il faudrait des sélecteurs globaux qui agrègent l'état de tous les espaces.
    // Pour l'instant, on les commente ou les met à false/0.
    // const canUndo = useAppSelector(selectCanUndo);
    // const canRedo = useAppSelector(selectCanRedo);
    // const historyLength = useAppSelector(selectHistoryLength);
    // const actions = useAppSelector(selectHistoryActions);
    const canUndo = false; // Placeholder
    const canRedo = false; // Placeholder
    const historyLength = 0; // Placeholder
    const actions: HistoryAction[] = []; // Placeholder

    const globalState = useAppSelector(state => state);

    // Logs simplifiés et conditionnels (désactivés en production)
    const DEBUG_MODE = process.env.NODE_ENV === 'development';

    if (DEBUG_MODE) {
        console.log('ÉTAT HISTORIQUE - canUndo:', canUndo, 'canRedo:', canRedo, 'longueur:', historyLength);
    }

    /**
     * Vérifie si une action d'annulation est possible pour un espace spécifique
     * @param spaceId ID de l'espace à vérifier
     */
    const canUndoForSpace = useCallback((spaceId: string | null): boolean => {
        // Utiliser le nouveau sélecteur avec spaceId
        return hasPastEntriesForSpace(globalState, spaceId);
    }, [globalState]);

    /**
     * Vérifie si une action de rétablissement est possible pour un espace spécifique
     * @param spaceId ID de l'espace à vérifier
     */
    const canRedoForSpace = useCallback((spaceId: string | null): boolean => {
        // Utiliser le nouveau sélecteur avec spaceId
        return hasFutureEntriesForSpace(globalState, spaceId);
    }, [globalState]);

    /**
     * Annule la dernière action pour un espace spécifique
     * @param spaceId ID de l'espace spécifique
     */
    const handleUndo = useCallback((spaceId?: string) => {
        // L'undo global n'est plus géré simplement ici
        if (!spaceId) {
            console.warn('handleUndo appelé sans spaceId, opération ignorée.');
            return;
        }

        if (DEBUG_MODE) {
            console.log('UNDO appelé pour spaceId:', spaceId);
        }

        // Vérifier avec le nouveau sélecteur
        const hasEntries = hasPastEntriesForSpace(globalState, spaceId);
        if (DEBUG_MODE) {
            console.log('  => Space', spaceId, 'a des entrées passées:', hasEntries);
        }

        if (hasEntries) {
            // Dispatcher avec spaceId
            dispatch(undo({ spaceId }));
        }
    }, [dispatch, globalState, DEBUG_MODE]);

    /**
     * Rétablit la dernière action annulée pour un espace spécifique
     * @param spaceId ID de l'espace spécifique
     */
    const handleRedo = useCallback((spaceId?: string) => {
        // Le redo global n'est plus géré simplement ici
        if (!spaceId) {
            console.warn('handleRedo appelé sans spaceId, opération ignorée.');
            return;
        }

        if (DEBUG_MODE) {
            console.log('REDO appelé pour spaceId:', spaceId);
        }

        // Vérifier avec le nouveau sélecteur
        const hasEntries = hasFutureEntriesForSpace(globalState, spaceId);
        if (DEBUG_MODE) {
            console.log('  => Space', spaceId, 'a des entrées futures:', hasEntries);
        }

        if (hasEntries) {
            // Dispatcher avec spaceId
            dispatch(redo({ spaceId }));
        }
    }, [dispatch, globalState, DEBUG_MODE]);

    /**
     * Récupère les actions par type (devrait peut-être aussi prendre un spaceId?)
     * Pour l'instant, retourne un tableau vide car `actions` global est un placeholder.
     * @param type Type d'action à filtrer
     */
    const getActionsByType = useCallback((type: string) => {
        console.warn('getActionsByType n\'est pas implémenté pour l\'historique par espace.');
        return []; // Placeholder
        // return actions.filter((action: HistoryAction) => action.type.startsWith(type));
    }, [/* actions */]);

    /**
     * Récupère l'historique pour un espace spécifique
     * @param spaceId ID de l'espace
     */
    const getHistoryForSpace = useCallback((spaceId: string | null) => {
        if (!spaceId) return { actions: [], canUndo: false, canRedo: false };

        if (DEBUG_MODE) {
            console.log('Récupération historique pour space', spaceId);
        }

        // Accéder à l'historique de l'espace spécifique
        const spaceHistory = globalState.history.spaces[spaceId];
        const pastActions = spaceHistory?.past || [];
        const futureActions = spaceHistory?.future || [];

        // Utiliser les nouveaux sélecteurs
        const canUndoSpace = hasPastEntriesForSpace(globalState, spaceId);
        const canRedoSpace = hasFutureEntriesForSpace(globalState, spaceId);

        return {
            actions: [...pastActions, ...futureActions], // Ou juste pastActions? dépend du besoin
            canUndo: canUndoSpace,
            canRedo: canRedoSpace
        };
    }, [globalState, DEBUG_MODE]);

    // Mettre à jour l'objet retourné avec les nouvelles fonctions/noms
    return useMemo(() => ({
        canUndo, // Global (placeholder)
        canRedo, // Global (placeholder)
        canUndoForSpace, // Nouveau nom
        canRedoForSpace, // Nouveau nom
        historyLength, // Global (placeholder)
        actions, // Global (placeholder)
        undo: handleUndo, // Gère maintenant spaceId
        redo: handleRedo, // Gère maintenant spaceId
        getActionsByType, // Adapté (placeholder)
        getHistoryForSpace, // Nouveau nom
    }), [
        canUndo, canRedo, canUndoForSpace, canRedoForSpace, historyLength, actions,
        handleUndo, handleRedo, getActionsByType, getHistoryForSpace
    ]);
} 
