// Dans karmyc/karmyc/packages/core/src/hooks/useRegisterActionHandler.ts

import { useEffect } from 'react';
import { actionRegistry } from '../../data/registries/actionRegistry';

interface ActionMetadata {
    menuType?: string;
    label?: string;
    icon?: string;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
    order?: number;
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
