// Dans karmyc/karmyc/packages/core/src/hooks/useRegisterActionHandler.ts

import { useEffect } from 'react';
import { actionRegistry } from './actionRegistry';

interface ActionMetadata {
    // UI Metadata
    menuType?: string;
    label?: string;
    icon?: string;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
    order?: number;

    // History Metadata
    history?: {
        enabled: boolean;           // Si l'action doit être historisée
        type: string;              // Type d'action pour l'historique (ex: 'draw/addLine')
        getDescription?: (params: any) => string;  // Fonction pour générer la description
        getPayload?: (params: any) => any;        // Fonction pour extraire le payload
    };
}

export function useRegisterActionHandler(
    actionId: string, 
    handler: (params: any) => void,
    metadata?: ActionMetadata
) {
    useEffect(() => {
        actionRegistry.registerActionHandler(actionId, handler, metadata);
        return () => {
            actionRegistry.unregisterActionHandler(actionId);
        };
    }, [actionId, handler, metadata]);
}
