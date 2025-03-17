import { IContextMenuAction } from '../../types/contextMenu';

interface IContextMenuRegistry {
  registerAction: (menuType: string, action: IContextMenuAction) => void;
  unregisterAction: (menuType: string, actionId: string) => void;
}

// Stockage en mémoire des actions de menu contextuel
const contextMenuStorage = new Map<string, Map<string, IContextMenuAction>>();

export const contextMenuRegistry: IContextMenuRegistry = {
  registerAction: (menuType: string, action: IContextMenuAction) => {
    const menuActions = contextMenuStorage.get(menuType) || new Map();
    menuActions.set(action.id, action);
    contextMenuStorage.set(menuType, menuActions);
  },

  unregisterAction: (menuType: string, actionId: string) => {
    const menuActions = contextMenuStorage.get(menuType);
    if (menuActions) {
      menuActions.delete(actionId);
      if (menuActions.size === 0) {
        contextMenuStorage.delete(menuType);
      }
    }
  }
}; 
