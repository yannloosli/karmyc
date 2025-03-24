import { useEffect } from 'react';
import { actionRegistry } from '../store/registries/actionRegistry';
import { contextMenuRegistry } from '../store/registries/contextMenuRegistry';
import { IContextMenuAction } from '../types/contextMenu';

/**
 * Hook pour synchroniser les actions du menu contextuel avec le registre d'actions
 * Permet de s'assurer que chaque action du menu contextuel a un gestionnaire correspondant dans le registre d'actions
 */
export function useSyncContextMenuActions() {
    useEffect(() => {
        // Fonction pour synchroniser une action du menu contextuel
        const syncContextMenuAction = (menuType: string, action: IContextMenuAction) => {
            // Enregistrer l'action dans le registre d'actions si elle n'existe pas déjà
            if (!actionRegistry.executeAction(action.id, {})) {
                actionRegistry.registerActionHandler(action.id, action.handler);
            }
        };

        // Observer les changements dans le registre de menu contextuel
        const observer = {
            handleActionRegistered: (menuType: string, action: IContextMenuAction) => {
                syncContextMenuAction(menuType, action);
            }
        };

        // S'abonner aux changements
        contextMenuRegistry.addObserver(observer);

        // Nettoyer lors du démontage
        return () => {
            contextMenuRegistry.removeObserver(observer);
        };
    }, []);
} 
