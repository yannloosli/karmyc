import { useEffect } from 'react';
import { coreRegistry } from '../store/registries/coreRegistry';
import { IKarmycConfig } from '../types/karmyc';

/**
 * Hook to initialize and configure the Karmyc system
 */
export function useKarmycLayout(config: IKarmycConfig): void {
    useEffect(() => {
        // Initialize the system with the provided configuration
        coreRegistry.initialize(config);

        // Clean up when the component unmounts
        return () => {
            coreRegistry.cleanup();
        };
    }, [config]);
} 
