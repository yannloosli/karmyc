import { AnyAction } from '@reduxjs/toolkit';
import { IAction, TActionValidator } from '../../types/actions';

// Definition of action handler type
type ActionHandler = (params: any) => void;

interface IActionRegistry {
    registerPlugin: (plugin: IAction) => void;
    unregisterPlugin: (id: string) => void;
    registerValidator: (actionType: string, validator: TActionValidator) => void;
    unregisterValidators: (actionType: string) => void;
    handleAction: (action: AnyAction) => void;
    registerActionHandler: (actionId: string, handler: ActionHandler) => void;
    unregisterActionHandler: (actionId: string) => void;
    executeAction: (actionId: string, params: any) => boolean; // Returns true if the action was executed
}

// In-memory storage for actions and validators
const actionStorage = new Map<string, IAction>();
const validatorStorage = new Map<string, TActionValidator[]>();

// In-memory storage for action handlers
const actionHandlers = new Map<string, ActionHandler>();

export const actionRegistry: IActionRegistry = {
    registerPlugin: (plugin: IAction) => {
        actionStorage.set(plugin.id, plugin);
    },

    unregisterPlugin: (id: string) => {
        actionStorage.delete(id);
    },

    registerValidator: (actionType: string, validator: TActionValidator) => {
        const existing = validatorStorage.get(actionType) || [];
        validatorStorage.set(actionType, [...existing, validator]);
    },

    unregisterValidators: (actionType: string) => {
        validatorStorage.delete(actionType);
    },

    handleAction: (action: AnyAction) => {
        // Validate the action
        const validators = validatorStorage.get(action.type) || [];
        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                console.warn(`Action validation failed: ${result.message}`);
                return;
            }
        }

        // Execute plugin handlers
        const plugins = Array.from(actionStorage.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const plugin of plugins) {
            if (plugin.actionTypes === null || plugin.actionTypes.includes(action.type)) {
                try {
                    plugin.handler(action);
                } catch (error) {
                    console.error(`Error in plugin ${plugin.id}:`, error);
                }
            }
        }
    },

    registerActionHandler: (actionId: string, handler: ActionHandler) => {
        actionHandlers.set(actionId, handler);
    },

    unregisterActionHandler: (actionId: string) => {
        actionHandlers.delete(actionId);
    },

    executeAction: (actionId: string, params: any) => {
        const handler = actionHandlers.get(actionId);
        if (handler) {
            handler(params);
            return true;
        }

        return false;
    }
}; 
