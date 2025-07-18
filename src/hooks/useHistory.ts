import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpaceStore } from '../core/spaceStore';
import { 
    EnhancedHistoryAction, 
    Diff, 
    HistoryResult, 
    HistoryStats,
    HistorySubscriber,
    HISTORY_ACTION_TYPES,
    HISTORY_EVENTS
} from '../types/historyTypes';

/**
 * Hook pour utiliser le système d'historique amélioré
 * Inspiré du système robuste de l'éditeur d'animation
 */
export const useEnhancedHistory = (spaceId: string) => {
    const {
        startAction,
        submitAction,
        cancelAction,
        undoEnhanced,
        redoEnhanced,
        canUndo,
        canRedo,
        getCurrentAction,
        getHistoryLength,
        getHistoryStats,
        clearHistory,
        subscribeToHistory,
        setSelectionState,
    } = useSpaceStore();

    const [isActionInProgress, setIsActionInProgress] = useState(false);
    const [currentActionId, setCurrentActionId] = useState<string | null>(null);
    const [lastAction, setLastAction] = useState<EnhancedHistoryAction | null>(null);
    const [stats, setStats] = useState<HistoryStats>({
        totalActions: 0,
        pastActions: 0,
        futureActions: 0,
        memoryUsage: 0,
        lastActionTime: 0,
        averageActionDuration: 0,
    });

    const actionStartTime = useRef<number>(0);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    // S'abonner aux changements d'historique
    useEffect(() => {
        const unsubscribe = subscribeToHistory(spaceId, (action: EnhancedHistoryAction) => {
            setLastAction(action);
            setStats(getHistoryStats(spaceId));
        });

        unsubscribeRef.current = unsubscribe;

        // Initialiser les stats
        setStats(getHistoryStats(spaceId));

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [spaceId, subscribeToHistory, getHistoryStats]);

    // Nettoyer l'action en cours lors du démontage
    useEffect(() => {
        return () => {
            if (isActionInProgress) {
                cancelAction(spaceId);
            }
        };
    }, [isActionInProgress, spaceId, cancelAction]);

    /**
     * Démarrer une nouvelle action
     */
    const startNewAction = useCallback((actionId: string): HistoryResult => {
        const result = startAction(spaceId, actionId);
        if (result.success) {
            setIsActionInProgress(true);
            setCurrentActionId(actionId);
            actionStartTime.current = Date.now();
        }
        return result;
    }, [spaceId, startAction]);

    /**
     * Soumettre l'action en cours
     */
    const submitCurrentAction = useCallback((
        name: string, 
        diffs: Diff[] = [], 
        allowIndexShift: boolean = false, 
        modifiedKeys: string[] = []
    ): HistoryResult => {
        const result = submitAction(spaceId, name, diffs, allowIndexShift, modifiedKeys);
        if (result.success) {
            setIsActionInProgress(false);
            setCurrentActionId(null);
            
            // Calculer la durée de l'action
            const duration = Date.now() - actionStartTime.current;
            if (result.action) {
                // Créer une copie de l'action pour éviter les erreurs de lecture seule
                result.action = {
                    ...result.action,
                    metadata: {
                        ...result.action.metadata,
                        duration
                    }
                };
            }
        }
        return result;
    }, [spaceId, submitAction]);

    /**
     * Annuler l'action en cours
     */
    const cancelCurrentAction = useCallback((): HistoryResult => {
        const result = cancelAction(spaceId);
        if (result.success) {
            setIsActionInProgress(false);
            setCurrentActionId(null);
        }
        return result;
    }, [spaceId, cancelAction]);

    /**
     * Effectuer un undo
     */
    const undo = useCallback((): HistoryResult => {
        return undoEnhanced(spaceId);
    }, [spaceId, undoEnhanced]);

    /**
     * Effectuer un redo
     */
    const redo = useCallback((): HistoryResult => {
        return redoEnhanced(spaceId);
    }, [spaceId, redoEnhanced]);

    /**
     * Vérifier si on peut faire un undo
     */
    const canUndoAction = useCallback((): boolean => {
        return canUndo(spaceId);
    }, [spaceId, canUndo]);

    /**
     * Vérifier si on peut faire un redo
     */
    const canRedoAction = useCallback((): boolean => {
        return canRedo(spaceId);
    }, [spaceId, canRedo]);

    /**
     * Obtenir l'action en cours
     */
    const getCurrentActionData = useCallback((): EnhancedHistoryAction | null => {
        return getCurrentAction(spaceId);
    }, [spaceId, getCurrentAction]);

    /**
     * Obtenir la longueur de l'historique
     */
    const getHistoryLengthData = useCallback((): number => {
        return getHistoryLength(spaceId);
    }, [spaceId, getHistoryLength]);

    /**
     * Obtenir les statistiques d'historique
     */
    const getHistoryStatsData = useCallback((): HistoryStats => {
        return getHistoryStats(spaceId);
    }, [spaceId, getHistoryStats]);

    /**
     * Effacer l'historique
     */
    const clearHistoryData = useCallback((): void => {
        clearHistory(spaceId);
        setStats(getHistoryStats(spaceId));
    }, [spaceId, clearHistory, getHistoryStats]);

    /**
     * Mettre à jour l'état de sélection
     */
    const updateSelectionState = useCallback((selectionState: any): void => {
        setSelectionState(spaceId, selectionState);
    }, [spaceId, setSelectionState]);

    /**
     * Créer une action simple (start + submit automatique)
     */
    const createSimpleAction = useCallback((
        name: string,
        diffs: Diff[] = [],
        allowIndexShift: boolean = false,
        modifiedKeys: string[] = []
    ): HistoryResult => {
        const actionId = `${name}-${Date.now()}`;
        const startResult = startNewAction(actionId);
        
        if (!startResult.success) {
            return startResult;
        }

        return submitCurrentAction(name, diffs, allowIndexShift, modifiedKeys);
    }, [startNewAction, submitCurrentAction]);

    /**
     * Créer une action de sélection
     */
    const createSelectionAction = useCallback((
        name: string,
        selectionData: any,
        diffs: Diff[] = []
    ): HistoryResult => {
        return createSimpleAction(
            name,
            diffs,
            true, // allowIndexShift
            ['selection'] // modifiedKeys
        );
    }, [createSimpleAction]);

    /**
     * Créer une action de transformation
     */
    const createTransformAction = useCallback((
        name: string,
        transformData: any,
        diffs: Diff[] = []
    ): HistoryResult => {
        return createSimpleAction(
            name,
            diffs,
            false, // allowIndexShift
            ['transform'] // modifiedKeys
        );
    }, [createSimpleAction]);

    return {
        // État
        isActionInProgress,
        currentActionId,
        lastAction,
        stats,
        
        // Actions principales
        startAction: startNewAction,
        submitAction: submitCurrentAction,
        cancelAction: cancelCurrentAction,
        undo,
        redo,
        
        // Actions utilitaires
        createSimpleAction,
        createSelectionAction,
        createTransformAction,
        
        // Vérifications
        canUndo: canUndoAction,
        canRedo: canRedoAction,
        
        // Getters
        getCurrentAction: getCurrentActionData,
        getHistoryLength: getHistoryLengthData,
        getHistoryStats: getHistoryStatsData,
        
        // Actions de gestion
        clearHistory: clearHistoryData,
        updateSelectionState,
        
        // Constantes
        ACTION_TYPES: HISTORY_ACTION_TYPES,
        EVENTS: HISTORY_EVENTS,
    };
};

/**
 * Hook pour utiliser l'historique avec un espace actif automatique
 */
export const useActiveSpaceHistory = () => {
    const { getActiveSpaceId } = useSpaceStore();
    const activeSpaceId = getActiveSpaceId();
    
    if (!activeSpaceId) {
        throw new Error('No active space found. Please select a space first.');
    }
    
    return useEnhancedHistory(activeSpaceId);
};

/**
 * Hook pour créer des actions d'historique typées
 */
export const useTypedHistoryActions = (spaceId: string) => {
    const { createSimpleAction, createSelectionAction, createTransformAction } = useEnhancedHistory(spaceId);

    return {
        // Actions de base
        create: (data: any) => createSimpleAction(HISTORY_ACTION_TYPES.CREATE, [], false, ['create']),
        update: (data: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.UPDATE, diffs, false, ['update']),
        delete: (data: any) => createSimpleAction(HISTORY_ACTION_TYPES.DELETE, [], false, ['delete']),
        move: (data: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.MOVE, diffs, true, ['move']),
        copy: (data: any) => createSimpleAction(HISTORY_ACTION_TYPES.COPY, [], false, ['copy']),
        paste: (data: any) => createSimpleAction(HISTORY_ACTION_TYPES.PASTE, [], false, ['paste']),
        
        // Actions de sélection
        select: (selectionData: any) => createSelectionAction(HISTORY_ACTION_TYPES.SELECT, selectionData),
        deselect: (selectionData: any) => createSelectionAction(HISTORY_ACTION_TYPES.DESELECT, selectionData),
        selectAll: (selectionData: any) => createSelectionAction(HISTORY_ACTION_TYPES.SELECT_ALL, selectionData),
        deselectAll: (selectionData: any) => createSelectionAction(HISTORY_ACTION_TYPES.DESELECT_ALL, selectionData),
        
        // Actions de groupe
        group: (groupData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.GROUP, diffs, false, ['group']),
        ungroup: (groupData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.UNGROUP, diffs, false, ['group']),
        
        // Actions de transformation
        transform: (transformData: any, diffs: Diff[] = []) => createTransformAction(HISTORY_ACTION_TYPES.TRANSFORM, transformData, diffs),
        rotate: (rotateData: any, diffs: Diff[] = []) => createTransformAction(HISTORY_ACTION_TYPES.ROTATE, rotateData, diffs),
        scale: (scaleData: any, diffs: Diff[] = []) => createTransformAction(HISTORY_ACTION_TYPES.SCALE, scaleData, diffs),
        translate: (translateData: any, diffs: Diff[] = []) => createTransformAction(HISTORY_ACTION_TYPES.TRANSLATE, translateData, diffs),
        
        // Actions de timeline
        timelineUpdate: (timelineData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.TIMELINE_UPDATE, diffs, false, ['timeline']),
        keyframeAdd: (keyframeData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.KEYFRAME_ADD, diffs, false, ['keyframe']),
        keyframeRemove: (keyframeData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.KEYFRAME_REMOVE, diffs, false, ['keyframe']),
        keyframeUpdate: (keyframeData: any, diffs: Diff[] = []) => createSimpleAction(HISTORY_ACTION_TYPES.KEYFRAME_UPDATE, diffs, false, ['keyframe']),
        
        // Actions personnalisées
        custom: (name: string, data: any, diffs: Diff[] = []) => createSimpleAction(name, diffs, false, ['custom']),
    };
};

/**
 * Hook pour utiliser des actions typées avec l'espace actif
 */
export const useActiveSpaceTypedActions = () => {
    const { getActiveSpaceId } = useSpaceStore();
    const activeSpaceId = getActiveSpaceId();
    
    if (!activeSpaceId) {
        throw new Error('No active space found. Please select a space first.');
    }
    
    return useTypedHistoryActions(activeSpaceId);
}; 
