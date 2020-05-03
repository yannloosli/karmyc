import { createAction } from "typesafe-actions";
import { TimelineKeyframe, TimelineKeyframeControlPoint } from "~/timeline/timelineTypes";
import { TimelineSelectionState } from "~/timeline/timelineSelectionReducer";

export const timelineActions = {
	setKeyframe: createAction("timeline/SET_KEYFRAME", (resolve) => {
		return (timelineId: string, keyframe: TimelineKeyframe) =>
			resolve({ timelineId, keyframe });
	}),

	setDragSelectRect: createAction("timeline/SET_DRAG_SELECT_RECT", (resolve) => {
		return (timelineId: string, rect: Rect) => resolve({ timelineId, rect });
	}),

	submitDragSelectRect: createAction("timeline/SUBMIT_DRAG_SELECT", (action) => {
		return (timelineId: string, additiveSelection: boolean) =>
			action({ timelineId, additiveSelection });
	}),

	setIndexAndValueShift: createAction("timeline/SET_SHIFT", (resolve) => {
		return (timelineId: string, indexShift: number, valueShift: number) =>
			resolve({ timelineId, indexShift, valueShift });
	}),

	submitIndexAndValueShift: createAction("timeline/SUBMIT_SHIFT", (resolve) => {
		return (timelineId: string, selection: TimelineSelectionState) =>
			resolve({ timelineId, selection });
	}),

	setYBounds: createAction("timeline/SET_Y_BOUNDS", (resolve) => {
		return (timelineId: string, yBounds: [number, number] | null) =>
			resolve({ timelineId, yBounds });
	}),

	setYPan: createAction("timeline/SET_Y_PAN", (resolve) => {
		return (timelineId: string, yPan: number) => resolve({ timelineId, yPan });
	}),

	clearSelection: createAction("timeline/CLEAR_SELECTION", (resolve) => {
		return (timelineId: string) => resolve({ timelineId });
	}),

	toggleKeyframeSelection: createAction("timeline/TOGGLE_KEYFRAME_SELECTION", (resolve) => {
		return (timelineId: string, keyframeId: string) => resolve({ timelineId, keyframeId });
	}),

	setKeyframeReflectControlPoints: createAction(
		"timeline/SET_KEYFRAME_REFLECT_CONTROL_POINTS",
		(resolve) => {
			return (timelineId: string, keyframeIndex: number, reflectControlPoints: boolean) =>
				resolve({ timelineId, keyframeIndex, reflectControlPoints });
		},
	),

	setKeyframeControlPoint: createAction("timeline/SET_KEYFRAME_CONTROL_POINT", (resolve) => {
		return (
			timelineId: string,
			keyframeIndex: number,
			direction: "left" | "right",
			controlPoint: TimelineKeyframeControlPoint | null,
		) => resolve({ timelineId, controlPoint, keyframeIndex, direction });
	}),
};
