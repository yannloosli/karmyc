import { combineReducers } from "redux";
import {
    compositionReducer,
    CompositionState,
    initialCompositionState,
} from "~/composition/compositionReducer";
import {
    compositionSelectionReducer,
    CompositionSelectionState,
    initialCompositionSelectionState,
} from "~/composition/compositionSelectionReducer";
import {
    contextMenuReducer,
    ContextMenuState,
    initialContextMenuState,
} from "~/contextMenu/contextMenuReducer";
import { flowReducer, FlowState, initialFlowState } from "~/flow/state/flowReducers";
import {
    flowSelectionReducer,
    FlowSelectionState,
    initialFlowSelectionState,
} from "~/flow/state/flowSelectionReducer";
import { initialProjectState, projectReducer, ProjectState } from "~/project/projectReducer";
import { initialShapeState, shapeReducer, ShapeState } from "~/shape/shapeReducer";
import {
    initialShapeSelectionState,
    shapeSelectionReducer,
    ShapeSelectionState,
} from "~/shape/shapeSelectionReducer";
import { ActionBasedState, createActionBasedReducer } from "~/state/history/actionBasedReducer";
import { createReducerWithHistory, HistoryState } from "~/state/history/historyReducer";
import { initialTimelineState, timelineReducer, TimelineState } from "~/timeline/timelineReducer";
import {
    initialTimelineSelectionState,
    timelineSelectionReducer,
    TimelineSelectionState,
} from "~/timeline/timelineSelectionReducer";
import { initialToolState, toolReducer, ToolState } from "~/toolbar/toolReducer";

declare global {
    interface ApplicationState {
        compositionState: HistoryState<CompositionState>;
        compositionSelectionState: HistoryState<CompositionSelectionState>;
        flowState: HistoryState<FlowState>;
        flowSelectionState: HistoryState<FlowSelectionState>;
        contextMenu: ActionBasedState<ContextMenuState>;
        project: HistoryState<ProjectState>;
        shapeState: HistoryState<ShapeState>;
        shapeSelectionState: HistoryState<ShapeSelectionState>;
        timelineState: HistoryState<TimelineState>;
        timelineSelectionState: HistoryState<TimelineSelectionState>;
        tool: ActionBasedState<ToolState>;
    }

    interface ActionState {
        compositionState: CompositionState;
        compositionSelectionState: CompositionSelectionState;
        flowState: FlowState;
        flowSelectionState: FlowSelectionState;
        contextMenu: ContextMenuState;
        project: ProjectState;
        shapeState: ShapeState;
        shapeSelectionState: ShapeSelectionState;
        timelineState: TimelineState;
        timelineSelectionState: TimelineSelectionState;
        tool: ToolState;
    }

    type MapApplicationState<StateProps, OwnProps = {}> = (
        state: ApplicationState,
        ownProps: OwnProps,
    ) => StateProps;

    type MapActionState<StateProps, OwnProps = {}> = (
        state: ActionState,
        ownProps: OwnProps,
    ) => StateProps;
}

const reducers = {
    compositionState: createReducerWithHistory(initialCompositionState, compositionReducer),
    compositionSelectionState: createReducerWithHistory(
        initialCompositionSelectionState,
        compositionSelectionReducer,
        { selectionForKey: "compositionState" },
    ),

    flowState: createReducerWithHistory(initialFlowState, flowReducer),
    flowSelectionState: createReducerWithHistory(initialFlowSelectionState, flowSelectionReducer, {
        selectionForKey: "flowState",
    }),

    contextMenu: createActionBasedReducer(initialContextMenuState, contextMenuReducer),

    project: createReducerWithHistory(initialProjectState, projectReducer),

    shapeState: createReducerWithHistory(initialShapeState, shapeReducer),
    shapeSelectionState: createReducerWithHistory(
        initialShapeSelectionState,
        shapeSelectionReducer,
        { selectionForKey: "shapeState" },
    ),

    timelineState: createReducerWithHistory(initialTimelineState, timelineReducer),
    timelineSelectionState: createReducerWithHistory(
        initialTimelineSelectionState,
        timelineSelectionReducer,
        { selectionForKey: "timelineState" },
    ),

    tool: createActionBasedReducer(initialToolState, toolReducer),
};

export default combineReducers<ApplicationState>(reducers);
