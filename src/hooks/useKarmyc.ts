import React, { useEffect, useMemo, useRef, useCallback } from 'react';

import { AREA_ROLE } from '@core/types/actions';
import { useKarmycStore, initializeMainStore } from '@core/store';
import { IKarmycOptions, LayoutPreset } from '@core/types/karmyc';
import { setTranslationFunction } from '@core/utils/translation';
import { actionRegistry } from '@core/registries/actionRegistry';
import { historyPlugin } from '@core/plugins/historyPlugins';
import { validateArea } from '@core/utils/validation';
import { useArea } from '../hooks/useArea';

/**
 * Karmyc configuration with layouts.
 */
export interface IKarmycConfigWithLayouts {
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
 * Hook that centralizes Karmyc initialization and configuration logic.
 * Next.js compatible by avoiding hooks during hydration.
 */
export function useKarmyc(options: IKarmycOptions = {}, onError?: (error: Error) => void): IKarmycConfigWithLayouts {
    const { createArea } = useArea();
    const initialized = useRef(false);
    const optionsRef = useRef(options);
    const isClient = useRef(false);

    // Detect client-side
    useEffect(() => {
        isClient.current = true;
    }, []);

    // Update options ref only when they truly change
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Memoized area validation function
    const validateAreaConfig = useCallback((area: any): boolean => {
        // Validate role
        if (area.role && !Object.values(AREA_ROLE).includes(area.role)) {
            console.warn(`Invalid area ignored: unrecognized role "${area.role}"`);
            return false;
        }
        // Ensure type is defined
        if (!area.type) {
            console.warn('Invalid area ignored: missing type');
            return false;
        }
        return true;
    }, []);

    // Memoized area creation with validation
    const createAreaWithValidation = useCallback((areaConfig: any, index: number, seenAreaIds: Set<string>): string | undefined => {
        // Check for duplicate area IDs
        if (areaConfig.id && seenAreaIds.has(areaConfig.id)) {
            const error = new Error(`Duplicate area ID: ${areaConfig.id}`);
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error);
            return undefined;
        }

        if (!areaConfig || typeof areaConfig !== 'object') {
            const error = new Error(`Invalid area config at index ${index}`);
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error);
            return undefined;
        }

        // Add ID to the set after basic structural checks
        if (areaConfig.id) {
            seenAreaIds.add(areaConfig.id);
        }

        if (!areaConfig.type || typeof areaConfig.type !== 'string') {
            const error = new Error(`Invalid area type for area at index ${index}`);
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error);
            return undefined;
        }

