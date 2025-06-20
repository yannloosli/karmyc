// Dans karmyc/karmyc/packages/core/src/hooks/useRegisterActionHandler.ts

import React, { useEffect } from 'react';
import { actionRegistry } from '../core/registries/actionRegistry';

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
        enabled: boolean;           // If the action should be recorded in history
        type: string;              // Action type for history (e.g. 'draw/addLine')
        getDescription?: (params: any) => string;  // Function to generate the description
        getPayload?: (params: any) => any;        // Function to extract the payload
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
