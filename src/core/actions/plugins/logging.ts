import { AnyAction } from '@reduxjs/toolkit';
import { IAction } from '../../types/actions';
import { actionLogger } from '../logger';
import { ActionPriority } from '../priorities';

/**
 * Plugin de logging pour les actions
 * Permet de tracer et de filtrer les actions selon différents niveaux de log
 */
export const loggingPlugin: IAction = {
  id: 'logging',
  type: 'logging',
  priority: ActionPriority.LOW,
  actionTypes: null,
  handler: (action: AnyAction) => {
    actionLogger.info(`Action exécutée: ${action.type}`, action, {
      payload: action.payload,
      meta: action.meta
    });
  }
}; 
