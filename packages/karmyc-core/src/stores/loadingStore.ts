import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface LoadingState {
    loadingStates: Record<string, boolean>;
    setLoading: (id: string, loading: boolean) => void;
    clearLoading: (id: string) => void;
}

export const useLoadingStore = create<LoadingState>()(
    immer((set) => ({
        loadingStates: {},
        setLoading: (id, loading) => {
            set((state) => {
                state.loadingStates[id] = loading;
            });
        },
        clearLoading: (id) => {
            set((state) => {
                delete state.loadingStates[id];
            });
        },
    }))
); 
