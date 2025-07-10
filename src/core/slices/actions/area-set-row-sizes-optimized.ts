import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { AreaRowLayout } from "../../../types/areaTypes";
import { withBatchUpdates, debouncedUpdate } from "../../utils/batchUpdates";

/**
 * Version optimisée de setRowSizes utilisant le système de batch updates
 * Optimisée pour les manipulations continues (drag & resize) avec debounce
 */
export const setRowSizesOptimized = (set: any) => (payload: { rowId: string; sizes: number[] }) => {
    const { rowId, sizes } = payload;
    
    // Pour les manipulations continues, utiliser debounce
    debouncedUpdate(() => {
        withBatchUpdates(() => {
            set((state: WritableDraft<RootStateType>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;
                
                const rowLayout = activeScreenAreas.layout[rowId];
                if (rowLayout && rowLayout.type === 'area_row') {
                    const typedRowLayout = rowLayout as AreaRowLayout;
                    if (typedRowLayout.areas.length === sizes.length) {
                        let totalSize = sizes.reduce((sum, size) => sum + size, 0);
                        if (Math.abs(totalSize - 1.0) > 0.001 && totalSize > 0) {
                            const scale = 1.0 / totalSize;
                            // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                            typedRowLayout.areas = typedRowLayout.areas.map((areaInfo, index) => ({
                                ...areaInfo,
                                size: sizes[index] * scale
                            }));
                        } else {
                            // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                            typedRowLayout.areas = typedRowLayout.areas.map((areaInfo, index) => ({
                                ...areaInfo,
                                size: sizes[index]
                            }));
                        }
                        state.lastUpdated = Date.now();
                    }
                }
            });
        });
    }, 16); // 16ms pour ~60fps
};

/**
 * Version synchrone pour les mises à jour finales (mouseup)
 */
export const setRowSizesFinal = (set: any) => (payload: { rowId: string; sizes: number[] }) => {
    withBatchUpdates(() => {
        set((state: WritableDraft<RootStateType>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;
            
            const rowLayout = activeScreenAreas.layout[payload.rowId];
            if (rowLayout && rowLayout.type === 'area_row') {
                const typedRowLayout = rowLayout as AreaRowLayout;
                if (typedRowLayout.areas.length === payload.sizes.length) {
                    let totalSize = payload.sizes.reduce((sum, size) => sum + size, 0);
                    if (Math.abs(totalSize - 1.0) > 0.001 && totalSize > 0) {
                        const scale = 1.0 / totalSize;
                        // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                        typedRowLayout.areas = typedRowLayout.areas.map((areaInfo, index) => ({
                            ...areaInfo,
                            size: payload.sizes[index] * scale
                        }));
                    } else {
                        // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                        typedRowLayout.areas = typedRowLayout.areas.map((areaInfo, index) => ({
                            ...areaInfo,
                            size: payload.sizes[index]
                        }));
                    }
                    state.lastUpdated = Date.now();
                }
            }
        });
    });
}; 
