import { AnyAction } from '@reduxjs/toolkit';
import { IAction, TActionValidator } from '../../types/actions';

interface IActionRegistry {
  registerPlugin: (plugin: IAction) => void;
  unregisterPlugin: (id: string) => void;
  registerValidator: (actionType: string, validator: TActionValidator) => void;
  unregisterValidators: (actionType: string) => void;
  handleAction: (action: AnyAction) => void;
}

// Stockage en mémoire des actions et validateurs
const actionStorage = new Map<string, IAction>();
const validatorStorage = new Map<string, TActionValidator[]>();

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
  }
}; 
