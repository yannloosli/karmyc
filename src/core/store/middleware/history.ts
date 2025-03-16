import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { HISTORY_ACTION_TYPES } from '../../constants/actionTypes';

/**
 * Middleware d'historique pour Redux
 * Ce middleware gère les actions liées à l'historique (undo, redo, etc.)
 */
export const historyMiddleware: Middleware = store => next => (action: AnyAction) => {
  // Avant d'exécuter l'action
  const prevState = store.getState();
  
  // Exécuter l'action
  const result = next(action);
  
  // Après l'exécution de l'action
  const nextState = store.getState();
  
  // Traiter les actions d'historique spécifiques
  if (action.type === HISTORY_ACTION_TYPES.UNDO) {
    // Logique pour l'annulation
    console.log('Undo action');
  } else if (action.type === HISTORY_ACTION_TYPES.REDO) {
    // Logique pour la restauration
    console.log('Redo action');
  } else if (action.type === HISTORY_ACTION_TYPES.CLEAR_HISTORY) {
    // Logique pour effacer l'historique
    console.log('Clear history');
  }
  
  return result;
}; 
