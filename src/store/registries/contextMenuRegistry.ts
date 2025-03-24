import { IContextMenuAction } from '../../types/contextMenu';

interface IContextMenuObserver {
    handleActionRegistered: (menuType: string, action: IContextMenuAction) => void;
}

interface IContextMenuRegistry {
    registerAction: (menuType: string, action: IContextMenuAction) => void;
    unregisterAction: (menuType: string, actionId: string) => void;
    addObserver: (observer: IContextMenuObserver) => void;
    removeObserver: (observer: IContextMenuObserver) => void;
}

// Stockage en mémoire des actions de menu contextuel
const contextMenuStorage = new Map<string, Map<string, IContextMenuAction>>();
const observers = new Set<IContextMenuObserver>();

export const contextMenuRegistry: IContextMenuRegistry = {
    registerAction: (menuType: string, action: IContextMenuAction) => {
        const menuActions = contextMenuStorage.get(menuType) || new Map();
        menuActions.set(action.id, action);
        contextMenuStorage.set(menuType, menuActions);

        // Notifier les observateurs
        observers.forEach(observer => {
            observer.handleActionRegistered(menuType, action);
        });
    },

    unregisterAction: (menuType: string, actionId: string) => {
        const menuActions = contextMenuStorage.get(menuType);
        if (menuActions) {
            menuActions.delete(actionId);
            if (menuActions.size === 0) {
                contextMenuStorage.delete(menuType);
            }
        }
    },

    addObserver: (observer: IContextMenuObserver) => {
        observers.add(observer);
    },

    removeObserver: (observer: IContextMenuObserver) => {
        observers.delete(observer);
    }
}; 
