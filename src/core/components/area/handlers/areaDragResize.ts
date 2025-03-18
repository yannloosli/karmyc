import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { areaSlice } from "../../../store/slices/areaSlice";
import { AreaRowLayout } from "../../../types/areaTypes";
import { computeAreaRowToMinSize } from "../../../utils/areaRowToMinSize";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { capToRange, interpolate } from "../../../utils/math";
import type { Rect } from "../../../utils/math/types";
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
    requestAction({}, (params) => {
        const areaState = getActionState().area;
        const rowToMinSize = computeAreaRowToMinSize(areaState.rootId, areaState.layout);
        const areaToViewport = computeAreaToViewport(
            areaState.layout,
            areaState.rootId,
            getAreaRootViewport(),
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
            params.cancelAction();
            return;
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
                console.error('Min size not found for row:', layout.id);
                return 1;
            }

            return horizontal ? minSize.width : minSize.height;
        };

        const m0 = getMinSize(a0.id);
        const m1 = getMinSize(a1.id);

        const sizeToShare = a0.size + a1.size;

        const sharedViewport: Rect = {
            width: horizontal ? v0.width + v1.width : v0.width,
            height: !horizontal ? v0.height + v1.height : v0.height,
            left: v0.left,
            top: v0.top,
        };

        const viewportSize = horizontal ? sharedViewport.width : sharedViewport.height;
        const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
        const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;

        if (tMin0 + tMin1 >= 0.99) {
            console.warn('Not enough space to resize');
            params.cancelAction();
            return;
        }

        params.addListener.repeated("mousemove", (e) => {
            const vec = Vec2.fromEvent(e);

            const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
            const t1 = horizontal
                ? sharedViewport.left + sharedViewport.width
                : sharedViewport.top + sharedViewport.height;

            const val = horizontal ? vec.x : vec.y;
            const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

            const sizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));

            // Mettre à jour les tailles
            params.dispatch(areaActions.setRowSizes({
                rowId: row.id,
                sizes: row.areas.map((area, i) => {
                    if (i === areaIndex - 1) return sizes[0];
                    if (i === areaIndex) return sizes[1];
                    return area.size;
                })
            }));

            // Mettre à jour les viewports
            const newViewports: Record<string, Rect> = {};
            const newV0: Rect = {
                ...v0,
                width: horizontal ? sharedViewport.width * t : v0.width,
                height: !horizontal ? sharedViewport.height * t : v0.height
            };
            const newV1: Rect = {
                ...v1,
                left: horizontal ? v0.left + sharedViewport.width * t : v1.left,
                top: !horizontal ? v0.top + sharedViewport.height * t : v1.top,
                width: horizontal ? sharedViewport.width * (1 - t) : v1.width,
                height: !horizontal ? sharedViewport.height * (1 - t) : v1.height
            };

            newViewports[a0.id] = newV0;
            newViewports[a1.id] = newV1;

            params.dispatch(areaActions.setViewports({ viewports: newViewports }));
            params.performDiff((diff) => diff.resizeAreas());
        });

        params.addListener.once("mouseup", () => {
            params.addDiff((diff) => diff.resizeAreas());
            params.submitAction("Resize areas");
        });
    });
};
