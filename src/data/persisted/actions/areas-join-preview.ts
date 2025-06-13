import { WritableDraft } from "immer";
import { CardinalDirection } from "../../../types/directions";
import { RootStateType } from "../../mainStore";



export interface JoinPreviewState {
    areaId: string | null;
    movingInDirection: CardinalDirection | null;
    eligibleAreaIds: string[];
}


export const setJoinPreview = (set: any) => (payload: JoinPreviewState | null) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (activeScreenAreas && activeScreenAreas.joinPreview !== payload) {
            activeScreenAreas.joinPreview = payload;
            state.lastUpdated = Date.now();
        }
    })
};
