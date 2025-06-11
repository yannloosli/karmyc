import React, { Dispatch, SetStateAction } from "react";
import { AreaRowLayout } from "../types/areaTypes";
interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}
interface OwnProps {
    row: AreaRowLayout;
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
    offset: number;
}
type Props = OwnProps;
export declare const AreaRowSeparators: React.FC<Props>;
export {};
