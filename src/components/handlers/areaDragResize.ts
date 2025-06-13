import { Dispatch, SetStateAction } from 'react';
import { capToRange, interpolate, Vec2 } from "../../utils";
import { AREA_MIN_CONTENT_WIDTH } from "../../utils/constants";
import { useKarmycStore } from "../../data/mainStore";
import { AreaRowLayout } from "../../types/areaTypes";
import type { Rect } from "../../types";
import { computeAreaRowToMinSize } from "../../utils/areaRowToMinSize";
import { computeAreaToViewport } from "../../utils/areaToViewport";
import { getAreaRootViewport } from "../../utils/getAreaViewport";

interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

function simpleDragHandler(
    onDrag: (e: MouseEvent) => void,
    onDragEnd: () => void
) {
    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
        onDrag(e);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Re-enable text selection at the end of drag
        document.body.style.userSelect = '';
        onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

export const handleDragAreaResize = (
    row: AreaRowLayout,
    horizontal: boolean,
    areaIndex: number, // 1 is the first separator
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>
) => {
    // Check if we are in a detached window
    const isDetached = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.isDetached;
    if (isDetached) {
        return;
    }

    // Input validation
    if (!row || !row.areas || row.areas.length === 0) {
        console.error("Invalid row data for resize");
        return;
    }

    if (areaIndex < 1 || areaIndex >= row.areas.length) {
        console.error("Invalid areaIndex for resize:", { areaIndex, areasLength: row.areas.length });
        return;
    }

    // --- Get active screen state at the beginning ---
    const initialRootState = useKarmycStore.getState();
    const initialActiveScreenId = initialRootState.activeScreenId;
    const initialActiveScreenAreas = initialRootState.screens[initialActiveScreenId]?.areas;

    if (!initialActiveScreenAreas || !initialActiveScreenAreas.layout || !initialActiveScreenAreas.rootId) {
        console.error("Invalid active screen area state for resize:", initialActiveScreenAreas);
        return;
    }
    // Use these specific states for the rest
    const activeLayout = initialActiveScreenAreas.layout;
    const activeRootId = initialActiveScreenAreas.rootId;
    // --- End active state retrieval ---

    // Initial calculations based on active screen state
    const rowToMinSize = computeAreaRowToMinSize(activeRootId, activeLayout);
    const rootViewport = getAreaRootViewport();
    if (!rootViewport) {
        console.error("Unable to get root viewport");
        return;
    }
    const initialAreaToViewport = computeAreaToViewport(
        activeLayout,
        activeRootId,
        rootViewport,
    );

    const a0 = row.areas[areaIndex - 1];
    const a1 = row.areas[areaIndex];
    if (!a0 || !a1) {
        console.error('Invalid area indices:', { areaIndex, areas: row.areas });
        return;
    }

    let v0 = initialAreaToViewport[a0.id];
    let v1 = initialAreaToViewport[a1.id];
    if (!v0 || !v1) {
        console.error('Missing initial viewports:', { a0: a0.id, a1: a1.id, viewports: initialAreaToViewport });
        // Maybe attempt a recalculation here if needed, or just return
        return;
    }

    const getMinSize = (id: string) => {
        const layoutItem = activeLayout[id];
        if (!layoutItem) return 1;
        if (layoutItem.type === "area") return 1;
        const minSize = rowToMinSize[layoutItem.id];
        return horizontal ? (minSize?.width ?? 1) : (minSize?.height ?? 1);
    };

    const m0 = getMinSize(a0.id);
    const m1 = getMinSize(a1.id);
    let sizeToShare = a0.size + a1.size;
    if (isNaN(sizeToShare) || sizeToShare <= 0) {
        sizeToShare = 1.0; // Default correction
    }

    const sharedViewport: Rect = {
        width: horizontal ? v0.width + v1.width : v0.width,
        height: !horizontal ? v0.height + v1.height : v0.height,
        left: v0.left,
        top: v0.top,
    };

    const viewportSize = horizontal ? sharedViewport.width : sharedViewport.height;
    if (viewportSize <= 0) {
        console.error("Invalid viewport size:", viewportSize);
        return;
    }

    const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
    const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;
    if (tMin0 + tMin1 >= 0.99) {
        console.warn('Not enough space to resize:', { tMin0, tMin1 });
        return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 16; // ~60fps
    let animationFrameId: number | null = null;
    let lastMousePosition: Vec2 | null = null;

    const performGlobalUpdate = (sizes: number[]) => {
        const now = performance.now();
        if (now - lastUpdateTime < minUpdateInterval) {
            return;
        }
        lastUpdateTime = now;
        useKarmycStore.getState().setRowSizes({ rowId: row.id, sizes });
    };

    const updateFromMousePosition = (vec: Vec2) => {
        if (!lastMousePosition) {
            lastMousePosition = vec;
            return;
        }

        const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
        const t1 = horizontal
            ? sharedViewport.left + sharedViewport.width
            : sharedViewport.top + sharedViewport.height;
        const val = horizontal ? vec.x : vec.y;
        const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

        // Update local preview IMMEDIATELY
        setResizePreview({
            rowId: row.id,
            separatorIndex: areaIndex,
            t: t
        });

        const tempFinalSizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));
        if (!tempFinalSizes.some(s => isNaN(s) || s < 0)) {
            const latestFinalPercentages = row.areas.map((_, i) => {
                if (i === areaIndex - 1) return tempFinalSizes[0];
                if (i === areaIndex) return tempFinalSizes[1];
                const initialRowState = activeLayout[row.id] as AreaRowLayout | undefined;
                return initialRowState?.areas?.[i]?.size || 0;
            });
            const sum = latestFinalPercentages.reduce((a, b) => a + b, 0);
            if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
                const normalizedPercentages = latestFinalPercentages.map(s => s / sum);
                performGlobalUpdate(normalizedPercentages);
            } else {
                performGlobalUpdate(latestFinalPercentages);
            }
        }
    };

    const animate = () => {
        if (lastMousePosition) {
            updateFromMousePosition(lastMousePosition);
        }
        animationFrameId = requestAnimationFrame(animate);
    };

    const triggerDebouncedUpdate = (vec: Vec2) => {
        lastMousePosition = vec;
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    const cancelDebouncedUpdate = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        lastMousePosition = null;
    };

    simpleDragHandler(
        // onDrag (mousemove)
        (e) => {
            const vec = Vec2.fromEvent(e);
            triggerDebouncedUpdate(vec);
        },
        // onDragEnd (mouseup)
        () => {
            cancelDebouncedUpdate();
            setTimeout(() => setResizePreview(null), 0);
        }
    );
};
