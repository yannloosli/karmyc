import { useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { Space, useSpaceStore } from '../stores/spaceStore';

/**
 * Hook for managing spaces using Zustand
 * Provides functions to manipulate spaces and access their state
 */
export function useSpace() {
    // Select state slices reactively using useStoreWithEqualityFn
    const spaces = useStoreWithEqualityFn(
        useSpaceStore,
        state => state.spaces,
        shallow
    ) as Record<string, Space>; // Cast might still be needed depending on selector result type

    const activeSpaceId = useStoreWithEqualityFn(
        useSpaceStore,
        state => state.activeSpaceId,
        shallow
    );

    // Select actions individually (references should be stable)
    const addSpaceAction = useSpaceStore(state => state.addSpace);
    const removeSpaceAction = useSpaceStore(state => state.removeSpace);
    const setActiveSpaceAction = useSpaceStore(state => state.setActiveSpace);
    const updateSpaceAction = useSpaceStore(state => state.updateSpace);
    const updateSpaceGenericSharedStateAction = useSpaceStore(state => state.updateSpaceGenericSharedState);

    // Memoize the derived space list
    const spaceList = useMemo(() => {
        return Object.entries(spaces).map(([id, space]) => ({ id, name: space.name }));
    }, [spaces]);

    // Define actions using useCallback with stable action references
    const createSpace = useCallback((name: string, initialSharedState = {}) => {
        return addSpaceAction({ name, sharedState: initialSharedState });
    }, [addSpaceAction]);

    const deleteSpace = useCallback((id: string) => {
        removeSpaceAction(id);
    }, [removeSpaceAction]);

    const setActive = useCallback((id: string | null) => {
        setActiveSpaceAction(id);
    }, [setActiveSpaceAction]);

    const updateSharedState = useCallback((spaceId: string, changes: Partial<Record<string, any>>) => {
        updateSpaceGenericSharedStateAction({ spaceId, changes });
    }, [updateSpaceGenericSharedStateAction]);

    const updateSpaceProperties = useCallback((id: string, changes: Partial<Omit<Space, 'id'>>) => {
        updateSpaceAction({ id, ...changes });
    }, [updateSpaceAction]);

    const getSpaceById = useCallback((id: string) => {
        return useSpaceStore.getState().spaces[id];
    }, []);

    return {
        // State
        spaceList,
        activeSpaceId,

        // Actions (return the useCallback-wrapped functions)
        createSpace,
        deleteSpace,
        setActive,
        updateSharedState,
        updateSpaceProperties,
        getSpaceById
    };
} 
