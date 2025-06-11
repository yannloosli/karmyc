import React from 'react';
import { AreaTypeValue } from '../types/actions';
interface UseAreaDragAndDropParams {
    type?: AreaTypeValue;
    id?: string;
    state?: any;
}
declare const useAreaDragAndDrop: (params?: UseAreaDragAndDropParams) => {
    handleDragStart: (e: React.DragEvent) => void;
    handleDragOver: (e: React.DragEvent) => void;
    handleDragEnd: () => void;
    handleDrop: (e: React.DragEvent) => void;
    areaToOpenTargetId: string | null | undefined;
    areaToOpenTargetViewport: import("..").Rect | null;
    calculatedPlacement: import("../utils/areaUtils").PlaceArea;
};
export default useAreaDragAndDrop;
