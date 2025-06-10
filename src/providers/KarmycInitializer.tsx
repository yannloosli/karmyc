import React, { useEffect, useRef } from 'react';
import { historyPlugin } from '../types/spaceTypes';
import { actionRegistry } from '../actions/handlers/actionRegistry';
import { useArea } from '../hooks/useArea';
import { useKarmycStore } from '../store/areaStore';
import { AreaRowLayout } from '../types/areaTypes';
import { IKarmycOptions } from '../types/karmyc';
import { IActionPlugin } from '../types/actions';
import { validateArea } from '../utils/validation';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
    children?: React.ReactNode;
    onError?: (error: Error) => void;
}

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {}, children, onError }) => {
    const initialized = useRef(false);
    const { createArea } = useArea();

    useEffect(() => {
        if (initialized.current) {
            return;
        }
        initialized.current = true;

        try {
            // Register default plugins
            const defaultPlugins = [historyPlugin];
            const customPlugins = options.plugins || [];
            const allPlugins = [...defaultPlugins, ...customPlugins];

            const pluginIds: string[] = [];
            allPlugins.forEach(plugin => {
                if (plugin && typeof plugin === 'object' && plugin.id) {
                    actionRegistry.registerPlugin(plugin);
                    pluginIds.push(plugin.id);
                }
            });

            if (options.validators) {
                options.validators.forEach(({ actionType, validator }) => {
                    if (actionType && typeof validator === 'function') {
                        actionRegistry.registerValidator(actionType, validator);
                    }
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
                    if (!areaConfig || typeof areaConfig !== 'object') {
                        const error = new Error(`Invalid area config at index ${index}`);
                        console.error('[KarmycInitializer] Invalid area config', error);
                        onError?.(error);
                        return;
                    }

                    if (!areaConfig.type || typeof areaConfig.type !== 'string') {
                        const error = new Error(`Invalid area type for area at index ${index}`);
                        console.error('[KarmycInitializer] Invalid area config', error);
                        onError?.(error);
                        return;
                    }

                    // Valider la configuration de la zone
                    const validation = validateArea(areaConfig);
                    if (!validation.isValid) {
                        const error = new Error(`Invalid area configuration: ${validation.errors.join(', ')}`);
                        console.error('[KarmycInitializer] Invalid area config', error);
                        onError?.(error);
                        return;
                    }

                    let newId: string | undefined;
                    try {
                        newId = createArea(
                            areaConfig.type,
                            areaConfig.state || {},
                            undefined,
                            areaConfig.id
                        );
                    } catch (error) {
                        console.error('[KarmycInitializer] Invalid area config', error);
                        onError?.(error instanceof Error ? error : new Error(String(error)));
                        return;
                    }
                    if (newId) {
                        newAreaIds.push(newId);
                    } else {
                        const error = new Error(`Failed to create area at index ${index}`);
                        console.error('[KarmycInitializer] Invalid area config', error);
                        onError?.(error);
                    }
                });

                if (newAreaIds.length > 0) {
                    const defaultRowLayout: AreaRowLayout = {
                        id: 'root',
                        type: 'area_row',
                        orientation: 'horizontal',
                        areas: newAreaIds.map(areaId => ({ id: areaId, size: 1 / newAreaIds.length }))
                    };

                    useKarmycStore.setState(state => {
                        if (!state.screens[state.activeScreenId]?.areas) {
                            const error = new Error(`Active screen areas ${state.activeScreenId} not found during layout update.`);
                            onError?.(error);
                            return state;
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

                        return {
                            ...state,
                            screens: {
                                ...state.screens,
                                [state.activeScreenId]: {
                                    ...state.screens[state.activeScreenId],
                                    areas: {
                                        ...state.screens[state.activeScreenId].areas,
                                        rootId: 'root',
                                        layout: newLayoutMap
                                    }
                                }
                            }
                        };
                    }, false, 'KarmycInitializer/setDefaultLayout');
                }
            }
        } catch (error) {
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
        }

        // Cleanup
        return () => {
            try {
                const storeState = useKarmycStore.getState();
                const options = storeState.options as IKarmycOptions;
                const pluginIds = (options.plugins || []).map((p: IActionPlugin) => p.id);
                pluginIds.forEach((id: string) => {
                    if (id) {
                        actionRegistry.unregisterPlugin(id);
                    }
                });
            } catch (error) {
                console.error('[KarmycInitializer] Error during cleanup:', error);
                onError?.(error instanceof Error ? error : new Error(String(error)));
            }
        };
    }, [onError]); // Add onError to dependencies

    // Toujours rendre les enfants, même en cas d'erreur
    return <>{children}</>;
}; 