        // Validate area configuration
        const validation = validateArea(areaConfig);
        if (!validation.isValid) {
            const error = new Error(`Invalid area configuration: ${validation.errors.join(', ')}`);
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error);
            return undefined;
        }

        try {
            return createArea(
                areaConfig.type,
                areaConfig.state || {},
                undefined,
                areaConfig.id
            );
        } catch (error) {
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error instanceof Error ? error : new Error(String(error)));
            return undefined;
        }
    }, [createArea, onError]);

    // Memoized plugin initialization
    const initializePlugins = useCallback((plugins: IKarmycOptions['plugins'] = []) => {
        const defaultPlugins = [historyPlugin];
        const allPlugins = [...defaultPlugins, ...plugins];

        allPlugins.forEach(plugin => {
            if (plugin && typeof plugin === 'object' && plugin.id) {
                actionRegistry.registerPlugin(plugin);
            }
        });
    }, []);

    // Memoized validators initialization
    const initializeValidators = useCallback((validators: IKarmycOptions['validators'] = []) => {
        validators.forEach(({ actionType, validator }) => {
            if (actionType && typeof validator === 'function') {
                actionRegistry.registerValidator(actionType, validator);
            }
        });
    }, []);

    // Memoized spaces validation
    const validateSpaces = useCallback((spaces: IKarmycOptions['spaces'] = {}) => {
        for (const [spaceId, spaceConfig] of Object.entries(spaces)) {
            if (!spaceConfig || typeof spaceConfig !== 'object' || !spaceConfig.name) {
                const error = new Error(`Invalid space configuration for space ${spaceId}`);
                console.error('[KarmycInitializer] Invalid area config', error);
                onError?.(error);
                return false;
            }
        }
        return true;
    }, [onError]);

    const config = useMemo(() => {
        // Filter invalid areas
        const validAreas = (optionsRef.current.initialAreas ?? []).filter(validateAreaConfig);

        return {
            plugins: optionsRef.current.plugins ?? [],
            validators: optionsRef.current.validators ?? [],
            initialAreas: validAreas,
            keyboardShortcutsEnabled: optionsRef.current.keyboardShortcutsEnabled ?? true,
            builtInLayouts: optionsRef.current.builtInLayouts ?? [],
            initialLayout: optionsRef.current.initialLayout ?? 'default',
            options: {
                resizableAreas: optionsRef.current.resizableAreas ?? true,
                manageableAreas: optionsRef.current.manageableAreas ?? true,
                multiScreen: optionsRef.current.multiScreen ?? true,
                builtInLayouts: optionsRef.current.builtInLayouts ?? []
            }
        };
    }, [validateAreaConfig]); // Optimized dependency

    // System initialization - client-side only
    useEffect(() => {
        if (!isClient.current || initialized.current) {
            return;
        }
        initialized.current = true;

        const initializeSystem = async () => {
            try {
                // Initialize store
                initializeMainStore(optionsRef.current);

                // Initialize translation system
                if (optionsRef.current.t) {
                    setTranslationFunction(optionsRef.current.t);
                }

                // Initialize plugins
                initializePlugins(optionsRef.current.plugins);

                // Initialize validators
                initializeValidators(optionsRef.current.validators);

                // Validate spaces before initializing areas
                if (!validateSpaces(optionsRef.current.spaces)) {
                    return; // Stop initialization if validation fails
                }

                // Initialize areas
                const storeState = useKarmycStore.getState();
                const activeScreenId = storeState.activeScreenId;
                const activeScreenAreasState = storeState.screens[activeScreenId]?.areas;
                const isAlreadyInitialized = activeScreenAreasState?.rootId || Object.keys(activeScreenAreasState?.areas || {}).length > 0;

                if (!isAlreadyInitialized) {
                    // Track seen IDs to detect duplicates
                    const seenAreaIds = new Set<string>();
                    const areasToInitialize = config.initialAreas;
                    const newAreaIds: string[] = [];

                    areasToInitialize.forEach((areaConfig, index) => {
                        const newId = createAreaWithValidation(areaConfig, index, seenAreaIds);
                        if (newId) {
                            newAreaIds.push(newId);
                        }
                    });

                    if (newAreaIds.length > 0) {
                        const defaultRowLayout = {
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
                                }, {} as Record<string, any>)
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

                // Update store options
                useKarmycStore.setState(state => ({
                    ...state,
                    options: {
                        ...config.options,
                        keyboardShortcutsEnabled: config.keyboardShortcutsEnabled,
                        builtInLayouts: config.builtInLayouts,
                        initialLayout: config.initialLayout
                    }
                }));
            } catch (error) {
                console.error('[KarmycInitializer] Error during initialization:', error);
                onError?.(error instanceof Error ? error : new Error(String(error)));
                // Reset store in case of error
                useKarmycStore.setState(state => ({
                    ...state,
                    options: createDefaultConfig().options
                }));
            }
        };

        initializeSystem();

        // Cleanup on unmount
        return () => {
            try {
                const storeState = useKarmycStore.getState();
                const options = storeState.options as IKarmycOptions;
                const pluginIds = (options.plugins || []).map((p: any) => p.id);
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
    }, [config, onError, createArea, initializePlugins, initializeValidators, validateSpaces, createAreaWithValidation]);

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
