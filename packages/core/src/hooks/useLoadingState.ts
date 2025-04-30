import { useCallback } from 'react';
import { useLoadingStore } from '../stores/loadingStore';

export const useLoadingState = (id: string) => {
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
