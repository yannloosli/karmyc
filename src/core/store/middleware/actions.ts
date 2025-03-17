import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { actionRegistry } from '../../actions/registry';

/**
 * Middleware Redux qui connecte le registre d'actions au store
 */
export const actionsMiddleware: Middleware = store => next => action => {
  // Exécuter l'action normalement dans Redux
  const result = next(action);
  
  // Notifier le registre d'actions
  actionRegistry.handleAction(action as AnyAction);
  
  return result;
}; 
