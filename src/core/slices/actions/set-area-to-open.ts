import { WritableDraft } from "immer";
import { AreaToOpen } from "../../../types/areaTypes";
import { RootStateType } from "../../../data/mainStore";


export const setAreaToOpen = (set: any) => (payload: AreaToOpen | null) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (activeScreenAreas && JSON.stringify(activeScreenAreas.areaToOpen) !== JSON.stringify(payload)) {
            activeScreenAreas.areaToOpen = payload;
            state.lastUpdated = Date.now();
        }
    })
}
