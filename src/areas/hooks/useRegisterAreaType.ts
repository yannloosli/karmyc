import { useEffect } from 'react';
import { areaRegistry } from '../../core/data/registries/areaRegistry';

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
        role?: string;
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
            } else if (process.env.NODE_ENV === 'development') {
                console.log(`DefaultSize is not yet supported for ${areaType}`);
            }

            if (options.supportedActions) {
                areaRegistry.registerSupportedActions(areaType, options.supportedActions);
            } else {
                // Default actions supported for each type
                const defaultActions: Record<string, string[]> = {
                    'text-note': ['edit', 'delete', 'move', 'resize'],
                    'color-picker': ['pick', 'delete', 'move', 'resize'],
                    'image-viewer': ['view', 'delete', 'move', 'resize'],
                    'images-gallery': ['view', 'delete', 'move', 'resize', 'add']
                };

                if (defaultActions[areaType]) {
                    areaRegistry.registerSupportedActions(areaType, defaultActions[areaType]);
                } else if (process.env.NODE_ENV === 'development') {
                    console.log(`SupportedActions is not yet supported for ${areaType}`);
                }
            }

            // Ajout du rôle dans le registre si fourni
            if (options.role) {
                // fallback temporaire : stocker dans areaRegistry (sera utilisé plus tard)
                (areaRegistry as any)._roleMap = (areaRegistry as any)._roleMap || {};
                (areaRegistry as any)._roleMap[areaType] = options.role;
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
        options?.role
    ]);
} 
