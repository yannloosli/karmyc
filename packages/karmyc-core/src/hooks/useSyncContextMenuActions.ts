import { useEffect } from 'react';
import { actionRegistry } from '../store/registries/actionRegistry';
import { contextMenuRegistry } from '../store/registries/contextMenuRegistry';
import { IContextMenuAction } from '../types/contextMenu';

/**
 * Hook to synchronize context menu actions with the action registry
 * Ensures that each context menu action has a corresponding handler in the action registry
 */
export function useSyncContextMenuActions() {
    useEffect(() => {
        // Function to synchronize a context menu action
        const syncContextMenuAction = (menuType: string, action: IContextMenuAction) => {
            // Register the action in the action registry if it doesn't already exist
            if (!actionRegistry.executeAction(action.id, {})) {
                actionRegistry.registerActionHandler(action.id, action.handler);
            }
        };

        // Observer for changes in the context menu registry
        const observer = {
            handleActionRegistered: (menuType: string, action: IContextMenuAction) => {
                syncContextMenuAction(menuType, action);
            }
        };

        // Subscribe to changes
        contextMenuRegistry.addObserver(observer);

        // Clean up on unmount
        return () => {
            contextMenuRegistry.removeObserver(observer);
        };
    }, []);
} 
