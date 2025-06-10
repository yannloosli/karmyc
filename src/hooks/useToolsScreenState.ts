import { useKarmycStore } from '../store/areaStore';

/**
 * Hook pour gérer l'état des écrans dans ToolsSlot
 * @returns Les états et actions nécessaires pour les écrans dans ToolsSlot
 */
export const useToolsScreenState = () => {
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const isDetached = useKarmycStore((state) => state.screens[activeScreenId]?.isDetached) || false;
    const multiScreen = useKarmycStore((state) => state.options.multiScreen) || false;

    return {
        activeScreenId,
        isDetached,
        multiScreen
    };
}; 
