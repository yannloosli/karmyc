import { ComponentType } from "react";
import { AreaType } from "~/core/constants";
import { Rect, Vec2 } from "./math";

export interface AreaComponentProps<T = any> {
    id: string;
    state: T;
    type: AreaType;
    viewport: Rect;
    raised?: boolean;
    Component: ComponentType<any>;
}

export interface Area<T extends AreaType> {
    id: string;
    type: T;
    state: any;
    viewport?: Rect;
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
    orientation: "horizontal" | "vertical";
}

export interface AreaToOpen {
    position: Vec2;
    area: {
        type: AreaType;
        state: any;
    };
}

export interface AreaState {
    type: AreaType;
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
} 
