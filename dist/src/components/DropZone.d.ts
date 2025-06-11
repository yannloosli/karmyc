import React from "react";
import { Vec2 } from "../utils";
import { AreaToOpen } from "../types/areaTypes";
interface DropZoneProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    setAreaToOpenDimensions: (dimensions: Vec2) => void;
}
export declare const DropZone: React.FC<DropZoneProps>;
export {};
