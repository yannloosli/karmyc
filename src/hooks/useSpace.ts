import { useCallback, useMemo } from 'react';
import { shallow } from 'zustand/shallow';
import { useStoreWithEqualityFn } from 'zustand/traditional';

import { Space, useSpaceStore } from '../core/spaceStore';

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
    ) as Record<string, Space>;

    const activeSpaceId = useStoreWithEqualityFn(
        useSpaceStore,
        state => state.activeSpaceId,
        shallow
    );

    const openSpaceIds = useStoreWithEqualityFn(
        useSpaceStore,
        state => state.openSpaceIds,
        shallow
    );

    const pilotMode = useStoreWithEqualityFn(
        useSpaceStore,
        state => state.pilotMode,
        shallow
    );

    // Select actions individually (references should be stable)
    const addSpaceAction = useSpaceStore(state => state.addSpace);
    const removeSpaceAction = useSpaceStore(state => state.removeSpace);
    const setActiveSpaceAction = useSpaceStore(state => state.setActiveSpace);
    const openSpaceAction = useSpaceStore(state => state.openSpace);
    const closeSpaceAction = useSpaceStore(state => state.closeSpace);
    const updateSpaceAction = useSpaceStore(state => state.updateSpace);
    const updateSpaceGenericSharedStateAction = useSpaceStore(state => state.updateSpaceGenericSharedState);

    // Memoize the derived space list
    const spaceList = useMemo(() => {
        return Object.entries(spaces).map(([id, space]) => ({ id, name: space.name }));
    }, [spaces]);

    // Memoize the list of open spaces
    const openSpaces = useMemo(() => {
        return openSpaceIds
            .map(id => spaces[id])
            .filter((space): space is Space => space !== undefined);
    }, [spaces, openSpaceIds]);

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

    const openSpace = useCallback((id: string) => {
        openSpaceAction(id);
    }, [openSpaceAction]);

    const closeSpace = useCallback((id: string) => {
        closeSpaceAction(id);
    }, [closeSpaceAction]);

    const updateSharedState = useCallback((spaceId: string, changes: Partial<Record<string, any>>) => {
        updateSpaceGenericSharedStateAction({ spaceId, changes });
    }, [updateSpaceGenericSharedStateAction]);

    const updateSpaceProperties = useCallback((id: string, changes: Partial<Omit<Space, 'id'>>) => {
        updateSpaceAction({ id, ...changes });
    }, [updateSpaceAction]);

    const getSpaceById = useCallback((id: string) => {
        return useSpaceStore.getState().spaces[id];
    }, []);

    const setPilotMode = useCallback((mode: 'MANUAL' | 'AUTO') => {
        useSpaceStore.getState().setPilotMode(mode);
    }, []);

    return {
        // State
        spaceList,
        activeSpaceId,
        openSpaces,
        openSpaceIds,
        pilotMode,

        // Actions
        createSpace,
        deleteSpace,
        setActive,
        setPilotMode,
        openSpace,
        closeSpace,
        updateSharedState,
        updateSpaceProperties,
        getSpaceById
    };
} 
