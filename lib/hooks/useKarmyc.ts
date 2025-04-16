import { useEffect, useMemo } from 'react';
import { coreRegistry } from '../store/registries/coreRegistry';
import { IKarmycConfig, IKarmycOptions } from '../types/karmyc';

/**
 * Combined hook that provides both configuration and initialization for the Karmyc system.
 * 
 * This hook simplifies setup by combining the functionality of useKarmycLayoutProvider 
 * and useKarmycLayout into a single hook.
 */
export function useKarmyc(options: IKarmycOptions = {}) {
    // Create memoized configuration (like useKarmycLayoutProvider)
    const config = useMemo(() => {
        return {
            // Default values
            enableLogging: options.enableLogging ?? false,
            plugins: options.plugins ?? [],
            validators: options.validators ?? [],
            initialAreas: options.initialAreas ?? [],
            customReducers: options.customReducers ?? {},
            keyboardShortcutsEnabled: options.keyboardShortcutsEnabled ?? true,
        };
    }, [
        options.enableLogging,
        options.plugins,
        options.validators,
        options.initialAreas,
        options.customReducers,
        options.keyboardShortcutsEnabled
    ]);

    // Initialize the system (like useKarmycLayout)
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
