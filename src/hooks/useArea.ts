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
 * Hook pour gérer les zones
 * Fournit des fonctions pour manipuler les zones et accéder à leur état
 * 
 * @returns Un objet contenant les fonctions et les données pour manipuler les zones
 */
export function useArea() {
    const dispatch = useDispatch();

    // Sélecteurs
    const areas = useSelector(selectAllAreas);
    const activeArea = useSelector(selectActiveArea);

    // Actions
    const createArea = useCallback((areaType: string, initialState?: any, position?: { x: number, y: number }) => {
        console.log(`Création d'une zone de type ${areaType}`, { initialState, position });

        // Utiliser l'état initial par défaut si non fourni
        const state = initialState || areaRegistry.getInitialState(areaType);

        // Utiliser la taille par défaut du type de zone
        const defaultSize = areaRegistry.getDefaultSize(areaType) || { width: 300, height: 200 };

        console.log(`Taille par défaut pour ${areaType}:`, defaultSize);
        console.log(`État initial pour ${areaType}:`, state);

        // Générer un id unique pour la zone
        const id = `area-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const area = {
            id,
            type: areaType,
            state,
            position: position || { x: 0, y: 0 },
            size: defaultSize
        };

        console.log(`Envoi de l'action addArea avec la zone:`, area);

        // @ts-ignore - Ignorer les erreurs de typage pour le moment
        dispatch(addArea(area));

        return id;
    }, [dispatch]);

    const deleteArea = useCallback((id: string) => {
        dispatch(removeArea(id));
    }, [dispatch]);

    const updateAreaState = useCallback((id: string, changes: Partial<any>) => {
        dispatch(updateArea({ id, changes: { state: changes } }));
    }, [dispatch]);

    const setActive = useCallback((id: string | null) => {
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
        createArea,
        deleteArea,
        updateAreaState,
        setActive,
        getAreaById,
    };
} 
