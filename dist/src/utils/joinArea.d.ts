import { AreaLayout, AreaRowLayout } from "../types/areaTypes";
export declare const joinAreas: (row: AreaRowLayout, mergeArea: number, // This is the source area (the one being moved)
mergeInto: -1 | 1) => {
    area: AreaLayout;
    removedAreaId: string;
} | {
    area: AreaRowLayout;
    removedAreaId: string;
};
