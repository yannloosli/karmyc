import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { AreaRowLayout } from "../../../types/areaTypes";
import { withBatchUpdates } from "../../utils/batchUpdates";

/**
 * Version optimisée de updateLayout utilisant le système de batch updates
 * Pour les réorganisations de layout complexes
 */
export const updateLayoutOptimized = (set: any) => (payload: Partial<AreaRowLayout> & { id: string }) => {
    withBatchUpdates(() => {
        set((state: WritableDraft<RootStateType>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;

            const { id, ...updateData } = payload;
            const existingLayout = activeScreenAreas.layout[id];

            if (existingLayout && existingLayout.type === 'area_row') {
                // Mise à jour d'un row existant
                Object.assign(existingLayout, updateData);
                
                // Normaliser les tailles si les areas ont changé
                if (updateData.areas && updateData.areas.length > 0) {
                    const totalSize = updateData.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                    if (totalSize > 0 && Math.abs(totalSize - 1.0) > 0.001) {
                        const factor = 1.0 / totalSize;
                        // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                        const normalizedAreas = updateData.areas.map(area => ({
                            ...area,
                            size: (area.size || 0) * factor
                        }));
                        existingLayout.areas = normalizedAreas;
                    }
                }
            } else if (existingLayout && existingLayout.type === 'area') {
                // Mise à jour d'une area simple
                Object.assign(existingLayout, updateData);
            } else {
                // Créer une nouvelle entrée de layout
                activeScreenAreas.layout[id] = updateData as AreaRowLayout;
            }

            state.lastUpdated = Date.now();
        });
    });
}; 
