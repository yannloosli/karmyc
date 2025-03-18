import { useCallback } from 'react';
import {
    selectCanRedo,
    selectCanUndo,
    selectHistoryActions,
    selectHistoryActionsByType,
    selectHistoryLength
} from '../history/selectors';
import { redo, undo } from '../store/slices/historySlice';
import { useAppDispatch, useAppSelector } from './index';

export function useHistory() {
    const dispatch = useAppDispatch();

    const canUndo = useAppSelector(selectCanUndo);
    const canRedo = useAppSelector(selectCanRedo);
    const historyLength = useAppSelector(selectHistoryLength);
    const actions = useAppSelector(selectHistoryActions);

    const handleUndo = useCallback(() => {
        if (canUndo) {
            dispatch(undo());
        }
    }, [dispatch, canUndo]);

    const handleRedo = useCallback(() => {
        if (canRedo) {
            dispatch(redo());
        }
    }, [dispatch, canRedo]);

    const getActionsByType = useCallback((type: string) => {
        return useAppSelector(selectHistoryActionsByType(type));
    }, []);

    return {
        canUndo,
        canRedo,
        historyLength,
        actions,
        undo: handleUndo,
        redo: handleRedo,
        getActionsByType,
    };
} 
