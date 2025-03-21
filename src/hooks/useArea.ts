import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    addArea,
    removeArea,
    selectActiveArea,
    selectAllAreas,
    selectAreaById,
    setActiveArea,
    updateArea
} from '../store/slices/areaSlice';
import { IArea } from '../types/karmyc';

/**
 * Hook pour gérer les zones
 * Fournit des fonctions pour manipuler les zones et accéder à leur état
 */
export function useArea() {
    const dispatch = useDispatch();

    // Sélecteurs
    const areas = useSelector(selectAllAreas);
    const activeArea = useSelector(selectActiveArea);

    // Actions
    const addNewArea = useCallback((area: IArea) => {
        dispatch(addArea(area));
    }, [dispatch]);

    const deleteArea = useCallback((id: string) => {
        dispatch(removeArea(id));
    }, [dispatch]);

    const updateExistingArea = useCallback((id: string, changes: Partial<IArea>) => {
        dispatch(updateArea({ id, changes }));
    }, [dispatch]);

    const activateArea = useCallback((id: string | null) => {
        dispatch(setActiveArea(id));
    }, [dispatch]);

    const getAreaById = useCallback((id: string) => {
        return useSelector(selectAreaById(id));
    }, []);

    return {
        // État
        areas,
        activeArea,

        // Actions
        addNewArea,
        deleteArea,
        updateExistingArea,
        activateArea,
        getAreaById,
    };
} 
