import { AreaState } from "../store/slices/areaSlice";
import { AreaReducerState } from "../types/areaTypes";
import { CardinalDirection } from "../types/directions";

export const convertToReducerState = (state: AreaState): AreaReducerState => {
    return {
        rootId: state.rootId,
        areas: state.areas,
        layout: state.layout,
        joinPreview: state.joinPreview ? {
            areaId: state.joinPreview.areaId,
            direction: state.joinPreview.movingInDirection as CardinalDirection,
            eligibleAreaIds: state.joinPreview.eligibleAreaIds,
        } : undefined,
    };
}; 
