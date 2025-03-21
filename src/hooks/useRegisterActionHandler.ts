import { useEffect } from 'react';
import { actionRegistry } from '../store/registries/actionRegistry';

/**
 * Hook pour enregistrer un gestionnaire d'action
 * Permet d'enregistrer une fonction qui sera appelée lorsque l'action avec l'ID spécifié sera déclenchée
 * Le gestionnaire est automatiquement désenregistré lors du démontage du composant
 * 
 * @param actionId - L'identifiant de l'action à gérer
 * @param handler - La fonction à appeler lorsque l'action est déclenchée
 */
export function useRegisterActionHandler(actionId: string, handler: (params: any) => void) {
    useEffect(() => {
        // Enregistrer le gestionnaire
        actionRegistry.registerActionHandler(actionId, handler);

        // Nettoyer lors du démontage
        return () => {
            actionRegistry.unregisterActionHandler(actionId);
        };
    }, [actionId, handler]);
} 
