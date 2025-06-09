import { useEffect, useMemo } from 'react';
import { coreRegistry } from '../store/registries/coreRegistry';
import { IKarmycConfig, IKarmycOptions, LayoutPreset } from '../types/karmyc';
import { useKarmycStore } from '../store/areaStore';
import { AREA_ROLE } from '../types/actions';

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
        // Filtrer les zones invalides
        const validAreas = (options.initialAreas ?? []).filter(area => {
            // Vérifier si le rôle est valide
            if (area.role && !Object.values(AREA_ROLE).includes(area.role)) {
                console.warn(`Zone invalide ignorée: rôle "${area.role}" non reconnu`);
                return false;
            }
            // Vérifier si le type est défini
            if (!area.type) {
                console.warn('Zone invalide ignorée: type non défini');
                return false;
            }
            return true;
        });

        const config = {
            // Default values
            plugins: options.plugins ?? [],
            validators: options.validators ?? [],
            initialAreas: validAreas,
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
        let isMounted = true;

        const initializeSystem = async () => {
            try {
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
                await coreRegistry.initialize(coreConfig);

                if (!isMounted) return;

                // Update store options with validation
                const validOptions = {
                    ...config.options,
                    keyboardShortcutsEnabled: config.keyboardShortcutsEnabled,
                    builtInLayouts: config.builtInLayouts,
                    initialLayout: config.initialLayout
                };

                useKarmycStore.setState(state => ({
                    ...state,
                    options: validOptions
                }));
            } catch (error) {
                console.error('Erreur lors de l\'initialisation de Karmyc:', error);
                if (isMounted) {
                    // Réinitialiser le store en cas d'erreur
                    useKarmycStore.setState(state => ({
                        ...state,
                        options: createDefaultConfig().options
                    }));
                }
            }
        };

        initializeSystem();

        // Clean up when component unmounts
        return () => {
            isMounted = false;
            try {
                coreRegistry.cleanup();
            } catch (error) {
                console.error('Erreur lors du nettoyage de Karmyc:', error);
            }
        };
    }, [config]);

    // Return the configuration to be used with KarmycProvider
    return config;
}

function createDefaultConfig(): IKarmycConfigWithLayouts {
    return {
        plugins: [],
        validators: [],
        initialAreas: [],
        keyboardShortcutsEnabled: true,
        builtInLayouts: [],
        initialLayout: 'default',
        options: {
            resizableAreas: true,
            manageableAreas: true,
            multiScreen: true,
            builtInLayouts: []
        }
    };
} 
