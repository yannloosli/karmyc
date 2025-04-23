import { capToRange, Vec2 } from "@gamesberry/karmyc-shared";
import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { areaSlice, AreaState } from "../../../store/slices/areaSlice";
import { AreaRowLayout } from "../../../types/areaTypes";
import { CardinalDirection, IntercardinalDirection } from "../../../types/directions";
import type { Rect } from "../../../types/geometry";
import type { RequestActionParams } from "../../../types/requestAction";
import { computeAreaToParentRow } from "../../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport, setAreaResizing } from "../../../utils/getAreaViewport";
import { requestAction } from "../../../utils/requestAction";
import { getActionState } from "../../../utils/stateUtils";

const { actions: areaActions } = areaSlice;

const directionVectors = {
    n: { x: 0, y: 1 },
    s: { x: 0, y: -1 },
    w: { x: 1, y: 0 },
    e: { x: -1, y: 0 },
};

const oppositeDirectionVectors = {
    n: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    w: { x: -1, y: 0 },
    e: { x: 1, y: 0 },
};

const cornerDirections: Record<IntercardinalDirection, [CardinalDirection, CardinalDirection]> = {
    ne: ["n", "e"],
    nw: ["n", "w"],
    se: ["s", "e"],
    sw: ["s", "w"],
};

const getEligibleAreaIndices = (state: AreaState, row: AreaRowLayout, areaIndex: number): number[] => {
    const eligibleAreaIndices: number[] = [];
    for (let i = 0; i < row.areas.length; i++) {
        if (i !== areaIndex) {
            eligibleAreaIndices.push(i);
        }
    }
    return eligibleAreaIndices;
};

const getArrowDirection = (
    row: AreaRowLayout,
    oldAreaIndex: number,
    newAreaIndex: number,
): CardinalDirection => {
    if (row.orientation === "horizontal") {
        return newAreaIndex > oldAreaIndex ? "e" : "w";
    }
    return newAreaIndex > oldAreaIndex ? "s" : "n";
};

const parseCorner = (corner: IntercardinalDirection): [CardinalDirection, CardinalDirection] => {
    return cornerDirections[corner];
};

const updateViewports = () => {
    const currentState = getActionState().area;
    const rootViewport = getAreaRootViewport();
    return computeAreaToViewport(
        currentState.layout,
        currentState.rootId,
        rootViewport
    );
};

