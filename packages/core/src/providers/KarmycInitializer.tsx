import React, { useEffect, useRef } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { useArea } from '../hooks/useArea';
import { useKarmycStore } from '../stores/areaStore'; // Utiliser le store principal
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

        // Vérifier si le store est déjà initialisé pour l'écran actif
        const storeState = useKarmycStore.getState();
        const activeScreenId = storeState.activeScreenId;
        const activeScreenAreasState = storeState.screens[activeScreenId]?.areas;
        // Initialized means having a rootId OR having areas defined
        const isAlreadyInitialized = activeScreenAreasState?.rootId || Object.keys(activeScreenAreasState?.areas || {}).length > 0;

        if (!isAlreadyInitialized) {
            const areasToInitialize = options.initialAreas || DEFAULT_AREAS;
            const newAreaIds: string[] = [];

            // 1. Créer les zones et stocker leurs IDs (les actions d'area fonctionnent sur l'écran actif)
            areasToInitialize.forEach((areaConfig, index) => {
                let newId: string | undefined;
                try {
                    newId = createArea(
                        areaConfig.type,
                        areaConfig.state
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
                    areas: newAreaIds.map(areaId => ({ id: areaId, size: 1 / newAreaIds.length }))
                };

                // 3. Mettre à jour SEULEMENT rootId et layout de l'écran actif via setState
                // Les areas et _id ont déjà été mis à jour par les appels à addArea (via createArea)
                useKarmycStore.setState(state => {
                    if (!state.screens[state.activeScreenId]?.areas) {
                        console.error(`[KarmycInitializer] Active screen areas ${state.activeScreenId} not found during layout update.`);
                        return state; // Ne rien changer
                    }
                    // Créer le nouveau layout map complet
                    const newLayoutMap = {
                        ...(state.screens[state.activeScreenId].areas.layout || {}),
                        [newRootId]: defaultRowLayout,
                        ...newAreaIds.reduce((acc, id) => {
                            // Assurer que chaque zone ajoutée a aussi une entrée layout simple
                            if (!acc[id]) {
                                acc[id] = { type: 'area', id: id };
                            }
                            return acc;
                        }, {} as Record<string, AreaRowLayout | { type: 'area'; id: string }>)
                    };

                    // Mettre à jour uniquement rootId et layout pour l'écran actif
                    state.screens[state.activeScreenId].areas.rootId = newRootId;
                    state.screens[state.activeScreenId].areas.layout = newLayoutMap;

                    // Ne PAS toucher à state.screens[state.activeScreenId].areas.areas ni ._id ici

                    return state; // Retourner le state racine modifié

                }, false, 'KarmycInitializer/setDefaultLayout');

                if (options.enableLogging) {
                    console.log(`[KarmycInitializer] ${newAreaIds.length} zones initialized into layout ${newRootId} for screen ${activeScreenId}`);
                }
            } else {
                console.warn("[KarmycInitializer] No areas were successfully created (newAreaIds is empty). Skipping layout creation.");
                if (options.enableLogging) {
                    console.log("[KarmycInitializer] No default areas specified or created.");
                }
            }
        }

        if (options.enableLogging) {
            const finalStateForLogging = useKarmycStore.getState();
            const finalActiveScreenAreasState = finalStateForLogging.screens[finalStateForLogging.activeScreenId]?.areas;
            // Utiliser pluginIds qui est déjà disponible dans cette portée
            console.log('[KarmycInitializer] Initialization summary:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0,
                initialAreasStatus: isAlreadyInitialized ? 'skipped (loaded from storage)' : (`attempted: ${options.initialAreas?.length || DEFAULT_AREAS.length}, created: ${finalActiveScreenAreasState?.rootId ? Object.keys(finalActiveScreenAreasState.areas || {}).length : 0}`),
                customReducers: options.customReducers ? Object.keys(options.customReducers).length : 0,
                keyboardShortcutsEnabled: options.keyboardShortcutsEnabled || false,
                finalRootId: finalActiveScreenAreasState?.rootId,
                finalLayoutKeys: Object.keys(finalActiveScreenAreasState?.layout || {}).length,
                finalAreasKeys: Object.keys(finalActiveScreenAreasState?.areas || {}).length
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
