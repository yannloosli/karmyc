import { useCallback, useMemo } from 'react';
import {
    selectCanRedo,
    selectCanUndo,
    selectHistoryActions,
    selectHistoryLength,
} from '../history/selectors';
import {
    hasFutureEntriesForArea,
    hasPastEntriesForArea,
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
    diffsCount: number;
    metadata?: {
        areaId?: string;
        projectId?: string;
        userId?: string;
        duration?: number;
    };
}

export function useHistory() {
    const dispatch = useAppDispatch();

    // Utiliser les sélecteurs Redux correctement via useAppSelector
    const canUndo = useAppSelector(selectCanUndo);
    const canRedo = useAppSelector(selectCanRedo);
    const historyLength = useAppSelector(selectHistoryLength);
    const actions = useAppSelector(selectHistoryActions);

    // Accès direct à l'état global pour les sélecteurs spécifiques à une area
    const globalState = useAppSelector(state => state);

    // Logs simplifiés et conditionnels (désactivés en production)
    const DEBUG_MODE = process.env.NODE_ENV === 'development';

    if (DEBUG_MODE) {
        console.log('ÉTAT HISTORIQUE - canUndo:', canUndo, 'canRedo:', canRedo, 'longueur:', historyLength);
    }

    /**
     * Vérifie si une action d'annulation est possible pour une area spécifique
     * @param areaId ID de l'area à vérifier
     */
    const canUndoForArea = useCallback((areaId: string): boolean => {
        return hasPastEntriesForArea(globalState, areaId);
    }, [globalState]);

    /**
     * Vérifie si une action de rétablissement est possible pour une area spécifique
     * @param areaId ID de l'area à vérifier
     */
    const canRedoForArea = useCallback((areaId: string): boolean => {
        return hasFutureEntriesForArea(globalState, areaId);
    }, [globalState]);

    /**
     * Annule la dernière action, en général ou pour une zone spécifique
     * @param areaId ID de la zone spécifique (optionnel)
     */
    const handleUndo = useCallback((areaId?: string) => {
        if (DEBUG_MODE) {
            console.log('UNDO appelé - canUndo:', canUndo, 'areaId:', areaId);
        }

        // Pour l'undo spécifique à une area
        if (areaId) {
            const hasEntries = hasPastEntriesForArea(globalState, areaId);

            if (DEBUG_MODE) {
                console.log('  => Area', areaId, 'a des entrées passées:', hasEntries);
            }

            if (hasEntries) {
                dispatch(undo({ areaId }));
            }
        } else if (canUndo) {
            // Undo global
            dispatch(undo({}));
        }
    }, [dispatch, canUndo, globalState]);

    /**
     * Rétablit la dernière action annulée, en général ou pour une zone spécifique
     * @param areaId ID de la zone spécifique (optionnel)
     */
    const handleRedo = useCallback((areaId?: string) => {
        if (DEBUG_MODE) {
            console.log('REDO appelé - canRedo:', canRedo, 'areaId:', areaId);
        }

        if (areaId) {
            const hasEntries = hasFutureEntriesForArea(globalState, areaId);

            if (DEBUG_MODE) {
                console.log('  => Area', areaId, 'a des entrées futures:', hasEntries);
            }

            if (hasEntries) {
                dispatch(redo({ areaId }));
            }
        } else if (canRedo) {
            dispatch(redo({}));
        }
    }, [dispatch, canRedo, globalState]);

    /**
     * Récupère les actions par type
     * @param type Type d'action à filtrer
     */
    const getActionsByType = useCallback((type: string) => {
        return actions.filter((action: HistoryAction) => action.type.startsWith(type));
    }, [actions]);

    /**
     * Récupère l'historique pour une area spécifique
     * @param areaId ID de l'area
     */
    const getHistoryForArea = useCallback((areaId: string) => {
        if (DEBUG_MODE) {
            console.log('Récupération historique pour area', areaId);
        }

        // Filtrer les actions dans past qui ont l'areaId spécifié
        const areaActions = actions.filter((action: HistoryAction) =>
            action.metadata?.areaId === areaId
        );

        const canUndoArea = hasPastEntriesForArea(globalState, areaId);
        const canRedoArea = hasFutureEntriesForArea(globalState, areaId);

        return {
            actions: areaActions,
            canUndo: canUndoArea,
            canRedo: canRedoArea
        };
    }, [actions, globalState]);

    // Assembler les valeurs à retourner dans un seul objet mémorisé
    return useMemo(() => ({
        canUndo,
        canRedo,
        canUndoForArea,
        canRedoForArea,
        historyLength,
        actions,
        undo: handleUndo,
        redo: handleRedo,
        getActionsByType,
        getHistoryForArea,
    }), [
        canUndo,
        canRedo,
        canUndoForArea,
        canRedoForArea,
        historyLength,
        actions,
        handleUndo,
        handleRedo,
        getActionsByType,
        getHistoryForArea
    ]);
} 
