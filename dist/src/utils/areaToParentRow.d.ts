import { AreaLayout, AreaRowLayout } from "../types/areaTypes";
export declare function computeAreaToParentRow(layout: {
    [key: string]: AreaRowLayout | AreaLayout;
}): {
    [key: string]: string;
};
