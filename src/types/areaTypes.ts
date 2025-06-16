import { ComponentType } from "react";
import { AreaTypeValue } from "../core/types/actions";
import { AreaRole } from "../core/types/karmyc";
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
    state?: Record<string, any>;
    spaceId?: string | null;
    viewport?: Rect;
    position?: Point;
    size?: { width: number; height: number };
    raised?: boolean;
    role?: AreaRole;
    isLocked?: boolean;
    enableFullscreen?: boolean;
    previousLayout?: { [key: string]: AreaLayout | AreaRowLayout };
    previousRootId?: string | null;
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
