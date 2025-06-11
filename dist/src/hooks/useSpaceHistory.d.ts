export interface UseSpaceHistoryOptions {
    enabled?: boolean;
    maxHistorySize?: number;
}
export declare function useSpaceHistory(spaceId: string | null, options?: UseSpaceHistoryOptions): {
    canUndo: boolean;
    canRedo: boolean;
    undo: () => void;
    redo: () => void;
    clearHistory: () => void;
    pastDiffs: import("../types/historyTypes").THistoryDiff[];
    futureDiffs: import("../types/historyTypes").THistoryDiff[];
};
