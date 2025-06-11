import { AreaLayout, AreaRowLayout } from "../types/areaTypes";
type Layout = AreaLayout | AreaRowLayout;
export declare const computeAreaRowToMinSize: (rootId: string, areaLayout: Record<string, Layout>) => {
    [areaId: string]: {
        width: number;
        height: number;
    };
};
export {};
