import { WritableDraft } from "immer";
import { Point } from "../../../types/math";
import { RootStateType } from "../../store";


export const updateAreaToOpenPosition = (set: any) => (position: Point) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (activeScreenAreas?.areaToOpen && (activeScreenAreas.areaToOpen.position.x !== position.x || activeScreenAreas.areaToOpen.position.y !== position.y)) {
            activeScreenAreas.areaToOpen.position = position;
        }
    })
}
