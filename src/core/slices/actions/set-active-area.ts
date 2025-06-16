import { WritableDraft } from "immer";
import { RootStateType } from "../../../data/mainStore";
import { AREA_ROLE } from "../../types/actions";


export const setActiveArea = (set: any) => (id: string | null) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        if (id === null || activeScreenAreas.areas[id]) {
            if (activeScreenAreas.activeAreaId !== id) {
                activeScreenAreas.activeAreaId = id;
                if (id && activeScreenAreas.areas[id]?.role === AREA_ROLE.LEAD) {
                    activeScreenAreas.lastLeadAreaId = id;
                }
                activeScreenAreas.errors = [];
                state.lastUpdated = Date.now();
            }
        }
    })
}
