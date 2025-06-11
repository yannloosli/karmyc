import React, { Dispatch, SetStateAction } from "react";
import { ResizePreviewState } from "../types/areaTypes";
import { Rect } from "../types";
interface OwnProps {
    id: string;
    viewport: Rect;
}
interface AreaContainerProps extends OwnProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}
export declare const Area: React.FC<AreaContainerProps>;
export {};
