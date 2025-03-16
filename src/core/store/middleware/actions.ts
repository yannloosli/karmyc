import { Middleware } from '@reduxjs/toolkit';
import { actionRegistry } from '../../actions/registry';

/**
 * Middleware d'actions pour Redux
 * Ce middleware intercepte toutes les actions dispatched et les envoie au registre d'actions
 */
export const actionsMiddleware: Middleware = store => next => action => {
  // Exécuter l'action normalement dans Redux
  const result = next(action);
  
  // Notifier le registre d'actions
  actionRegistry.handleAction(action);
  
  return result;
}; 
