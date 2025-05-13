import { useEffect } from 'react';
import { actionRegistry } from '../store/registries/actionRegistry';

/**
 * Hook to register an action handler
 * Allows registering a function that will be called when the action with the specified ID is triggered
 * The handler is automatically unregistered when the component unmounts
 */
export function useRegisterActionHandler(actionId: string, handler: (params: any) => void) {
    useEffect(() => {
        // Register the handler
        actionRegistry.registerActionHandler(actionId, handler);

        // Clean up on unmount
        return () => {
            actionRegistry.unregisterActionHandler(actionId);
        };
    }, [actionId, handler]);
} 