export const handleAreaDragFromCorner = (
    e: MouseEvent,
    corner: IntercardinalDirection,
    areaId: string,
    viewport: Rect,
) => {
    e.preventDefault();

    // Enable resizing flag
    setAreaResizing(true);

    const initialMousePosition = Vec2.fromEvent(e);
    let lastMousePosition: Vec2 = initialMousePosition;
    let currentHandlers: { onMove?: (vec: Vec2) => void; onMouseUp?: () => void } = {};
    let handlerSet = false;

    requestAction({}, (params: RequestActionParams) => {
        const state = getActionState().area as AreaState;
        const areaToParentRowMap = computeAreaToParentRow(state);
        const areaToViewport = computeAreaToViewport(
            state.layout,
            state.rootId,
            getAreaRootViewport(),
        );

        // Row does not exist if the area we are operating on is the root area
        const row = state.layout[areaToParentRowMap[areaId]] as AreaRowLayout | null;

        const directionParts = parseCorner(corner);

        function createNewArea(horizontal: boolean) {
            if ((horizontal ? viewport.width : viewport.height) < AREA_MIN_CONTENT_WIDTH * 2) {
                const handlers = joinAreas();
                currentHandlers = handlers;
                if (handlers.onMove) {
                    handlers.onMove(lastMousePosition);
                }
                handlerSet = true;
                return;
            }

            params.performDiff((diff) => {
                // Get current state
                const currentState = getActionState().area;
                const parentRowId = areaToParentRowMap[areaId];
                const parentRow = parentRowId ? currentState.layout[parentRowId] as AreaRowLayout : null;

                // Identify which will be the final parent row and its id
                let finalRowId: string;
                let existingRow = false;

                // If we have a parent row and the orientation is the same
                if (parentRow && ((parentRow.orientation === 'horizontal') === horizontal)) {
                    finalRowId = parentRowId;
                    existingRow = true;
                    // Get current area size before dividing it
                    const currentArea = parentRow.areas.find(a => a.id === areaId);
                    const currentSize = currentArea ? currentArea.size : 0;

                    // Add a new area to existing parent
                    params.dispatch(areaActions.addAreaToRow({
                        rowId: parentRowId,
                        afterAreaId: areaId
                    }));

                    // Get updated state
                    const updatedState = getActionState().area;
                    const updatedRow = updatedState.layout[parentRowId] as AreaRowLayout;
                    const areaIndex = updatedRow.areas.findIndex(a => a.id === areaId);
                    const newAreaId = updatedRow.areas[areaIndex + 1].id;

                    // Calculate new sizes preserving other areas' sizes
                    const newSizes = updatedRow.areas.map((area, index) => {
                        if (index === areaIndex) {
                            // Original area takes half of its previous size
                            return currentSize / 2;
                        } else if (index === areaIndex + 1) {
                            // New area takes the other half
                            return currentSize / 2;
                        } else {
                            // Other areas keep their size
                            return area.size;
                        }
                    });

                    // Update sizes
                    params.dispatch(areaActions.setRowSizes({
                        rowId: parentRowId,
                        sizes: newSizes
                    }));

                    // Update viewports
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));
                } else {
                    finalRowId = areaId;
                    existingRow = false;
                    // Create a new row with two areas
                    params.dispatch(areaActions.convertAreaToRow({
                        areaId,
                        cornerParts: directionParts,
                        horizontal
                    }));

                    // Get updated state
                    const updatedState = getActionState().area;
                    const newRow = updatedState.layout[areaId] as AreaRowLayout;

                    // Initialize area sizes to 50/50
                    params.dispatch(areaActions.setRowSizes({
                        rowId: areaId,
                        sizes: [0.5, 0.5]
                    }));

                    // Update viewports
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));
                }

                // Force layout update
                diff.resizeAreas();

                // Set up handlers for resizing
                const getT = (vec: Vec2): number => {
                    // Get current state and row
                    const state = getActionState().area;
                    const rowId = existingRow ? parentRowId : areaId;
                    const row = state.layout[rowId] as AreaRowLayout;

                    // Determine actual orientation
                    const isHorizontalRow = row.orientation === 'horizontal';

                    // Get current viewport
                    const areaToViewport = computeAreaToViewport(
                        state.layout,
                        state.rootId,
                        getAreaRootViewport()
                    );

                    // If it's an existing row, use combined viewport of concerned areas
                    let effectiveViewport: Rect;
                    if (existingRow) {
                        const areaIndex = row.areas.findIndex(a => a.id === areaId);
                        if (areaIndex !== -1 && areaIndex + 1 < row.areas.length) {
                            const v0 = areaToViewport[row.areas[areaIndex].id];
                            const v1 = areaToViewport[row.areas[areaIndex + 1].id];

                            if (v0 && v1) {
                                effectiveViewport = isHorizontalRow
                                    ? {
                                        left: v0.left,
                                        top: v0.top,
                                        width: v0.width + v1.width,
                                        height: v0.height
                                    }
                                    : {
                                        left: v0.left,
                                        top: v0.top,
                                        width: v0.width,
                                        height: v0.height + v1.height
                                    };
                            } else {
                                effectiveViewport = viewport;
                            }
                        } else {
                            effectiveViewport = viewport;
                        }
                    } else {
                        effectiveViewport = viewport;
                    }

                    // Calculate t based on actual orientation and effective viewport
                    const viewportSize = isHorizontalRow ? effectiveViewport.width : effectiveViewport.height;
                    const minT = AREA_MIN_CONTENT_WIDTH / viewportSize;
                    const t0 = isHorizontalRow ? effectiveViewport.left : effectiveViewport.top;
                    const t1 = isHorizontalRow ? effectiveViewport.left + effectiveViewport.width : effectiveViewport.top + effectiveViewport.height;
                    const val = isHorizontalRow ? vec.x : vec.y;

                    return capToRange(minT, 1 - minT, (val - t0) / (t1 - t0));
                };

                const onMoveFn = (vec: Vec2) => {
                    // Get current state
                    const state = getActionState().area;
                    const rowId = existingRow ? parentRowId : areaId;
                    const row = state.layout[rowId] as AreaRowLayout;
                    const areaIndex = existingRow
                        ? row.areas.findIndex(a => a.id === areaId)
                        : 0;

                    // Calculate t
                    const t = getT(vec);

                    // Update sizes
                    let newSizes: number[];
                    if (row.areas.length === 2) {
                        newSizes = [t, 1 - t];
                    } else if (existingRow) {
                        // For an existing row with more than two areas
                        newSizes = row.areas.map((area, index) => {
                            if (index === areaIndex) {
                                return t;
                            } else if (index === areaIndex + 1) {
                                // Next area
                                const originalSize = area.size + row.areas[areaIndex].size;
                                return Math.max(0, originalSize - t);
                            } else {
                                return area.size;
                            }
                        });
                    } else {
                        // Unlikely case but handled for safety
                        newSizes = Array(row.areas.length).fill(1 / row.areas.length);
                    }

                    // Apply new sizes
                    params.dispatch(areaActions.setRowSizes({
                        rowId,
                        sizes: newSizes
                    }));

                    // Force complete recalculation
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));

                    // Force immediate update
                    params.performDiff((diff) => {
                        diff.resizeAreas();
                    });
                };

                const onMouseUpFn = () => {
                    params.addDiff((diff) => {
                        diff.resizeAreas();
                    });
                    params.submitAction("Create or update area");
                };

                currentHandlers = {
                    onMove: onMoveFn,
                    onMouseUp: onMouseUpFn
                };
            });
        }

        function joinAreas() {
            if (!row) {
                console.error("Invalid row for merging");
                throw new Error("Expected row to be valid.");
            }

            let areaIndex = row.areas.map((x) => x.id).indexOf(areaId);
            let eligibleAreaIndices = getEligibleAreaIndices(state, row, areaIndex);

            // Check that viewports are available for all eligible areas
            const eligibleAreaIds = eligibleAreaIndices.map((i) => row.areas[i].id);

            for (const id of eligibleAreaIds) {
                if (!areaToViewport[id]) {
                    console.error('Missing viewport for area:', id);
                    params.cancelAction();
                    return { onMove: undefined, onMouseUp: undefined };
                }
            }

            const getEligibleAreaIds = (eligibleAreaIndices: number[]) =>
                eligibleAreaIndices.map((i) => row.areas[i].id);

            params.dispatch(
                areaActions.setJoinAreasPreview({
                    areaId: null,
                    direction: null,
                    eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                }),
            );

            const onMoveFn: ((mousePosition: Vec2) => void) | null = (vec) => {
                lastMousePosition = vec;

                let foundEligibleArea = false;
                for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
                    const eligibleAreaIndex = eligibleAreaIndices[i];
                    const eligibleAreaId = row.areas[eligibleAreaIndex].id;
                    const eligibleAreaViewport = areaToViewport[eligibleAreaId];

                    if (!eligibleAreaViewport) {
                        console.error('Missing viewport for area', eligibleAreaId);
                        continue;
                    }

                    // Convert viewport to expected format for isVecInRect
                    const rect = {
                        left: eligibleAreaViewport.left,
                        top: eligibleAreaViewport.top,
                        right: eligibleAreaViewport.left + eligibleAreaViewport.width,
                        bottom: eligibleAreaViewport.top + eligibleAreaViewport.height
                    };

                    // Check if the point is in the rectangle
                    if (!(vec.x >= rect.left && vec.x <= rect.right &&
                        vec.y >= rect.top && vec.y <= rect.bottom)) {
                        continue;
                    }

                    foundEligibleArea = true;
                    const arrowDirection = getArrowDirection(row, areaIndex, eligibleAreaIndex);
                    const nextAreaId = row.areas[eligibleAreaIndices[i]].id;

                    // Update merge preview
                    params.dispatch(
                        areaActions.setJoinAreasPreview({
                            areaId: nextAreaId,
                            direction: arrowDirection,
                            eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                        }),
                    );
                    params.performDiff(() => { });
                    break;
                }

                // If no longer on an eligible area, reset the preview
                if (!foundEligibleArea) {
                    params.dispatch(
                        areaActions.setJoinAreasPreview({
                            areaId: null,
                            direction: null,
                            eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                        }),
                    );
                    params.performDiff(() => { });
                }
            };

            const onMouseUpFn: (() => void) | undefined = () => {
                // Determine if we are on an eligible area for merging
                let targetAreaIndex = -1;
                let targetAreaId = null;

                for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
                    const eligibleAreaIndex = eligibleAreaIndices[i];
                    const eligibleAreaId = row.areas[eligibleAreaIndex].id;
                    const eligibleAreaViewport = areaToViewport[eligibleAreaId];

                    if (!eligibleAreaViewport) {
                        console.error('Missing viewport for area', eligibleAreaId);
                        continue;
                    }

                    // Convert viewport to expected format to check position
                    const rect = {
                        left: eligibleAreaViewport.left,
                        top: eligibleAreaViewport.top,
                        right: eligibleAreaViewport.left + eligibleAreaViewport.width,
                        bottom: eligibleAreaViewport.top + eligibleAreaViewport.height
                    };

                    // Check if the point is in the rectangle
                    if (lastMousePosition.x >= rect.left &&
                        lastMousePosition.x <= rect.right &&
                        lastMousePosition.y >= rect.top &&
                        lastMousePosition.y <= rect.bottom) {
                        targetAreaIndex = eligibleAreaIndex;
                        targetAreaId = eligibleAreaId;
                        break;
                    }
                }

                // If not on an eligible area, cancel the merge
                if (targetAreaIndex === -1) {
                    // Clean temporary states before canceling
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.cancelAction();
                    return;
                }

                try {
                    // Determine which area is merged with which other area
                    const mergeArea = areaIndex;  // Using the index of the area being moved
                    const mergeInto = targetAreaIndex > areaIndex ? 1 : -1;

                    // Perform the merge
                    params.dispatch(areaActions.joinAreas({
                        rowId: row.id,
                        mergeArea: mergeArea,
                        mergeInto: mergeInto
                    }));

                    // Clean temporary states after the merge
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.addDiff(() => { });
                    params.submitAction("Join areas");
                } catch (error) {
                    console.error('Error joining areas:', error);
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.cancelAction();
                }
            };

            return {
                onMove: onMoveFn,
                onMouseUp: onMouseUpFn
            };
        }

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const mousePosition = Vec2.fromEvent(e);
            lastMousePosition = mousePosition;

            if (!handlerSet) {
                const moveVec = mousePosition.sub(initialMousePosition);
                const exceedsMinDistance = Math.abs(moveVec.x) > AREA_MIN_CONTENT_WIDTH / 2 ||
                    Math.abs(moveVec.y) > AREA_MIN_CONTENT_WIDTH / 2;

                if (!exceedsMinDistance) {
                    return;
                }

                // Determines if movement is inward or outward of the area
                // For each corner, define what "inward" means
                const isMovingInwards = determineIfMovingInwards(corner, moveVec);

                if (isMovingInwards) {
                    // If moving inward, create a new area (division)
                    const horizontal = Math.abs(moveVec.x) > Math.abs(moveVec.y);
                    createNewArea(horizontal);
                } else {
                    // If moving outward, merge
                    const handlers = joinAreas();
                    currentHandlers = handlers;
                    if (handlers.onMove) {
                        handlers.onMove(mousePosition);
                    }
                }
                handlerSet = true;
                return;
            }

            if (currentHandlers.onMove) {
                currentHandlers.onMove(mousePosition);
            }
        };

        // Function to determine if the movement is toward the inside of the area
        function determineIfMovingInwards(corner: IntercardinalDirection, moveVec: Vec2): boolean {
            switch (corner) {
            case "ne":
                // For northeast corner, "inward" means movement toward southwest
                return moveVec.x < 0 && moveVec.y > 0;
            case "nw":
                // For northwest corner, "inward" means movement toward southeast
                return moveVec.x > 0 && moveVec.y > 0;
            case "se":
                // For southeast corner, "inward" means movement toward northwest
                return moveVec.x < 0 && moveVec.y < 0;
            case "sw":
                // For southwest corner, "inward" means movement toward northeast
                return moveVec.x > 0 && moveVec.y < 0;
            default:
                return false;
            }
        }

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            // Always clean temporary states first
            params.dispatch(areaActions.cleanupTemporaryStates());

            // Disable resizing flag
            setAreaResizing(false);

            if (currentHandlers.onMouseUp) {
                currentHandlers.onMouseUp();
            } else {
                params.cancelAction();
            }
        };

        // Ensure events are cleaned up even in case of error
        try {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            params.dispatch(areaActions.cleanupTemporaryStates());
            params.cancelAction();
        }
    });
};
