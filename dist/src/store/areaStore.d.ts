import type { WritableDraft } from 'immer';
import { IArea, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types/math';
import { AreaTypeValue } from '../types/actions';
import { PlaceArea } from '../utils/areaUtils';
import { IKarmycOptions, LayoutPreset } from '../types/karmyc';
export interface JoinPreviewState {
    areaId: string | null;
    movingInDirection: CardinalDirection | null;
    eligibleAreaIds: string[];
}
interface SplitResult {
    newRowId: string;
    separatorIndex: number;
}
export interface AreaSliceStateData {
    _id: number;
    rootId: string | null;
    errors: string[];
    activeAreaId: string | null;
    joinPreview: JoinPreviewState | null;
    layout: {
        [key: string]: AreaRowLayout | AreaLayout;
    };
    areas: {
        [key: string]: IArea<AreaTypeValue>;
    };
    viewports: {
        [key: string]: Rect;
    };
    areaToOpen: null | {
        position: Point;
        area: {
            type: string;
            state: any & {
                sourceId?: string;
            };
        };
    };
    lastSplitResultData: SplitResult | null;
    lastLeadAreaId?: string | null;
    isDetached?: boolean;
    isLocked?: boolean;
}
export interface AreaSliceState extends AreaSliceStateData {
    addArea: (area: IArea<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<IArea<AreaTypeValue>> & {
        id: string;
    }) => void;
    updateLayout: (layoutData: Partial<AreaRowLayout> & {
        id: string;
    }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: (payload?: {
        targetId?: string;
        placement?: PlaceArea;
    }) => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: {
        rowId: string;
        sizes: number[];
    }) => void;
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
    getActiveArea: () => IArea<AreaTypeValue> | null;
    getAreaById: (id: string) => IArea<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, IArea<AreaTypeValue>>;
    getAreaErrors: () => string[];
    getLastLeadAreaId: () => string | null;
}
export declare const initialAreaSliceState: AreaSliceState;
interface ScreenState {
    areas: AreaSliceStateData;
    isDetached?: boolean;
    detachedFromAreaId?: string;
    isLocked?: boolean;
}
export declare const createInitialScreenState: () => ScreenState;
export type RootState = {
    screens: Record<string, ScreenState>;
    activeScreenId: string;
    nextScreenId: number;
    windowId?: string;
    options: IKarmycOptions;
    lastUpdated: number;
    layout_preset: LayoutPreset[];
    addScreen: () => void;
    switchScreen: (screenId: string) => void;
    removeScreen: (screenId: string) => void;
    duplicateScreen: (screenId: string) => void;
    detachArea: (areaId: string) => void;
    addArea: (area: IArea<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<IArea<AreaTypeValue>> & {
        id: string;
    }) => void;
    updateLayout: (layoutData: Partial<AreaRowLayout> & {
        id: string;
    }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: (payload?: {
        targetId?: string;
        placement?: PlaceArea;
    }) => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: {
        rowId: string;
        sizes: number[];
    }) => void;
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
    getActiveArea: () => IArea<AreaTypeValue> | null;
    getAreaById: (id: string) => IArea<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, IArea<AreaTypeValue>>;
    getAreaErrors: () => string[];
    findParentRowAndIndices: (layout: AreaSliceStateData['layout'], sourceAreaId: string, targetAreaId: string) => {
        parentRow: AreaRowLayout | null;
        sourceIndex: number;
        targetIndex: number;
    };
};
export declare function findParentRowAndIndices(layout: AreaSliceStateData['layout'], sourceAreaId: string, targetAreaId: string): {
    parentRow: AreaRowLayout | null;
    sourceIndex: number;
    targetIndex: number;
};
export declare const useKarmycStore: import("zustand").UseBoundStore<Omit<Omit<Omit<import("zustand").StoreApi<RootState>, "setState"> & {
    setState(nextStateOrUpdater: RootState | Partial<RootState> | ((state: WritableDraft<RootState>) => void), shouldReplace?: boolean | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<RootState, unknown>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: RootState) => void) => () => void;
        onFinishHydration: (fn: (state: RootState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<RootState, unknown>>;
    };
}, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(nextStateOrUpdater: RootState | Partial<RootState> | ((state: WritableDraft<RootState>) => void), shouldReplace?: boolean | undefined, action?: A | undefined): void;
}>;
export declare const initializeKarmycStore: (optionsParam?: Partial<IKarmycOptions>) => void;
export {};
