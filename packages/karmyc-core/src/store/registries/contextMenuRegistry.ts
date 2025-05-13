import { ContextMenuItem, IContextMenuAction } from "../../types/contextMenu";

type MenuRegistryType = Record<string, ContextMenuItem[]>;

interface IContextMenuObserver {
    handleActionRegistered: (menuType: string, action: IContextMenuAction) => void;
}

interface IContextMenuRegistry {
    registerItem: (menuId: string, item: ContextMenuItem) => void;
    unregisterItemById: (menuId: string, itemId: string) => void;
    getMenuItems: (menuId: string) => ContextMenuItem[];
    clear: () => void;
    registerAction: (menuType: string, action: IContextMenuAction) => void;
    unregisterAction: (menuType: string, actionId: string) => void;
    addObserver: (observer: IContextMenuObserver) => void;
    removeObserver: (observer: IContextMenuObserver) => void;
}

// Registry to store context menu items
const menuRegistry: MenuRegistryType = {};

// In-memory storage of context menu actions
const contextMenuStorage = new Map<string, Map<string, IContextMenuAction>>();
const observers = new Set<IContextMenuObserver>();

export const contextMenuRegistry: IContextMenuRegistry = {
    registerItem: (menuId: string, item: ContextMenuItem) => {
        if (!menuRegistry[menuId]) {
            menuRegistry[menuId] = [];
        }

        // Check if an item with the same ID already exists
        const existingItemIndex = menuRegistry[menuId].findIndex(
            (existingItem) => existingItem.id === item.id
        );

        if (existingItemIndex !== -1) {
            // Replace the existing item
            menuRegistry[menuId][existingItemIndex] = item;
        } else {
            // Add the new item
            menuRegistry[menuId].push(item);
        }
    },

    unregisterItemById: (menuId: string, itemId: string) => {
        if (!menuRegistry[menuId]) return;

        const itemIndex = menuRegistry[menuId].findIndex(
            (item) => item.id === itemId
        );

        if (itemIndex !== -1) {
            menuRegistry[menuId].splice(itemIndex, 1);
        }
    },

    getMenuItems: (menuId: string) => {
        return menuRegistry[menuId] || [];
    },

    clear: () => {
        Object.keys(menuRegistry).forEach((key) => {
            delete menuRegistry[key];
        });
    },

    registerAction: (menuType: string, action: IContextMenuAction) => {
        const menuActions = contextMenuStorage.get(menuType) || new Map();
        menuActions.set(action.id, action);
        contextMenuStorage.set(menuType, menuActions);

        // Notify observers
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
