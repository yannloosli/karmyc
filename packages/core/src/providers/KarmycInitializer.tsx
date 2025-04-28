import React, { useEffect, useRef } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { useArea } from '../hooks/useArea';
import { useAreaStore } from '../stores/areaStore';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

// Zones par défaut
const DEFAULT_AREAS = [
    {
        type: 'text-note',
        state: { content: '' },
        position: { x: 0, y: 0 }
    }
];

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {} }) => {
    const initialized = useRef(false);
    const { createArea } = useArea();

    useEffect(() => {
        if (initialized.current) return;
        initialized.current = true;

        // Register default plugins
        const defaultPlugins = [historyPlugin];
        const customPlugins = options.plugins || [];
        const allPlugins = [...defaultPlugins, ...customPlugins];

        const pluginIds: string[] = [];
        allPlugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
            pluginIds.push(plugin.id);
        });

        // Register custom validators
        if (options.validators) {
            options.validators.forEach(({ actionType, validator }) => {
                actionRegistry.registerValidator(actionType, validator);
            });
        }

        // Vérifier si le store est déjà initialisé (par ex. depuis localStorage)
        const storeState = useAreaStore.getState();
        const isAlreadyInitialized = storeState.rootId || Object.keys(storeState.layout || {}).length > 0;

        if (!isAlreadyInitialized) {
            console.log("[KarmycInitializer] Store is empty, initializing default/initial areas.");
            // Initialize areas only if the store is not already initialized
            const areasToInitialize = options.initialAreas || DEFAULT_AREAS;

            // Créer les zones
            areasToInitialize.forEach(area => {
                createArea(
                    area.type,
                    area.state,
                    area.position
                );
            });

            if (options.enableLogging) {
                console.log(`${areasToInitialize.length} zones initialized`);
            }
        } else {
            console.log("[KarmycInitializer] Store already initialized, skipping default/initial areas.");
        }

        if (options.enableLogging) {
            // Utiliser pluginIds qui est déjà disponible dans cette portée
            console.log('Karmyc initialized with:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0,
                initialAreas: isAlreadyInitialized ? 'skipped (loaded from storage)' : (options.initialAreas?.length || DEFAULT_AREAS.length),
                customReducers: options.customReducers ? Object.keys(options.customReducers).length : 0,
                keyboardShortcutsEnabled: options.keyboardShortcutsEnabled || false
            });
        }

        // Cleanup
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, []); // Toujours exécuter une seule fois

    return null;
}; 
