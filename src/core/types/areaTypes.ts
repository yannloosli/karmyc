import { ComponentType } from "react";
import { AreaTypeValue, AreaRole } from "./actions";
import { Point, Rect } from ".";

export interface AreaComponentProps<T = any> {
    id: string;
    state: T;
    type: string;
    viewport: Rect;
    raised?: boolean;
    Component: ComponentType<any>;
}

export interface IArea<T extends AreaTypeValue = AreaTypeValue> {
    id: string;
    type: T;
    state: any;
    spaceId?: string | null;
    viewport?: Rect;
    position?: Point;
    size?: { width: number; height: number };
    raised?: boolean;
    role?: AreaRole;
    isLocked?: boolean;
}

export interface AreaLayout {
    id: string;
    type: "area";
}

export interface AreaRowLayout {
    type: "area_row";
    id: string;
    areas: Array<{
        id: string;
        size: number;
    }>;
    orientation: "horizontal" | "vertical" | "stack";
    activeTabId?: string;
}

export interface AreaToOpen {
    position: Point;
    area: {
        type: string;
        state: any;
    };
}

export interface AreaState {
    type: string;
    state: any;
}

export interface AreaReducerState {
    areas: {
        [key: string]: any;
    };
    layout: {
        [key: string]: {
            type: string;
        };
    };
    areaToOpen: AreaToOpen | null;
    rootId: string | null;
}

export interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
} 
