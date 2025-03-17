import { ICoreConfig } from '../../types/core';
import { actionRegistry } from './actionRegistry';

interface ICoreRegistry {
  initialize: (config: ICoreConfig) => void;
  cleanup: () => void;
}

export const coreRegistry: ICoreRegistry = {
  initialize: (config: ICoreConfig) => {
    // Initialiser les zones
    config.areas.types.forEach(type => {
      // Les composants et reducers seront enregistrés via useRegisterAreaType
    });

    // Initialiser les actions
    config.actions.plugins.forEach(plugin => {
      actionRegistry.registerPlugin(plugin);
    });

    config.actions.validators.forEach(({ actionType, validator }) => {
      actionRegistry.registerValidator(actionType, validator);
    });

    // Initialiser les menus contextuels
    config.contextMenu.actions.forEach(action => {
      // Les actions seront enregistrées via useRegisterContextMenuAction
    });
  },

  cleanup: () => {
    // Nettoyer les zones
    // Note: Le nettoyage des zones se fait automatiquement via useRegisterAreaType

    // Nettoyer les actions
    // Note: Le nettoyage des actions se fait automatiquement via useRegisterAction

    // Nettoyer les menus contextuels
    // Note: Le nettoyage des menus contextuels se fait automatiquement via useRegisterContextMenuAction
  }
}; 
