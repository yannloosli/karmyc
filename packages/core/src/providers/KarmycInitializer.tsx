import React, { useEffect, useRef } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { useArea } from '../hooks/useArea';
import { useAreaStore } from '../stores/areaStore';
import { AreaRowLayout } from '../types/areaTypes';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

// Zones par défaut avec des types plus spécifiques si possible
const DEFAULT_AREAS = [
    {
        type: 'text-note',
        state: { content: 'Exemple de note' },
        position: undefined // Position initiale non nécessaire si on crée un layout
    },
    {
        type: 'color-picker',
        state: { color: '#aabbcc' },
        position: undefined
    },
    {
        type: 'image-viewer',
        state: { imageUrl: 'https://picsum.photos/200/200', caption: 'Image aléatoire' },
        position: undefined
    }
];

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {} }) => {
    const initialized = useRef(false);
    const { createArea } = useArea();

    useEffect(() => {
        if (initialized.current) {
            return;
        }
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

        // Vérifier si le store est déjà initialisé
        const storeState = useAreaStore.getState();
        const isAlreadyInitialized = storeState.rootId || Object.keys(storeState.layout || {}).length > 0;

        if (!isAlreadyInitialized) {
            const areasToInitialize = options.initialAreas || DEFAULT_AREAS;
            const newAreaIds: string[] = [];

            // 1. Créer les zones et stocker leurs IDs
            areasToInitialize.forEach((areaConfig, index) => {
                let newId: string | undefined;
                try {
                    // createArea renvoie l'ID de la zone créée (si l'action addArea le fait)
                    newId = createArea(
                        areaConfig.type,
                        areaConfig.state,
                        // Ignorer position si on crée un layout
                    );
                } catch (error) {
                    console.error(`[KarmycInitializer] Error calling createArea for area ${index + 1}:`, error);
                    newId = undefined; // Ensure newId is undefined on error
                }

                if (newId) {
                    newAreaIds.push(newId);
                } else {
                    console.warn(`[KarmycInitializer] Failed to create area or received empty/undefined ID for area ${index + 1}.`);
                }
            });

            // 2. Créer la structure de layout si des zones ont été ajoutées
            if (newAreaIds.length > 0) {
                const newRootId = `row-root-${Date.now()}`;
                const defaultRowLayout: AreaRowLayout = {
                    id: newRootId,
                    type: 'area_row',
                    orientation: 'horizontal', // Ou 'vertical'
                    // Répartir l'espace équitablement
                    areas: newAreaIds.map(areaId => ({ id: areaId, size: 1 / newAreaIds.length }))
                };

                // 3. Mettre à jour l'état du store directement via setState
                useAreaStore.setState(state => {
                    const newLayout = {
                        ...state.layout,
                        [newRootId]: defaultRowLayout,
                        ...newAreaIds.reduce((acc, id) => {
                            acc[id] = { type: 'area', id: id };
                            return acc;
                        }, {} as Record<string, { type: 'area', id: string }>)
                    };
                    return {
                        ...state,
                        rootId: newRootId,
                        layout: newLayout,
                        _id: state._id + newAreaIds.length
                    };
                }, false, 'KarmycInitializer/setDefaultLayout'); // Nommer l'action pour devtools


                if (options.enableLogging) {
                    console.log(`[KarmycInitializer] ${newAreaIds.length} zones initialized into layout ${newRootId}`);
                }
            } else {
                console.warn("[KarmycInitializer] No areas were successfully created (newAreaIds is empty). Skipping layout creation.");
                if (options.enableLogging) {
                    console.log("[KarmycInitializer] No default areas specified or created.");
                }
            }

        }

        if (options.enableLogging) {
            const finalStateForLogging = useAreaStore.getState();
            // Utiliser pluginIds qui est déjà disponible dans cette portée
            console.log('[KarmycInitializer] Initialization summary:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0,
                initialAreasStatus: isAlreadyInitialized ? 'skipped (loaded from storage)' : (`attempted: ${options.initialAreas?.length || DEFAULT_AREAS.length}, created: ${finalStateForLogging.rootId ? Object.keys(finalStateForLogging.areas).length : 0}`),
                customReducers: options.customReducers ? Object.keys(options.customReducers).length : 0,
                keyboardShortcutsEnabled: options.keyboardShortcutsEnabled || false,
                finalRootId: finalStateForLogging.rootId,
                finalLayoutKeys: Object.keys(finalStateForLogging.layout || {}).length,
                finalAreasKeys: Object.keys(finalStateForLogging.areas || {}).length
            });
        }

        // Cleanup
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, []); // Keep dependencies empty to run only once

    return null;
}; 
