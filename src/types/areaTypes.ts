import { ComponentType } from "react";
import { Vec2 } from "../utils/math/vec2";
import { Rect } from "./math";

export interface AreaComponentProps<T = any> {
    id: string;
    state: T;
    type: string;
    viewport: Rect;
    raised?: boolean;
    Component: ComponentType<any>;
}

export interface Area<T extends string> {
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
} 
