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

        // --- SUPPRESSION: Le bloc suivant ajoutait les zones initiales de manière redondante ---
        // const { areas: currentAreas, layout: currentLayout, addArea } = useKarmycStore.getState();
        // const layoutSize = Object.keys(currentLayout || {}).length;
        // const areasSize = Object.keys(currentAreas || {}).length;
        //
        // // Ajouter seulement si le layout/areas sont vides et qu'il y a des initialAreas
        // if (layoutSize === 0 && areasSize === 0 && config.initialAreas.length > 0) {
        //     console.log(`[useKarmyc] Ajout de ${config.initialAreas.length} zones initiales...`);
        //     config.initialAreas.forEach((areaData, index) => {
        //         // Construire l\'objet areaToAdd pas à pas
        //         const areaToAdd: Partial<Area<any>> = {
        //             id: `initial-${index}-${Date.now()}`,
        //             type: areaData.type,
        //             state: areaData.state || {},
        //         };
        //         // Ajouter les propriétés optionnelles si elles existent
        //         if (areaData.position) {
        //             areaToAdd.position = areaData.position;
        //         }
        //         // Ne pas ajouter areaData.size car le type ne le supporte pas ici
        //         // if (areaData.size) {
        //         //     areaToAdd.size = areaData.size;
        //         // }
        //
        //         console.log(`[useKarmyc] Ajout area:`, areaToAdd);
        //         // S\'assurer que l\'objet final correspond au type attendu par addArea
        //         addArea(areaToAdd as Area<any>);
        //     });
        // }
        // --- Fin Suppression ---

        // Clean up when component unmounts
        return () => {
            coreRegistry.cleanup();
        };
    }, [config]);

    // Return the configuration to be used with KarmycProvider
    return config;
} 
