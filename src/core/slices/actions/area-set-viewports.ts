import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { Rect } from "../../../types/math";


export const setViewports = (set: any) => (viewports: Record<string, Rect>) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        activeScreenAreas.viewports = viewports;
    })
}
