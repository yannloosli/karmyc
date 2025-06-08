import { useEffect, useMemo } from 'react';
import { coreRegistry } from '../store/registries/coreRegistry';
import { IKarmycConfig, IKarmycOptions, LayoutPreset } from '../types/karmyc';
import { useKarmycStore } from '../store/areaStore';

interface IKarmycConfigWithLayouts {
    plugins: IKarmycOptions['plugins'];
    validators: IKarmycOptions['validators'];
    initialAreas: IKarmycOptions['initialAreas'];
    keyboardShortcutsEnabled: boolean;
    builtInLayouts: LayoutPreset[];
    initialLayout: string;
    options: {
        resizableAreas: boolean;
        manageableAreas: boolean;
        multiScreen: boolean;
        builtInLayouts: LayoutPreset[];
    };
}

/**
 * Combined hook that provides both configuration and initialization for the Karmyc system.
 */
export function useKarmyc(options: IKarmycOptions = {}): IKarmycConfigWithLayouts {
    const config = useMemo(() => {
        const config = {
            // Default values
            plugins: options.plugins ?? [],
            validators: options.validators ?? [],
            initialAreas: options.initialAreas ?? [],
            keyboardShortcutsEnabled: options.keyboardShortcutsEnabled ?? true,
            builtInLayouts: options.builtInLayouts ?? [],
            initialLayout: options.initialLayout ?? 'default',
            options: {
                resizableAreas: options.resizableAreas ?? true,
                manageableAreas: options.manageableAreas ?? true,
                multiScreen: options.multiScreen ?? true,
                builtInLayouts: options.builtInLayouts ?? []
            }
        };

        return config;
    }, [
        options.plugins,
        options.validators,
        options.initialAreas,
        options.keyboardShortcutsEnabled,
        options.builtInLayouts,
        options.initialLayout,
        options.resizableAreas,
        options.manageableAreas,
        options.multiScreen
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

        // Update store options
        useKarmycStore.setState(state => ({
            ...state,
            options: config.options
        }));

        // Clean up when component unmounts
        return () => {
            coreRegistry.cleanup();
        };
    }, [config]);

    // Return the configuration to be used with KarmycProvider
    return config;
} 
