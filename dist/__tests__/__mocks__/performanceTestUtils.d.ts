import React from 'react';
import { AreaRole } from '../../src/types';
import { IKarmycOptions } from '../../src/types/karmyc';
export declare const generateUniqueId: () => string;
export declare const resetIdCounter: () => void;
export declare const TestComponent: React.FC<{
    areas?: any[];
    onConfigReady?: (config: any) => void;
    options?: IKarmycOptions;
}>;
export declare const createGridAreas: (rows: number, cols: number) => {
    areas: {
        type: string;
        role: AreaRole;
        id: string;
    }[];
    layout: {
        rootRow: {
            type: "area_row";
            id: string;
            orientation: "vertical";
            areas: {
                id: string;
                size: number;
            }[];
        };
        gridRows: {
            type: "area_row";
            id: string;
            orientation: "horizontal";
            areas: {
                id: string;
                size: number;
            }[];
        }[];
    };
};
export declare const measurePerformance: (callback: () => Promise<void>) => Promise<number>;
export declare const assertPerformance: (time: number, maxTime: number, operation: string) => void;
