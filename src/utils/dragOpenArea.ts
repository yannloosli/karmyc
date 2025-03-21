import { computeAreaToParentRow } from "~/utils/areaToParentRow";
import { computeAreaToViewport } from "~~/utils/areaToParentRow
import { RequestActionParams } from "~/~/utils/areaToViewport
import { performOperation } from "~/state/operation";
import { getActionState } from "~/state/stateUtils";
import { Area, AreaRowLayout } from "~/types/areaTypes";
import * as areaActions from "../store/slices/areaSlice";
import { mouseDownMoveAction } from "./action/mouseDownMoveAction";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from "./areaUtils";
import { getAreaRootViewport } from "./getAreaViewport";
import { Vec2 } from "./math/vec2";

interface Options {
    area: Area;
}

function dragArea(op: Operation, area: Area, targetAreaId: string, placement: PlaceArea) {
    op.add(areaActions.setFields({ areaToOpen: null }));

    const areaState = op.state.area;

    if (placement === "replace") {
        op.add(areaActions.setAreaType(targetAreaId, area.type, area.state));
        return;
    }

    let orientation: AreaRowOrientation;
    let iOff: 0 | 1;

    switch (placement) {
    case "top":
    case "left":
        iOff = 0;
        break;
    case "bottom":
    case "right":
        iOff = 1;
        break;
    }

    switch (placement) {
    case "bottom":
    case "top":
        orientation = "vertical";
        break;
    case "left":
    case "right":
        orientation = "horizontal";
        break;
    }

    const areaToParentRow = computeAreaToParentRow(areaState);

    const parentRow = areaState.layout[areaToParentRow[targetAreaId]] as AreaRowLayout | undefined;

    if (parentRow && parentRow.orientation === orientation) {
        const targetIndex = parentRow.areas.map((x) => x.id).indexOf(targetAreaId);
        const insertIndex = targetIndex + iOff;
        op.add(areaActions.insertAreaIntoRow({ rowId: parentRow.id, area, insertIndex }));

        const sizes = parentRow.areas.map((x) => x.size);
        const size = sizes[targetIndex] / 2;
        sizes.splice(targetIndex, 0, 1);
        sizes[targetIndex] = size;
        sizes[targetIndex + 1] = size;
        op.add(areaActions.setRowSizes(parentRow.id, sizes));
        return;
    }

    op.add(areaActions.wrapAreaInRow(targetAreaId, orientation));
    const newRowId = (areaState._id + 1).toString();
    op.add(areaActions.insertAreaIntoRow({ rowId: newRowId, area, insertIndex: iOff }));
    op.add(areaActions.setRowSizes({ rowId: newRowId, sizes: [1, 1] }));
    op.addDiff((diff) => diff.resizeAreas());
}

export const dragOpenArea = (e: React.MouseEvent, options: Options) => {
    const { area } = options;

    let position: Vec2;

    const onDone = (params: RequestActionParams) => {
        const { area: areaState } = getActionState();
        const rootViewport = getAreaRootViewport();
        const areaToViewport = computeAreaToViewport(
            areaState.layout,
            areaState.rootId,
            rootViewport,
        );

        let areaId = getHoveredAreaId(position, areaState, areaToViewport);

        if (!areaId) {
            params.cancelAction(); // Mouse is not over any area, cancel
            return;
        }

        const viewport = areaToViewport[areaId];
        const placement = getAreaToOpenPlacementInViewport(viewport, position);

        performOperation(params, (op) => dragArea(op, area, areaId!, placement));
        params.submitAction();
    };

    mouseDownMoveAction(e, {
        keys: [],
        history: false,
        beforeMove: (_params, { mousePosition }) => {
            position = mousePosition.global;
        },
        mouseMove: (params, { mousePosition }) => {
            position = mousePosition.global;
            params.dispatch(areaActions.setFields({ areaToOpen: { area, position } }));
        },
        mouseUp: (params, didMove) => {
            if (!didMove) {
                params.dispatch(areaActions.setFields({ areaToOpen: { area, position } }));
                return;
            }
            onDone(params);
        },
        mouseDown: (params) => {
            onDone(params);
        },
    });
};
