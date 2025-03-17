/**
 * Middleware pour la gestion de l'historique des actions
 * 
 * Ce middleware est responsable de :
 * 1. L'interception des actions pour générer des différences d'état
 * 2. La gestion de l'historique undo/redo
 * 3. La visualisation des changements d'état
 * 
 * @see docs/StoreReduxDesign.md - Section 4.2 Middleware d'historique
 */
import { Action, Middleware } from '@reduxjs/toolkit';
import { generateDiff } from '../../utils/diff';

export const historyMiddleware: Middleware = store => next => (action: unknown) => {
  // Capturer l'état avant l'exécution de l'action
  const prevState = store.getState();
  
  // Exécuter l'action normalement
  const result = next(action);
  
  // Capturer l'état après l'exécution de l'action
  const nextState = store.getState();
  
  // Générer les différences si l'action est liée à l'historique
  if (typeof action === 'object' && action !== null && 'type' in action && (action as Action).type.startsWith('history/')) {
    const diffs = generateDiff(prevState, nextState);
    // Stocker les différences pour visualisation ultérieure
    store.dispatch({
      type: 'history/STORE_DIFFS',
      payload: diffs
    });
  }
  
  return result;
}; 
