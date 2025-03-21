import { AnyAction } from '@reduxjs/toolkit';
import { IAction, TActionValidator } from '../../types/actions';

// Définition du type pour le gestionnaire d'action
type ActionHandler = (params: any) => void;

interface IActionRegistry {
    registerPlugin: (plugin: IAction) => void;
    unregisterPlugin: (id: string) => void;
    registerValidator: (actionType: string, validator: TActionValidator) => void;
    unregisterValidators: (actionType: string) => void;
    handleAction: (action: AnyAction) => void;
    registerActionHandler: (actionId: string, handler: ActionHandler) => void;
    unregisterActionHandler: (actionId: string) => void;
    executeAction: (actionId: string, params: any) => boolean; // Retourne true si l'action a été exécutée
}

// Stockage en mémoire des actions et validateurs
const actionStorage = new Map<string, IAction>();
const validatorStorage = new Map<string, TActionValidator[]>();

// Stockage en mémoire des gestionnaires d'actions
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
        // Valider l'action
        const validators = validatorStorage.get(action.type) || [];
        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                console.warn(`Validation de l'action échouée: ${result.message}`);
                return;
            }
        }

        // Exécuter les handlers des plugins
        const plugins = Array.from(actionStorage.values())
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const plugin of plugins) {
            if (plugin.actionTypes === null || plugin.actionTypes.includes(action.type)) {
                try {
                    plugin.handler(action);
                } catch (error) {
                    console.error(`Erreur dans le plugin ${plugin.id}:`, error);
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
            console.log(`Gestionnaire d'action trouvé pour ${actionId}`);
            handler(params);
            return true;
        }
        console.log(`Aucun gestionnaire d'action trouvé pour ${actionId}. Actions disponibles:`,
            Array.from(actionHandlers.keys()));
        return false;
    }
}; 
