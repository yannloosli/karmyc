import React from 'react';
import { IArea, AreaRowLayout } from '../types/areaTypes';
interface AreaTabsProps {
    rowId: string;
    row: AreaRowLayout;
    areas: Record<string, IArea>;
}
export declare const AreaTabs: React.FC<AreaTabsProps>;
export {};
