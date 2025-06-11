import { Dispatch, SetStateAction } from 'react';
import { IntercardinalDirection } from "../../types/directions";
import type { Rect } from "../../types";
interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}
export declare const handleAreaDragFromCorner: (e: MouseEvent, corner: IntercardinalDirection, areaId: string, viewport: Rect, // Initial viewport of the dragged area
setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>, setAreaResizing: (resizing: boolean) => void) => void;
export {};
