import React, { Dispatch, SetStateAction } from 'react';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { ResizePreviewState } from '../types/areaTypes';
interface AreaStackProps {
    id: string;
    layout: AreaRowLayout;
    areas: Record<string, IArea>;
    viewport: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}
export declare const AreaStack: React.FC<AreaStackProps>;
export {};
