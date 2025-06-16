import { useCallback } from 'react';
import { useSpaceStore } from '../core/spaceStore';

export interface UseSpaceHistoryOptions {
    enabled?: boolean;
    maxHistorySize?: number;
}

export function useSpaceHistory(spaceId: string | null, options: UseSpaceHistoryOptions = {}) {
    const { enabled = true } = options;

    const undoSharedState = useSpaceStore(state => state.undoSharedState);
    const redoSharedState = useSpaceStore(state => state.redoSharedState);

    const space = useSpaceStore(state => spaceId ? state.spaces[spaceId] : null);
    const canUndo = Boolean(space?.sharedState?.pastDiffs?.length);
    const canRedo = Boolean(space?.sharedState?.futureDiffs?.length);

    const undo = useCallback(() => {
        if (!enabled || !spaceId || !canUndo) return;
        undoSharedState(spaceId);
    }, [enabled, spaceId, canUndo, undoSharedState]);

    const redo = useCallback(() => {
        if (!enabled || !spaceId || !canRedo) return;
        redoSharedState(spaceId);
    }, [enabled, spaceId, canRedo, redoSharedState]);

    const clearHistory = useCallback(() => {
        if (!enabled || !spaceId) return;
        useSpaceStore.setState(state => {
            const space = state.spaces[spaceId];
            if (space) {
                space.sharedState.pastDiffs = [];
                space.sharedState.futureDiffs = [];
            }
        });
    }, [enabled, spaceId]);

    return {
        canUndo,
        canRedo,
        undo,
        redo,
        clearHistory,
        pastDiffs: space?.sharedState?.pastDiffs ?? [],
        futureDiffs: space?.sharedState?.futureDiffs ?? []
    };
} 
