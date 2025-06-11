interface Rect {
    top: number;
    left: number;
    width: number;
    height: number;
}
export declare const getAreaRootViewport: () => Rect;
export declare const setAreaResizing: (isResizing: boolean) => void;
export declare const _setAreaViewport: (_viewportMap: {
    [key: string]: Rect;
}) => void;
export declare const getAreaViewport: (areaId: string, _: string) => Rect;
declare global {
    interface Window {
        __AREA_RESIZING__?: boolean;
    }
}
export {};
