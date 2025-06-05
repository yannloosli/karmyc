import React, { useEffect, useRef } from 'react';
import { historyPlugin } from '../../spaces/types';
import { actionRegistry } from '../actions/handlers/actionRegistry';
import { useArea } from '../../areas/hooks/useArea';
import { useKarmycStore } from '../data/areaStore';
import { AreaRowLayout } from '../types/areaTypes';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

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

        if (options.validators) {
            options.validators.forEach(({ actionType, validator }) => {
                actionRegistry.registerValidator(actionType, validator);
            });
        }

        const storeState = useKarmycStore.getState();
        const activeScreenId = storeState.activeScreenId;
        const activeScreenAreasState = storeState.screens[activeScreenId]?.areas;
        const isAlreadyInitialized = activeScreenAreasState?.rootId || Object.keys(activeScreenAreasState?.areas || {}).length > 0;

        if (!isAlreadyInitialized) {
            const areasToInitialize = options.initialAreas || [];
            const newAreaIds: string[] = [];

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

            if (newAreaIds.length > 0) {
                const defaultRowLayout: AreaRowLayout = {
                    id: 'root',
                    type: 'area_row',
                    orientation: 'horizontal', // Ou 'vertical'
                    areas: newAreaIds.map(areaId => ({ id: areaId, size: 1 / newAreaIds.length }))
                };

                useKarmycStore.setState(state => {
                    if (!state.screens[state.activeScreenId]?.areas) {
                        console.error(`[KarmycInitializer] Active screen areas ${state.activeScreenId} not found during layout update.`);
                        return state; // Ne rien changer
                    }

                    const newLayoutMap = {
                        ...(state.screens[state.activeScreenId].areas.layout || {}),
                        ['root']: defaultRowLayout,
                        ...newAreaIds.reduce((acc, id) => {

                            if (!acc[id]) {
                                acc[id] = { type: 'area', id: id };
                            }
                            return acc;
                        }, {} as Record<string, AreaRowLayout | { type: 'area'; id: string }>)
                    };

                    state.screens[state.activeScreenId].areas.rootId = 'root';
                    state.screens[state.activeScreenId].areas.layout = newLayoutMap;


                    return state;

                }, false, 'KarmycInitializer/setDefaultLayout');

            } else {
                console.warn("[KarmycInitializer] No areas were successfully created (newAreaIds is empty). Skipping layout creation.");
            }
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
