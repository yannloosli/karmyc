import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { AreaRowLayout } from "../../../types/areaTypes";


export const setRowSizes = (set: any) => (payload: { rowId: string; sizes: number[] }) => {
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
                    typedRowLayout.areas.forEach((areaInfo, index) => {
                        if (areaInfo) areaInfo.size = payload.sizes[index] * scale;
                    });
                } else {
                    typedRowLayout.areas.forEach((areaInfo, index) => {
                        if (areaInfo) areaInfo.size = payload.sizes[index];
                    });
                }
                state.lastUpdated = Date.now();
            }
        }
    })
}
