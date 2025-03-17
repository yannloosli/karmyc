import { AnyAction, Reducer } from '@reduxjs/toolkit';
import undoable, { StateWithHistory } from 'redux-undo';
import { TUndoableOptions } from '../types/history';

// Actions à inclure dans l'historique
const INCLUDED_ACTIONS = [
  'area/addArea',
  'area/removeArea',
  'area/updateArea',
  'area/setActiveArea',
  'project/createProject',
  'project/updateProject',
  'project/deleteProject',
  'contextMenu/openContextMenu',
  'contextMenu/closeContextMenu',
];

// Actions à exclure de l'historique
const EXCLUDED_ACTIONS = [
  'history/UNDO',
  'history/REDO',
  'history/UPDATE_HISTORY',
  'history/CLEAR_HISTORY',
];

export function createUndoableReducer<S>(
  reducer: Reducer<S>,
  options: TUndoableOptions = {}
): Reducer<StateWithHistory<S>> {
  return undoable(reducer, {
    limit: options.limit || 50,
    filter: (action: AnyAction) => {
      const isIncluded = INCLUDED_ACTIONS.some(type => action.type.startsWith(type));
      const isExcluded = EXCLUDED_ACTIONS.some(type => action.type.startsWith(type));
      return isIncluded && !isExcluded;
    },
    ...options,
  });
}

// Fonction utilitaire pour vérifier si une action doit être incluse dans l'historique
export function shouldIncludeInHistory(actionType: string): boolean {
  return INCLUDED_ACTIONS.some(type => actionType.startsWith(type)) &&
         !EXCLUDED_ACTIONS.some(type => actionType.startsWith(type));
} 
