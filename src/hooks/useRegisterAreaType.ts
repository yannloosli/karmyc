import { useEffect } from 'react';
import { areaRegistry } from '../data/registries/areaRegistry';
import { AreaRole } from '../types/karmyc';

/**
 * Hook to register a custom area type
 */
export function useRegisterAreaType<T = any>(
    areaType: string,
    component: React.ComponentType<any>,
    initialState: T,
    options?: {
        displayName?: string;
        icon?: React.ComponentType;
        defaultSize?: { width: number, height: number };
        supportedActions?: string[];
        role?: AreaRole;
        supportFullscreen?: boolean;
    }
): void {
    useEffect(() => {
        // Register the component in the unique registry
        areaRegistry.registerComponent(areaType, component);

        // Register initial state if supported
        areaRegistry.registerInitialState(areaType, initialState);

        // Register additional options
        if (options) {
            if (options.displayName) {
                areaRegistry.registerDisplayName(areaType, options.displayName);
            }

            if (options.icon) {
                areaRegistry.registerIcon(areaType, options.icon);
            }

            if (options.defaultSize) {
                areaRegistry.registerDefaultSize(areaType, options.defaultSize);
            }

            if (options.supportedActions) {
                areaRegistry.registerSupportedActions(areaType, options.supportedActions);
            } 
            // Ajout du rôle dans le registre si fourni
            if (options.role) {
                // fallback temporaire : stocker dans areaRegistry (sera utilisé plus tard)
                (areaRegistry as any)._roleMap = (areaRegistry as any)._roleMap || {};
                (areaRegistry as any)._roleMap[areaType] = options.role;
            }

            // Enregistrement de l'option supportFullscreen
            if (options.supportFullscreen !== undefined) {
                (areaRegistry as any)._supportFullscreenMap = (areaRegistry as any)._supportFullscreenMap || {};
                (areaRegistry as any)._supportFullscreenMap[areaType] = options.supportFullscreen;
            }
        }

        // Clean up when component unmounts
        return () => {
            areaRegistry.unregisterAreaType(areaType);
        };
    }, [
        areaType,
        component,
        initialState,
        options,
        options?.displayName,
        options?.defaultSize,
        options?.supportedActions,
        options?.icon,
        options?.role,
        options?.supportFullscreen
    ]);
} 
