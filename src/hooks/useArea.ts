import React, { useCallback } from 'react';
import { AreaTypeValue, AREA_ROLE } from '../core/types/actions';
import { useKarmycStore } from '../core/store';
import { IArea } from '../types/areaTypes';
import { useSpaceStore } from '../core/spaceStore';
import { areaRegistry } from '../core/registries/areaRegistry';

/**
 * Représente une position d'area.
 */
export interface Position {
    x: number;
    y: number;
}

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

    const createArea = useCallback((type: AreaTypeValue, state: any, position?: Position, id?: string): string => {
        // Vérifier si le type est valide
        const registeredTypes = areaRegistry.getRegisteredTypes();
        if (!registeredTypes.has(type)) {
            // Au lieu de bloquer la création, on journalise une erreur et on poursuit.
            console.error(`[useArea] Invalid area type: ${type}`);
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
                // Utiliser le dernier espace actif ou le premier disponible
                const activeSpaceId = useSpaceStore.getState().activeSpaceId;
                area.spaceId = activeSpaceId || existingSpaces[0];
            } else {
                // Create a new space only if there are none
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
