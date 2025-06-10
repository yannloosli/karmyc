import { create } from 'zustand';

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

export const spaceHistoryStore = create<SpaceHistoryState>((set) => ({
    entries: [],
    addEntry: (entry) => set((state) => ({ entries: [...state.entries, entry] })),
    clearHistory: () => set({ entries: [] })
})); 
