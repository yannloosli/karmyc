import { AREA_BORDER_WIDTH } from "./constants";
import { Rect } from "../types";

// Storage for stable viewport dimensions
let stableViewport: Rect | null = null;
let lastAppliedWidth = 0;
let lastAppliedHeight = 0;
let resizeStartTime = 0;
const RESIZE_STABILITY_THRESHOLD = 500; // ms

export const getAreaRootViewport = () => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
        return { top: 0, left: 0, width: 800, height: 600 };
    }
    // Calculate current window dimensions
    const currentViewport: Rect = {
        top: 0,  // No offset as it's already handled by the flow
        left: 0,
        height: Math.floor(window.document.querySelector('.area-root')?.getBoundingClientRect().height || 0),  // Subtract MenuBar and StatusBar
        width: Math.floor(window.document.querySelector('.area-root')?.getBoundingClientRect().width || 0),
    };

    const now = Date.now();

    // If we're in the middle of resizing or dividing
    if (window.__AREA_RESIZING__) {
        // Update resize start time
        if (!resizeStartTime) {
            resizeStartTime = now;

            // Store current dimensions at first resize
            if (!stableViewport) {
                stableViewport = { ...currentViewport };
                lastAppliedWidth = currentViewport.width;
                lastAppliedHeight = currentViewport.height;
            }
        }

        // Use stable viewport during the operation
        if (stableViewport) {
            return stableViewport;
        }
    } else {
        // Reset resize counter if we're no longer in operation
        // but only after a stability delay
        if (resizeStartTime && (now - resizeStartTime > RESIZE_STABILITY_THRESHOLD)) {
            resizeStartTime = 0;
        }
    }

    // Detect significant changes in dimensions
    const widthChange = Math.abs(currentViewport.width - lastAppliedWidth);
    const heightChange = Math.abs(currentViewport.height - lastAppliedHeight);
    const significantChange = widthChange > 5 || heightChange > 5;

    // Update stable dimensions if significant change and no ongoing operation
    if (!window.__AREA_RESIZING__ && significantChange && !resizeStartTime) {
        stableViewport = { ...currentViewport };
        lastAppliedWidth = currentViewport.width;
        lastAppliedHeight = currentViewport.height;
    }

    // Return stable viewport if available, otherwise current
    return stableViewport || currentViewport;
};

// Function to set the resize flag
export const setAreaResizing = (isResizing: boolean) => {
    window.__AREA_RESIZING__ = isResizing;

    // Reset stability counter if we stop resizing
    if (!isResizing) {
        resizeStartTime = 0;
    }
};

let viewportMap: { [key: string]: Rect } = {};

export const _setAreaViewport = (_viewportMap: { [key: string]: Rect }) => {
    viewportMap = _viewportMap;
};

export const getAreaViewport = (areaId: string, _: string): Rect => {
    const viewport = viewportMap[areaId];

    if (!viewport) {
        console.warn(`No viewport found for area ${areaId}`);
        // Return a default viewport in case of error
        return {
            left: AREA_BORDER_WIDTH,
            top: AREA_BORDER_WIDTH,
            width: 100 - AREA_BORDER_WIDTH * 2,
            height: 100 - AREA_BORDER_WIDTH * 2
        };
    }

    const componentViewport: Rect = {
        left: viewport.left + AREA_BORDER_WIDTH,
        top: viewport.top + AREA_BORDER_WIDTH,
        width: viewport.width - AREA_BORDER_WIDTH * 2,
        height: viewport.height - AREA_BORDER_WIDTH * 2,
    };

    return componentViewport;
};

// TypeScript type augmentation to add property to window
declare global {
    interface Window {
        __AREA_RESIZING__?: boolean;
    }
}
