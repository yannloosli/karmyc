import React, { Dispatch, SetStateAction } from "react";
import { AreaComponentProps, ResizePreviewState } from "../types/areaTypes";
interface AreaComponentOwnProps extends AreaComponentProps {
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
    isChildOfStack: boolean;
}
export declare const AreaComponent: React.FC<AreaComponentOwnProps>;
export {};
