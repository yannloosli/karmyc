import { useEffect } from 'react';
import { areaRegistry } from '../area/registry';

/**
 * Hook pour enregistrer un type de zone personnalisé
 * 
 * @param areaType - Type de zone à enregistrer
 * @param component - Composant React pour ce type de zone
 * @param initialState - État initial pour ce type de zone
 * @param options - Options supplémentaires (facultatif)
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
    }
): void {
    useEffect(() => {
        // Enregistrer le composant dans le registre unique
        areaRegistry.registerComponent(areaType, component);

        // Enregistrer l'état initial si supporté
        areaRegistry.registerInitialState(areaType, initialState);

        // Enregistrer les options supplémentaires
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
                console.log(`DefaultSize n'est pas encore supporté pour ${areaType}`);
            }

            if (options.supportedActions) {
                areaRegistry.registerSupportedActions(areaType, options.supportedActions);
            } else if (process.env.NODE_ENV === 'development') {
                console.log(`SupportedActions n'est pas encore supporté pour ${areaType}`);
            }
        }

        // Nettoyer lors du démontage du composant
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
        options?.icon
    ]);
} 
