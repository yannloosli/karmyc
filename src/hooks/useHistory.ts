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
 * Hook to use the enhanced history system
 * Inspired by a robust animation editor system
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

    // Subscribe to history changes
    useEffect(() => {
        const unsubscribe = subscribeToHistory(spaceId, (action: EnhancedHistoryAction) => {
            setLastAction(action);
            setStats(getHistoryStats(spaceId));
        });

        unsubscribeRef.current = unsubscribe;

        // Initialize stats
        setStats(getHistoryStats(spaceId));

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [spaceId, subscribeToHistory, getHistoryStats]);

    // Cleanup in-progress action on unmount
    useEffect(() => {
        return () => {
            if (isActionInProgress) {
                cancelAction(spaceId);
            }
        };
    }, [isActionInProgress, spaceId, cancelAction]);

    /**
     * Start a new action
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
     * Submit the current action
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
            
            // Compute action duration
            const duration = Date.now() - actionStartTime.current;
            if (result.action) {
                // Create a copy of the action to avoid read-only errors
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
     * Cancel the current action
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
     * Perform an undo
     */
    const undo = useCallback((): HistoryResult => {
        return undoEnhanced(spaceId);
    }, [spaceId, undoEnhanced]);

    /**
     * Perform a redo
     */
    const redo = useCallback((): HistoryResult => {
        return redoEnhanced(spaceId);
    }, [spaceId, redoEnhanced]);

    /**
     * Check if undo is possible
     */
    const canUndoAction = useCallback((): boolean => {
        return canUndo(spaceId);
    }, [spaceId, canUndo]);

    /**
     * Check if redo is possible
     */
    const canRedoAction = useCallback((): boolean => {
        return canRedo(spaceId);
    }, [spaceId, canRedo]);

    /**
     * Get the current action
     */
    const getCurrentActionData = useCallback((): EnhancedHistoryAction | null => {
        return getCurrentAction(spaceId);
    }, [spaceId, getCurrentAction]);

    /**
     * Get history length
     */
    const getHistoryLengthData = useCallback((): number => {
        return getHistoryLength(spaceId);
    }, [spaceId, getHistoryLength]);

    /**
     * Get history statistics
     */
    const getHistoryStatsData = useCallback((): HistoryStats => {
        return getHistoryStats(spaceId);
    }, [spaceId, getHistoryStats]);

    /**
     * Clear history
     */
    const clearHistoryData = useCallback((): void => {
        clearHistory(spaceId);
        setStats(getHistoryStats(spaceId));
    }, [spaceId, clearHistory, getHistoryStats]);

    /**
     * Update selection state
     */
    const updateSelectionState = useCallback((selectionState: any): void => {
        setSelectionState(spaceId, selectionState);
    }, [spaceId, setSelectionState]);

    /**
     * Create a simple action (start + auto submit)
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
     * Create a selection action
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
     * Create a transform action
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
        // State
        isActionInProgress,
        currentActionId,
        lastAction,
        stats,
        
        // Main actions
        startAction: startNewAction,
        submitAction: submitCurrentAction,
        cancelAction: cancelCurrentAction,
        undo,
        redo,
        
        // Utility actions
        createSimpleAction,
        createSelectionAction,
        createTransformAction,
        
        // Checks
        canUndo: canUndoAction,
        canRedo: canRedoAction,
        
        // Getters
        getCurrentAction: getCurrentActionData,
        getHistoryLength: getHistoryLengthData,
        getHistoryStats: getHistoryStatsData,
        
        // Management actions
        clearHistory: clearHistoryData,
        updateSelectionState,
        
        // Constants
        ACTION_TYPES: HISTORY_ACTION_TYPES,
        EVENTS: HISTORY_EVENTS,
    };
};

/**
 * Public alias: useHistory (Enhanced is now the only system)
 */
export const useHistory = (spaceId: string) => useEnhancedHistory(spaceId);

/**
 * Hook pour utiliser l'historique avec un espace actif automatique
 */
export const useActiveSpaceHistory = () => {
    const { getActiveSpaceId } = useSpaceStore();
    const activeSpaceId = getActiveSpaceId();
    
    if (!activeSpaceId) {
        throw new Error('No active space found. Please select a space first.');
    }
    
    return useHistory(activeSpaceId);
};

/**
 * Hook pour créer des actions d'historique typées
 */
export const useTypedHistoryActions = (spaceId: string) => {
    const { createSimpleAction, createSelectionAction, createTransformAction } = useHistory(spaceId);

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
