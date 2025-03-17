import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionCreators } from 'redux-undo';
import { RootState } from '../store';

type UndoableSliceName = keyof Pick<RootState, 'area'>;

export const useUndoable = (sliceName: UndoableSliceName) => {
  const dispatch = useDispatch();
  
  // Sélecteurs pour l'état undoable
  const past = useSelector((state: RootState) => state[sliceName]?.past);
  const future = useSelector((state: RootState) => state[sliceName]?.future);
  const present = useSelector((state: RootState) => state[sliceName]?.present);

  const canUndo = past && past.length > 0;
  const canRedo = future && future.length > 0;

  const undo = useCallback(() => {
    if (canUndo) {
      dispatch(ActionCreators.undo());
    }
  }, [dispatch, canUndo]);

  const redo = useCallback(() => {
    if (canRedo) {
      dispatch(ActionCreators.redo());
    }
  }, [dispatch, canRedo]);

  const jumpToPast = useCallback((index: number) => {
    if (past && index >= 0 && index < past.length) {
      dispatch(ActionCreators.jumpToPast(index));
    }
  }, [dispatch, past]);

  const jumpToFuture = useCallback((index: number) => {
    if (future && index >= 0 && index < future.length) {
      dispatch(ActionCreators.jumpToFuture(index));
    }
  }, [dispatch, future]);

  const clearHistory = useCallback(() => {
    dispatch(ActionCreators.clearHistory());
  }, [dispatch]);

  return {
    past,
    future,
    present,
    canUndo,
    canRedo,
    undo,
    redo,
    jumpToPast,
    jumpToFuture,
    clearHistory,
  };
}; 
