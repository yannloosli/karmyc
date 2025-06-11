import React from "react";
import { Vec2 } from "../utils";
import { AreaToOpen } from "../types/areaTypes";
interface AreaPreviewProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
}
export declare const AreaPreview: React.FC<AreaPreviewProps>;
export {};
