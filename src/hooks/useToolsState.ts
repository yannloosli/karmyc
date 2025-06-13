import { useCallback } from 'react';
import { useKarmycStore } from '../data/mainStore';
import { useSpaceStore } from '../store/spaceStore';

/**
 * Hook pour gérer l'état des outils
 * @param areaId L'ID de l'aire
 * @returns Les états et actions nécessaires pour les outils
 */
export const useToolsState = (areaId?: string) => {
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const multiScreen = useKarmycStore((state) => state.options.multiScreen) || false;

    // Get the area ID and its associated space
    const currentArea = useKarmycStore(state => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return undefined;
        // Activation of space by focus only applies to areas with an ID
        return areaId ? Object.values(activeScreenAreas.areas).find(area => area.id === areaId) : undefined;
    });
    const currentSpaceId = currentArea?.spaceId;

    // Focus manager to activate space
    const handleFocus = useCallback(() => {
        if (currentSpaceId) {
            useSpaceStore.getState().setActiveSpace(currentSpaceId);
        }
    }, [currentSpaceId]);

    return {
        activeScreenId,
        isDetached,
        multiScreen,
        currentArea,
        currentSpaceId,
        handleFocus,
        isFullscreen: currentArea?.enableFullscreen ?? false
    };
}; 
