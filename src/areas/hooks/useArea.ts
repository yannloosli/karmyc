import { useCallback } from 'react';
import { AreaTypeValue } from '../types';
import { useKarmycStore } from '../stores/areaStore';
import { IArea } from '../types/areaTypes';

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
