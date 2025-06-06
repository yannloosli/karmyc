import { useCallback } from 'react';
import { AreaTypeValue, AREA_ROLE } from '../../core/types/actions';
import { useKarmycStore } from '../../core/data/areaStore';
import { IArea } from '../../core/types/areaTypes';
import { useSpaceStore } from '../../spaces/spaceStore';
import { areaRegistry } from '../../core/data/registries/areaRegistry';

/**
 * Hook for managing areas
 * Provides functions to manipulate areas and access their state
 */
export function useArea() {
    const {
        addArea,
        removeArea: removeAreaAction,
        setActiveArea,
        updateArea,
        getActiveArea,
        getAreaById,
        getAllAreas,
        getAreaErrors
    } = useKarmycStore();

    const createArea = useCallback((type: AreaTypeValue, state: any, position?: { x: number, y: number }): string => {
        const area: IArea<AreaTypeValue> = {
            id: '',
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
                // Utiliser le dernier espace actif ou le premier disponible
                const activeSpaceId = useSpaceStore.getState().activeSpaceId;
                area.spaceId = activeSpaceId || existingSpaces[0];
            } else {
                // Créer un nouvel espace seulement s'il n'y en a aucun
                const newSpaceId = useSpaceStore.getState().addSpace({
                    name: `Space for ${type}`,
                    sharedState: {}
                });
                if (newSpaceId) {
                    area.spaceId = newSpaceId;
                }
            }
        }

        return addArea(area);
    }, [addArea]);

    const removeArea = useCallback((id: string) => {
        removeAreaAction(id);
    }, [removeAreaAction]);

    const setActive = useCallback((id: string | null) => {
        setActiveArea(id);
    }, [setActiveArea]);

    const update = useCallback((id: string, changes: Partial<IArea<AreaTypeValue>>) => {
        updateArea({ id, ...changes });
    }, [updateArea]);

    const getActive = useCallback(() => {
        return getActiveArea();
    }, [getActiveArea]);

    const getById = useCallback((id: string) => {
        return getAreaById(id);
    }, [getAreaById]);

    const getAll = useCallback(() => {
        return getAllAreas();
    }, [getAllAreas]);

    const getErrors = useCallback(() => {
        return getAreaErrors();
    }, [getAreaErrors]);

    return {
        createArea,
        removeArea,
        setActive,
        update,
        getActive,
        getById,
        getAll,
        getErrors
    };
} 
