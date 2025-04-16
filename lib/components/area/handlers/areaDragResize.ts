import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { areaSlice } from "../../../store/slices/areaSlice";
import { AreaRowLayout } from "../../../types/areaTypes";
import type { Rect } from "../../../types/geometry";
import { computeAreaRowToMinSize } from "../../../utils/areaRowToMinSize";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { capToRange, interpolate } from "../../../utils/math";
import { Vec2 } from "../../../utils/math/vec2";
import { requestAction } from "../../../utils/requestAction";
import { getActionState } from "../../../utils/stateUtils";

const { actions: areaActions } = areaSlice;

export const handleDragAreaResize = (
    _e: React.MouseEvent,
    row: AreaRowLayout,
    horizontal: boolean,
    areaIndex: number, // 1 is the first separator
) => {
    // Input validation
    if (!row || !row.areas || row.areas.length === 0) {
        console.error("Invalid row provided for resize:", row);
        return;
    }

    if (areaIndex < 1 || areaIndex >= row.areas.length) {
        console.error("Invalid areaIndex for resize:", { areaIndex, areasLength: row.areas.length });
        return;
    }

    // Indicate that this action is a drag operation that must maintain listeners until mouseup
    requestAction({ isDragAction: true }, (params) => {
        const areaState = getActionState().area;

        if (!areaState || !areaState.layout || !areaState.rootId) {
            console.error("Invalid area state for resize:", areaState);
            params.cancelAction();
            return;
        }

        const rowToMinSize = computeAreaRowToMinSize(areaState.rootId, areaState.layout);

        const rootViewport = getAreaRootViewport();

        if (!rootViewport) {
            console.error("Unable to get root viewport");
            params.cancelAction();
            return;
        }

        const areaToViewport = computeAreaToViewport(
            areaState.layout,
            areaState.rootId,
            rootViewport,
        );

        const a0 = row.areas[areaIndex - 1];
        const a1 = row.areas[areaIndex];

        if (!a0 || !a1) {
            console.error('Invalid area indices:', { areaIndex, areas: row.areas });
            params.cancelAction();
            return;
        }

        const v0 = areaToViewport[a0.id];
        const v1 = areaToViewport[a1.id];

        if (!v0 || !v1) {
            console.error('Missing viewports:', { a0: a0.id, a1: a1.id, viewports: areaToViewport });

            // Attempt to recalculate viewports
            const recalculatedViewports = computeAreaToViewport(
                areaState.layout,
                areaState.rootId,
                rootViewport,
            );

            const newV0 = recalculatedViewports[a0.id];
            const newV1 = recalculatedViewports[a1.id];

            if (!newV0 || !newV1) {
                console.error('Still missing viewports after recalculation');
                params.cancelAction();
                return;
            }

            // Update references
            Object.assign(areaToViewport, recalculatedViewports);
        }

        const getMinSize = (id: string) => {
            const layout = areaState.layout[id];
            if (!layout) {
                console.error('Layout not found for area:', id);
                return 1;
            }

            if (layout.type === "area") {
                return 1;
            }

            const minSize = rowToMinSize[layout.id];
            if (!minSize) {
                console.warn('Min size not found for row:', layout.id);
                return 1;
            }

            return horizontal ? minSize.width : minSize.height;
        };

        const m0 = getMinSize(a0.id);
        const m1 = getMinSize(a1.id);

        const sizeToShare = a0.size + a1.size;
        if (isNaN(sizeToShare) || sizeToShare <= 0) {
            console.error("Invalid size to share:", { a0Size: a0.size, a1Size: a1.size, sum: sizeToShare });
            // Size correction
            a0.size = 0.5;
            a1.size = 0.5;
        }

        // Use recalculated viewports if needed
        const v0Ref = areaToViewport[a0.id];
        const v1Ref = areaToViewport[a1.id];

        const sharedViewport: Rect = {
            width: horizontal ? v0Ref.width + v1Ref.width : v0Ref.width,
            height: !horizontal ? v0Ref.height + v1Ref.height : v0Ref.height,
            left: v0Ref.left,
            top: v0Ref.top,
        };

        const viewportSize = horizontal ? sharedViewport.width : sharedViewport.height;
        if (viewportSize <= 0) {
            console.error("Invalid viewport size:", viewportSize);
            params.cancelAction();
            return;
        }

        const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
        const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;

        if (tMin0 + tMin1 >= 0.99) {
            console.warn('Not enough space to resize:', { tMin0, tMin1 });
            params.cancelAction();
            return;
        }

        // Variables to track drag state
        let isDragging = true;
        let lastVec = Vec2.fromEvent(_e as any);

        params.addListener.repeated("mousemove", (e) => {
            if (!isDragging) return;

            const vec = Vec2.fromEvent(e);

            // Check if mouse has actually moved to avoid unnecessary updates
            if (Math.abs(vec.x - lastVec.x) < 1 && Math.abs(vec.y - lastVec.y) < 1) {
                return;
            }
            lastVec = vec;

            const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
            const t1 = horizontal
                ? sharedViewport.left + sharedViewport.width
                : sharedViewport.top + sharedViewport.height;

            const val = horizontal ? vec.x : vec.y;
            const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

            const sizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));

            // Size validation
            if (sizes.some(s => isNaN(s) || s < 0)) {
                console.error("Invalid calculated sizes:", sizes);
                return;
            }

            // Update sizes
            params.dispatch(areaActions.setRowSizes({
                rowId: row.id,
                sizes: row.areas.map((area, i) => {
                    if (i === areaIndex - 1) return sizes[0];
                    if (i === areaIndex) return sizes[1];
                    return area.size;
                })
            }));

            // Update viewports
            const newViewports: Record<string, Rect> = {};
            const newV0: Rect = {
                ...v0Ref,
                width: horizontal ? sharedViewport.width * t : v0Ref.width,
                height: !horizontal ? sharedViewport.height * t : v0Ref.height
            };
            const newV1: Rect = {
                ...v1Ref,
                left: horizontal ? v0Ref.left + sharedViewport.width * t : v1Ref.left,
                top: !horizontal ? v0Ref.top + sharedViewport.height * t : v1Ref.top,
                width: horizontal ? sharedViewport.width * (1 - t) : v1Ref.width,
                height: !horizontal ? sharedViewport.height * (1 - t) : v1Ref.height
            };

            // Viewport validation
            if (newV0.width <= 0 || newV0.height <= 0 || newV1.width <= 0 || newV1.height <= 0) {
                console.error("Invalid viewport dimensions:", { newV0, newV1 });
                return;
            }

            newViewports[a0.id] = newV0;
            newViewports[a1.id] = newV1;

            params.dispatch(areaActions.setViewports({ viewports: newViewports }));

            params.performDiff((diff) => diff.resizeAreas());
        });

        params.addListener.once("mouseup", (e) => {
            isDragging = false;

            // Clean up preview state
            params.dispatch(areaActions.setViewports({ viewports: {} }));
            params.addDiff((diff) => diff.resizeAreas());

            // Important: Explicitly submit action at the end of drag
            params.submitAction("Resize areas");
        });
    });
};
