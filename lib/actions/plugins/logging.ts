import { AnyAction } from '@reduxjs/toolkit';
import { IAction } from '../../types/actions';
import { actionLogger } from '../logger';
import { ActionPriority } from '../priorities';

/**
 * Logging plugin for actions
 * Allows tracing and filtering actions according to different log levels
 */
export const loggingPlugin: IAction = {
    id: 'logging',
    type: 'logging',
    priority: ActionPriority.LOW,
    actionTypes: null,
    handler: (action: AnyAction) => {
        actionLogger.info(`Action executed: ${action.type}`, action, {
            payload: action.payload,
            meta: action.meta
        });
    }
}; 
