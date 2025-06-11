interface HistoryEntry {
    id: string;
    type: string;
    payload: any;
    timestamp: number;
    description: string;
}
interface SpaceHistoryState {
    entries: HistoryEntry[];
    addEntry: (entry: HistoryEntry) => void;
    clearHistory: () => void;
}
export declare const spaceHistoryStore: import("zustand").UseBoundStore<import("zustand").StoreApi<SpaceHistoryState>>;
export {};
