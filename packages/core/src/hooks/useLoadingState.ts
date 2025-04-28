import { useCallback } from 'react';
// Supprimer imports Redux
// import { useDispatch, useSelector } from 'react-redux';
// import { RootState } from '../store';
// import { clearLoading, selectStateLoading, setLoading } from '../store/slices/stateSlice';
import { useLoadingStore } from '../stores/loadingStore'; // Importer le store Zustand

export const useLoadingState = (id: string) => {
    // Lire l'état et les actions depuis Zustand
    const isLoading = useLoadingStore((state) => !!state.loadingStates[id]);
    const setLoadingAction = useLoadingStore((state) => state.setLoading);
    const clearLoadingAction = useLoadingStore((state) => state.clearLoading);

    const startLoading = useCallback(() => {
        setLoadingAction(id, true);
    }, [setLoadingAction, id]);

    const stopLoading = useCallback(() => {
        clearLoadingAction(id);
    }, [clearLoadingAction, id]);

    const withLoading = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
        try {
            startLoading();
            return await operation();
        } finally {
            stopLoading();
        }
    }, [startLoading, stopLoading]);

    return {
        isLoading,
        startLoading,
        stopLoading,
        withLoading,
    };
}; 
