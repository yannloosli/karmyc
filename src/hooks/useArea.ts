import React, { useCallback, useMemo } from 'react';
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
    // Mémoriser les actions pour éviter les re-créations
    const actions = useMemo(() => {
        const {
            addArea,
            removeArea: removeAreaAction,
            setActiveArea,
            updateArea,
            getActiveArea,
            getAreaById,
            getAllAreas,
            getAreaErrors
        } = useKarmycStore.getState();

        return {
            addArea,
            removeAreaAction,
            setActiveArea,
            updateArea,
            getActiveArea,
            getAreaById,
            getAllAreas,
            getAreaErrors
        };
    }, []);

    const createArea = useCallback((type: AreaTypeValue, state: any, position?: Position, id?: string): string => {
        // Vérifier si le type est valide et utiliser un fallback si nécessaire
        const validType = areaRegistry.getFallbackType(type);
        if (validType !== type) {
            console.warn(`[useArea] Using fallback type "${validType}" for invalid type "${type}"`);
        }

        const area: IArea<AreaTypeValue> = {
            id: id || '',
            type: validType as AreaTypeValue,
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
        return actions.addArea(area);
    }, [actions.addArea]);

    const removeArea = useCallback((id: string) => {
        actions.removeAreaAction(id);
    }, [actions.removeAreaAction]);

    const setActive = useCallback((id: string | null) => {
        actions.setActiveArea(id);
    }, [actions.setActiveArea]);

    const update = useCallback((id: string, changes: Partial<IArea<AreaTypeValue>>) => {
        actions.updateArea({ id, ...changes });
    }, [actions.updateArea]);

    const getActive = useCallback(() => {
        return actions.getActiveArea();
    }, [actions.getActiveArea]);

    const getById = useCallback((id: string) => {
        return actions.getAreaById(id);
    }, [actions.getAreaById]);

    const getAll = useCallback(() => {
        return actions.getAllAreas();
    }, [actions.getAllAreas]);

    const getErrors = useCallback(() => {
        return actions.getAreaErrors();
    }, [actions.getAreaErrors]);

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
