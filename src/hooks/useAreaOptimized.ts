import React, { useCallback, useMemo } from 'react';
import { AreaTypeValue, AREA_ROLE } from '../core/types/actions';
import { useKarmycStore } from '../core/store';
import { IArea } from '../types/areaTypes';
import { useSpaceStore } from '../core/spaceStore';
import { areaRegistry } from '../core/registries/areaRegistry';

/**
 * Représente une position d'area.
 */
export interface AreaPosition {
    x: number;
    y: number;
}

// Hooks spécialisés avec sélecteurs optimisés

/**
 * Hook pour obtenir une zone spécifique par ID
 */
export const useAreaById = (areaId: string) => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.areas[areaId];
    });
};

/**
 * Hook pour obtenir le layout d'une zone
 */
export const useAreaLayoutById = (areaId: string) => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.layout[areaId];
    });
};

/**
 * Hook pour obtenir la zone active
 */
export const useActiveArea = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        const activeAreaId = activeScreenAreas?.activeAreaId;
        return activeAreaId ? activeScreenAreas?.areas[activeAreaId] : null;
    });
};

/**
 * Hook pour obtenir toutes les zones
 */
export const useAllAreas = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.areas || {};
    });
};

/**
 * Hook pour obtenir tous les layouts
 */
export const useAllLayouts = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.layout || {};
    });
};

/**
 * Hook pour obtenir les erreurs de zones
 */
export const useAreaErrors = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.errors || [];
    });
};

/**
 * Hook pour obtenir la zone racine
 */
export const useRootArea = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        const rootId = activeScreenAreas?.rootId;
        return rootId ? activeScreenAreas?.areas[rootId] : null;
    });
};

/**
 * Hook pour obtenir le layout de la zone racine
 */
export const useRootAreaLayout = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        const rootId = activeScreenAreas?.rootId;
        return rootId ? activeScreenAreas?.layout[rootId] : null;
    });
};

/**
 * Hook pour obtenir les viewports
 */
export const useAreaViewports = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.viewports || {};
    });
};

/**
 * Hook pour obtenir la zone à ouvrir
 */
export const useAreaToOpen = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.areaToOpen;
    });
};

/**
 * Hook pour obtenir le preview de jointure
 */
export const useJoinPreview = () => {
    return useKarmycStore((state) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.joinPreview;
    });
};

/**
 * Hook pour obtenir l'ID de l'écran actif
 */
export const useActiveScreenId = () => {
    return useKarmycStore((state) => state.activeScreenId);
};

/**
 * Hook pour obtenir les actions de zones
 */
export const useAreaActions = () => {
    return useKarmycStore((state) => ({
        addArea: state.addArea,
        removeArea: state.removeArea,
        setActiveArea: state.setActiveArea,
        updateArea: state.updateArea,
        updateLayout: state.updateLayout,
        setAreaToOpen: state.setAreaToOpen,
        updateAreaToOpenPosition: state.updateAreaToOpenPosition,
        finalizeAreaPlacement: state.finalizeAreaPlacement,
        cleanupTemporaryStates: state.cleanupTemporaryStates,
        setJoinPreview: state.setJoinPreview,
        joinOrMoveArea: state.joinOrMoveArea,
        splitArea: state.splitArea,
        setRowSizes: state.setRowSizes,
        setViewports: state.setViewports,
    }));
};

/**
 * Hook principal optimisé pour la gestion des zones
 */
export function useAreaOptimized() {
    const actions = useAreaActions();

    const createArea = useCallback((type: AreaTypeValue, state: any, position?: AreaPosition, id?: string): string => {
        // Vérifier si le type est valide
        const registeredTypes = areaRegistry.getRegisteredTypes();
        if (!registeredTypes.has(type)) {
            console.error(`[useAreaOptimized] Invalid area type: ${type}`);
        }

        const area: IArea<AreaTypeValue> = {
            id: id || '',
            type,
            state,
            position
        };

        // Si c'est une area LEAD, on s'assure qu'elle a un espace
        const roleMap = (areaRegistry as any)._roleMap || {};
        if (roleMap[type] === AREA_ROLE.LEAD) {
            const spaces = useSpaceStore.getState().spaces;
            const existingSpaces = Object.keys(spaces);
            if (existingSpaces.length > 0) {
                const activeSpaceId = useSpaceStore.getState().activeSpaceId;
                area.spaceId = activeSpaceId || existingSpaces[0];
            } else {
                const newSpaceId = useSpaceStore.getState().addSpace({
                    name: `Space for ${type}`,
                    sharedState: {}
                });
                if (newSpaceId) {
                    area.spaceId = newSpaceId;
                }
            }
        }
        return actions.addArea(area);
    }, [actions.addArea]);

    const removeArea = useCallback((id: string) => {
        actions.removeArea(id);
    }, [actions.removeArea]);

    const setActive = useCallback((id: string | null) => {
        actions.setActiveArea(id);
    }, [actions.setActiveArea]);

    const update = useCallback((id: string, changes: Partial<IArea<AreaTypeValue>>) => {
        actions.updateArea({ id, ...changes });
    }, [actions.updateArea]);

    return {
        // Actions
        createArea,
        removeArea,
        setActive,
        update,
        
        // Actions directes (sans removeArea qui est déjà défini)
        addArea: actions.addArea,
        setActiveArea: actions.setActiveArea,
        updateArea: actions.updateArea,
        updateLayout: actions.updateLayout,
        setAreaToOpen: actions.setAreaToOpen,
        updateAreaToOpenPosition: actions.updateAreaToOpenPosition,
        finalizeAreaPlacement: actions.finalizeAreaPlacement,
        cleanupTemporaryStates: actions.cleanupTemporaryStates,
        setJoinPreview: actions.setJoinPreview,
        joinOrMoveArea: actions.joinOrMoveArea,
        splitArea: actions.splitArea,
        setRowSizes: actions.setRowSizes,
        setViewports: actions.setViewports,
    };
} 
