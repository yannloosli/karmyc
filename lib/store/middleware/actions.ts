import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { actionRegistry } from '../../actions/registry';

/**
 * Redux middleware that connects the action registry to the store
 */
export const actionsMiddleware: Middleware = store => next => action => {
    // Execute the action normally in Redux
    const result = next(action);

    // Notify the action registry
    actionRegistry.handleAction(action as AnyAction);

    return result;
}; 
