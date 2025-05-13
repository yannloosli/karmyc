import { Action, IActionPlugin } from '../../types/actions';
import { actionLogger } from '../logger';
import { ActionPriority } from '../priorities';

/**
 * Logging plugin for actions
 * Allows tracing and filtering actions according to different log levels
 */
export const loggingPlugin: IActionPlugin = {
    id: 'logging',
    priority: ActionPriority.LOW,
    actionTypes: null, // Log all actions
    handler: (action: Action) => {
        actionLogger.info(`Action executed: ${action.type}`, action, {
            payload: action.payload,
            meta: action.meta
        });
    }
}; 
