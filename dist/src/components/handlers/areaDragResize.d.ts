import { Dispatch, SetStateAction } from 'react';
import { AreaRowLayout } from "../../types/areaTypes";
interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}
export declare const handleDragAreaResize: (row: AreaRowLayout, horizontal: boolean, areaIndex: number, // 1 is the first separator
setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>) => void;
export {};
