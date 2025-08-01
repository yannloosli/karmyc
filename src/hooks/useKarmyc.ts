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
 * Configuration Karmyc avec layouts.
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
 * Hook qui centralise toute la logique d'initialisation et de configuration du système Karmyc.
 * Compatible avec Next.js en évitant les hooks pendant l'hydratation.
 */
export function useKarmyc(options: IKarmycOptions = {}, onError?: (error: Error) => void): IKarmycConfigWithLayouts {
    const { createArea } = useArea();
    const initialized = useRef(false);
    const optionsRef = useRef(options);
    const isClient = useRef(false);

    // Vérifier si on est côté client
    useEffect(() => {
        isClient.current = true;
    }, []);

    // Mettre à jour la référence des options uniquement si elles changent réellement
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Mémoriser la fonction de validation des zones
    const validateAreaConfig = useCallback((area: any): boolean => {
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
    }, []);

    // Mémoriser la fonction de création de zone
    const createAreaWithValidation = useCallback((areaConfig: any, index: number, seenAreaIds: Set<string>): string | undefined => {
        // Vérification des doublons d'ID de zone
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

        // Ajouter l'ID à l'ensemble après les vérifications structurelles de base
        if (areaConfig.id) {
            seenAreaIds.add(areaConfig.id);
        }

        if (!areaConfig.type || typeof areaConfig.type !== 'string') {
            const error = new Error(`Invalid area type for area at index ${index}`);
            console.error('[KarmycInitializer] Invalid area config', error);
            onError?.(error);
            return undefined;
        }

        // Valider la configuration de la zone
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

    // Mémoriser la fonction d'initialisation des plugins
    const initializePlugins = useCallback((plugins: IKarmycOptions['plugins'] = []) => {
        const defaultPlugins = [historyPlugin];
        const allPlugins = [...defaultPlugins, ...plugins];

        allPlugins.forEach(plugin => {
            if (plugin && typeof plugin === 'object' && plugin.id) {
                actionRegistry.registerPlugin(plugin);
            }
        });
    }, []);

    // Mémoriser la fonction d'initialisation des validateurs
    const initializeValidators = useCallback((validators: IKarmycOptions['validators'] = []) => {
        validators.forEach(({ actionType, validator }) => {
            if (actionType && typeof validator === 'function') {
                actionRegistry.registerValidator(actionType, validator);
            }
        });
    }, []);

    // Mémoriser la fonction de validation des espaces
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
        // Filtrer les zones invalides
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
    }, [validateAreaConfig]); // Dépendance optimisée

    // Initialisation du système - seulement côté client
    useEffect(() => {
        if (!isClient.current || initialized.current) {
            return;
        }
        initialized.current = true;

        const initializeSystem = async () => {
            try {
                // Initialiser le store
                initializeMainStore(optionsRef.current);

                // Initialiser le système de traduction
                if (optionsRef.current.t) {
                    setTranslationFunction(optionsRef.current.t);
                }

                // Initialiser les plugins
                initializePlugins(optionsRef.current.plugins);

                // Initialiser les validateurs
                initializeValidators(optionsRef.current.validators);

                // Validation des espaces avant toute initialisation d'aires
                if (!validateSpaces(optionsRef.current.spaces)) {
                    return; // Arrêter l'initialisation si validation échoue
                }

                // Initialiser les zones
                const storeState = useKarmycStore.getState();
                const activeScreenId = storeState.activeScreenId;
                const activeScreenAreasState = storeState.screens[activeScreenId]?.areas;
                const isAlreadyInitialized = activeScreenAreasState?.rootId || Object.keys(activeScreenAreasState?.areas || {}).length > 0;

                if (!isAlreadyInitialized) {
                    // Conserver les IDs déjà rencontrés afin de détecter les doublons
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

                // Mettre à jour les options du store
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
                // Réinitialiser le store en cas d'erreur
                useKarmycStore.setState(state => ({
                    ...state,
                    options: createDefaultConfig().options
                }));
            }
        };

        initializeSystem();

        // Nettoyage lors du démontage
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
