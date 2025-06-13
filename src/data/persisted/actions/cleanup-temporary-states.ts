import { WritableDraft } from "immer";
import { RootStateType } from "../../mainStore";


export const cleanupTemporaryStates = (set: any) => () => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (activeScreenAreas && (activeScreenAreas.joinPreview || activeScreenAreas.areaToOpen || activeScreenAreas.lastSplitResultData)) {
            activeScreenAreas.joinPreview = null;
            activeScreenAreas.areaToOpen = null;
            activeScreenAreas.lastSplitResultData = null;
            state.lastUpdated = Date.now();
        }
    })
}
