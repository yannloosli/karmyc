import { WritableDraft } from "immer";
import { RootStateType } from "../../mainStore";
import { AreaRowLayout } from "../../../types/areaTypes";



export const updateLayout = (set: any) => (layoutData: Partial<AreaRowLayout> & { id: string }) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        const layout = activeScreenAreas.layout[layoutData.id];
        if (layout && layout.type === 'area_row') {
            const before = JSON.stringify(layout);
            // Update only the provided properties
            if (layoutData.activeTabId !== undefined) {
                layout.activeTabId = layoutData.activeTabId;
            }
            if (layoutData.areas !== undefined) {
                layout.areas = layoutData.areas;
            }
            const after = JSON.stringify(layout);
            if (before !== after) {
                activeScreenAreas.errors = [];
                state.lastUpdated = Date.now();
            }
        } else {
            activeScreenAreas.errors = [`Layout with ID ${layoutData.id} not found or not a row.`];
        }
    })
}
