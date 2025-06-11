import { AreaLayout, AreaRowLayout } from "../types";
export declare const computeAreaToViewport: (layout: {
    [key: string]: AreaLayout | AreaRowLayout;
}, rootId: string | null, viewport: {
    left: number;
    top: number;
    width: number;
    height: number;
}) => {
    [key: string]: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
};
