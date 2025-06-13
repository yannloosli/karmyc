import { AreaLayout, AreaRowLayout } from "../../../types/areaTypes";
import { IArea } from "../../../types/areaTypes";
import { AreaTypeValue } from "../../../types/actions";
import { JoinPreviewState, setJoinPreview } from "../actions/areas-join-preview";
import { Rect } from "../../../types/math";
import { Point } from "../../../types/math";
import { splitArea, SplitResult } from "../actions/area-split";
import { CardinalDirection, IntercardinalDirection } from "../../../types/directions";
import { RootStateType } from "../../mainStore";
import { StateCreator } from "zustand";
import { PlaceArea } from "../../types/areas-type";
import { joinOrMoveArea } from "../actions/area-join-move";
import { addArea } from "../actions/add-area";
import { removeArea } from "../actions/remove-area";
import { finalizeAreaPlacement } from "../actions/area-finalize-placement";
import { setRowSizes } from "../actions/area-set-row-sizes";
import { updateLayout } from "../actions/area-update-layout";
import { setActiveArea } from "../actions/set-active-area";
import { updateArea } from "../actions/update-area";
import { setAreaToOpen } from "../actions/set-area-to-open";
import { updateAreaToOpenPosition } from "../actions/update-area-to-open-position";
import { cleanupTemporaryStates } from "../actions/cleanup-temporary-states";
import { setViewports } from "../actions/area-set-viewports";


export interface AreasState {
    _id: number; // Unique ID counter *within* this slice for this screen
    rootId: string | null;
    errors: string[];
    activeAreaId: string | null; // Area focused *within* this screen
    joinPreview: JoinPreviewState | null;
    layout: {
        [key: string]: AreaRowLayout | AreaLayout;
    };
    areas: {
        [key: string]: IArea<AreaTypeValue>;
    };
    viewports: { // Viewports are likely screen-specific
        [key: string]: Rect;
    };
    areaToOpen: null | {
        position: Point;
        area: {
            type: string;
            state: any & { sourceId?: string };
        };
    };
    lastSplitResultData: SplitResult | null;
    lastLeadAreaId?: string | null;
    isDetached?: boolean; // Flag to disable manipulations in detached windows
    isLocked?: boolean; // Flag for locking manipulations
}

interface AreasActions {
    addArea: (area: IArea<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<IArea<AreaTypeValue>> & { id: string }) => void;
    updateLayout: (layoutData: Partial<AreaRowLayout> & { id: string }) => void;
    setAreaToOpen: (payload: AreasState['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: (payload?: { targetId?: string; placement?: PlaceArea }) => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: { rowId: string; sizes: number[] }) => void;
    splitArea: (payload: {
        areaIdToSplit: string;
        parentRowId: string | null;
        horizontal: boolean;
        corner: IntercardinalDirection;
    }) => SplitResult | null;
    setJoinPreview: (payload: JoinPreviewState | null) => void;
    joinOrMoveArea: (payload: {
        sourceAreaId: string;
        targetAreaId: string;
        direction: CardinalDirection;
    }) => void;
    getLastSplitResult: () => SplitResult | null;

    // Selectors (signatures only, implementation in createAreaSlice)
    getActiveArea: () => IArea<AreaTypeValue> | null;
    getAreaById: (id: string) => IArea<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, IArea<AreaTypeValue>>;
    getAreaErrors: () => string[];
    getLastLeadAreaId: () => string | null;
}

export type AreasSlice = AreasState & AreasActions;

const initialState: AreasState = {
    // Data part
    _id: 0,
    rootId: null,
    errors: [],
    activeAreaId: null,
    joinPreview: null,
    layout: {},
    areas: {},
    viewports: {},
    areaToOpen: null,
    lastSplitResultData: null,
    lastLeadAreaId: null,
}

export const createAreasSlice: StateCreator<
    RootStateType, // le type global du store
    [],
    [],
    AreasSlice
> = (set, get) => ({
    ...initialState,

    setJoinPreview: setJoinPreview(set),
    splitArea: splitArea(set),
    addArea: addArea(set),
    removeArea: removeArea(set),
    setActiveArea: setActiveArea(set),
    updateArea: updateArea(set),
    updateLayout: updateLayout(set),
    setAreaToOpen: setAreaToOpen(set),
    updateAreaToOpenPosition: updateAreaToOpenPosition(set),
    finalizeAreaPlacement: finalizeAreaPlacement(set, get),
    cleanupTemporaryStates: cleanupTemporaryStates(set),
    setViewports: setViewports(set),
    setRowSizes: setRowSizes(set),
    joinOrMoveArea: joinOrMoveArea(set),

    getLastSplitResult: () => {
        // Selector needs access to active screen state via get()
        const activeScreenAreas = get().screens[get().activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.lastSplitResultData : null;
    },
    // --- SELECTORS (adapted to operate on active screen) ---
    getActiveArea: () => {
        const state = get(); // Get root state
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas && activeScreenAreas.activeAreaId
            ? activeScreenAreas.areas[activeScreenAreas.activeAreaId]
            : null;
    },
    getAreaById: (id) => {
        const state = get();
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.areas[id] : undefined;
    },
    getAllAreas: () => {
        const state = get();
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.areas : {};
    },
    getAreaErrors: () => {
        const state = get();
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas ? activeScreenAreas.errors : [];
    },
    getLastLeadAreaId: () => {
        const state = get();
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        return activeScreenAreas?.lastLeadAreaId || null;
    },
});
