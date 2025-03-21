import { useEffect } from 'react';
import { coreRegistry } from '../store/registries/coreRegistry';
import { IKarmycConfig } from '../types/karmyc';

/**
 * Hook pour initialiser et configurer le système Karmyc
 * @param config - Configuration du système
 */
export function useKarmycLayout(config: IKarmycConfig): void {
    useEffect(() => {
        // Initialiser le système avec la configuration fournie
        coreRegistry.initialize(config);

        // Nettoyer lors du démontage du composant
        return () => {
            coreRegistry.cleanup();
        };
    }, [config]);
} 
