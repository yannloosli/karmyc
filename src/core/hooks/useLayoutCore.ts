import { useEffect } from 'react';
import { coreRegistry } from '../registry';
import { ICoreConfig } from '../types/core';

/**
 * Hook principal pour initialiser le système de mise en page
 * @param config - Configuration du système
 */
export function useLayoutCore(config: ICoreConfig): void {
  useEffect(() => {
    // Initialiser le système avec la configuration fournie
    coreRegistry.initialize(config);
    
    // Nettoyer lors du démontage du composant
    return () => {
      coreRegistry.cleanup();
    };
  }, [config]);
} 
