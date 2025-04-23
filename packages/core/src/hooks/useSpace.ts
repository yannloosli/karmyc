import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    addSpace,
    removeSpace,
    selectActiveSpace,
    selectActiveSpaceId,
    selectAllSpaces,
    selectSpaceById,
    setActiveSpace,
    Space,
    updateSpace,
    updateSpaceGenericSharedState
} from '../store/slices/spaceSlice';

/**
 * Hook for managing spaces
 * Provides functions to manipulate spaces and access their state
 */
export function useSpace() {
    const dispatch = useDispatch();

    // Selectors
    const spaces = useSelector(selectAllSpaces);
    const activeSpace = useSelector(selectActiveSpace);
    const activeSpaceId = useSelector(selectActiveSpaceId);

    /**
     * Create a new space
     * @param name The name of the space
     * @param initialSharedState Initial shared state for the space
     * @returns The ID of the created space
     */
    const createSpace = useCallback((name: string, initialSharedState = {}) => {
        const spaceData = {
            name,
            sharedState: initialSharedState
        };

        dispatch(addSpace(spaceData));
        // Note: The actual ID is generated in the reducer
        // We could implement a way to return the generated ID if needed
    }, [dispatch]);

    /**
     * Delete a space
     * @param id ID of the space to delete
     */
    const deleteSpace = useCallback((id: string) => {
        dispatch(removeSpace(id));
    }, [dispatch]);

    /**
     * Set the active space
     * @param id ID of the space to set as active, or null for no active space
     */
    const setActive = useCallback((id: string | null) => {
        dispatch(setActiveSpace(id));
    }, [dispatch]);

    /**
     * Update the shared state of a space
     * @param spaceId ID of the space to update
     * @param changes Changes to apply to the space's shared state
     */
    const updateSharedState = useCallback((spaceId: string, changes: Partial<Record<string, any>>) => {
        dispatch(updateSpaceGenericSharedState({ spaceId, changes }));
    }, [dispatch]);

    /**
     * Update a space's properties
     * @param id ID of the space to update
     * @param changes Changes to apply to the space
     */
    const updateSpaceProperties = useCallback((id: string, changes: Partial<Omit<Space, 'id'>>) => {
        dispatch(updateSpace({ id, changes }));
    }, [dispatch]);

    /**
     * Get a space by its ID
     * @param id The space ID
     * @returns The space object, or undefined if not found
     */
    const getSpaceById = useCallback((id: string) => {
        return useSelector(selectSpaceById(id));
    }, []);

    return {
        // State
        spaces,
        activeSpace,
        activeSpaceId,

        // Actions
        createSpace,
        deleteSpace,
        setActive,
        updateSharedState,
        updateSpaceProperties,
        getSpaceById
    };
} 
