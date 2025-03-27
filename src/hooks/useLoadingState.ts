import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearLoading, selectStateLoading, setLoading } from '../store/slices/stateSlice';

export const useLoadingState = (id: string) => {
    const dispatch = useDispatch();
    const isLoading = useSelector((state: RootState) => selectStateLoading(id)(state));

    const startLoading = useCallback(() => {
        dispatch(setLoading({ id, loading: true }));
    }, [dispatch, id]);

    const stopLoading = useCallback(() => {
        dispatch(clearLoading(id));
    }, [dispatch, id]);

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
