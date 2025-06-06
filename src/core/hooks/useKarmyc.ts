import { useEffect, useMemo } from 'react';
import { coreRegistry } from '../data/registries/coreRegistry';
import { IKarmycConfig, IKarmycOptions } from '../types/karmyc';

/**
 * Combined hook that provides both configuration and initialization for the Karmyc system.
 */
export function useKarmyc(options: IKarmycOptions = {}) {
    const config = useMemo(() => {
        return {
            // Default values
            plugins: options.plugins ?? [],
            validators: options.validators ?? [],
            initialAreas: options.initialAreas ?? [],
            keyboardShortcutsEnabled: options.keyboardShortcutsEnabled ?? true,
        };
    }, [
        options.plugins,
        options.validators,
        options.initialAreas,
        options.keyboardShortcutsEnabled
    ]);

    // Initialize the system and add initial areas
    useEffect(() => {
        // Convert config to IKarmycConfig expected by coreRegistry
        const coreConfig: IKarmycConfig = {
            areas: {
                types: [],
                layout: {}
            },
            actions: {
                plugins: config.plugins,
                validators: config.validators
            },
            contextMenu: {
                actions: []
            }
        };

        // Initialize the system with the provided configuration
        coreRegistry.initialize(coreConfig);

        // Clean up when component unmounts
        return () => {
            coreRegistry.cleanup();
        };
    }, [config]);

    // Return the configuration to be used with KarmycProvider
    return config;
} 
