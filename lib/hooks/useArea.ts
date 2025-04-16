import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { areaRegistry } from '../area/registry';
import {
    addArea,
    removeArea,
    selectActiveArea,
    selectAllAreas,
    selectAreaById,
    setActiveArea,
    updateArea
} from '../store/slices/areaSlice';

/**
 * Hook for managing areas
 * Provides functions to manipulate areas and access their state
 */
export function useArea() {
    const dispatch = useDispatch();

    // Selectors
    const areas = useSelector(selectAllAreas);
    const activeArea = useSelector(selectActiveArea);

    // Actions
    const createArea = useCallback((areaType: string, initialState?: any, position?: { x: number, y: number }) => {
        // Use default initial state if not provided
        const state = initialState || areaRegistry.getInitialState(areaType);

        // Use default size for the area type
        const defaultSize = areaRegistry.getDefaultSize(areaType) || { width: 300, height: 200 };

        // Generate a unique id for the area
        const id = `area-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const area = {
            id,
            type: areaType,
            state,
            position: position || { x: 0, y: 0 },
            size: defaultSize
        };

        // @ts-ignore - Ignore type errors for now
        dispatch(addArea(area));

        return id;
    }, [dispatch]);

    const deleteArea = useCallback((id: string) => {
        dispatch(removeArea(id));
    }, [dispatch]);

    const updateAreaState = useCallback((id: string, changes: Partial<any>) => {
        console.log('updateAreaState appelé avec:', id, changes);
        dispatch(updateArea({ id, changes: { state: changes } }));
    }, [dispatch]);

    const setActive = useCallback((id: string | null) => {
        dispatch(setActiveArea(id));
    }, [dispatch]);

    const getAreaById = useCallback((id: string) => {
        return useSelector(selectAreaById(id));
    }, []);

    return {
        // State
        areas,
        activeArea,

        // Actions
        createArea,
        deleteArea,
        updateAreaState,
        setActive,
        getAreaById,
    };
} 
