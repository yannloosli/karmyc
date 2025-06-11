import { Vec2 } from "./vec2";
import { AreaReducerState, Rect } from "../types";
export type PlaceArea = "top" | "left" | "right" | "bottom" | "stack";
export declare const getHoveredAreaId: (position: Vec2, areaState: AreaReducerState, areaToViewport: {
    [areaId: string]: Rect;
}, draggedElementDimensions?: Vec2) => string | undefined;
export declare function getAreaToOpenPlacementInViewport(viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
}, position: Vec2): PlaceArea;
