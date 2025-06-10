import { useKarmycStore } from '../store/areaStore';

/**
 * Hook pour gérer la logique de stack des aires
 * @param areaId L'ID de l'aire à vérifier
 * @returns Un objet contenant les informations sur la stack
 */
export const useAreaStack = (areaId: string) => {
    const isChildOfStack = useKarmycStore(state => {
        const activeScreenLayout = state.screens[state.activeScreenId]?.areas.layout;
        if (!activeScreenLayout) return false;

        for (const [, layoutItem] of Object.entries(activeScreenLayout)) {
            if (layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.areas.some(areaRef => areaRef.id === areaId)) {
                return true;
            }
        }
        return false;
    });

    const stackData = useKarmycStore(state => {
        const activeScreenLayout = state.screens[state.activeScreenId]?.areas.layout;
        if (!activeScreenLayout) return null;

        for (const [layoutId, layoutItem] of Object.entries(activeScreenLayout)) {
            if (layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.areas.some(areaRef => areaRef.id === areaId)) {
                return {
                    layoutId,
                    layout: layoutItem,
                    areas: state.screens[state.activeScreenId]?.areas.areas || {}
                };
            }
        }
        return null;
    });

    return {
        isChildOfStack,
        stackData
    };
}; 
