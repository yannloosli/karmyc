import { capToRange, Vec2 } from "@gamesberry/karmyc-shared";
import { Dispatch, SetStateAction } from 'react'; // Needed for setResizePreview prop
import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
// Import Zustand store and types
import { useAreaStore } from "../../../stores/areaStore"; // Import AreaState and JoinPreviewState
import { AreaRowLayout } from "../../../types/areaTypes";
import { CardinalDirection, IntercardinalDirection } from "../../../types/directions";
import type { Rect } from "../../../types/geometry";
// Utility imports (ensure they don't rely on Redux)
import { computeAreaToParentRow } from "../../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport, setAreaResizing } from "../../../utils/getAreaViewport";

// Define ResizePreviewState (same as in areaDragResize)
interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

const cornerDirections: Record<IntercardinalDirection, [CardinalDirection, CardinalDirection]> = {
    ne: ["n", "e"],
    nw: ["n", "w"],
    se: ["s", "e"],
    sw: ["s", "w"],
};

// Removed parseCorner as directionParts wasn't used in Zustand logic

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
        console.warn("Unknown corner direction in determineIfMovingInwards:", corner);
        return false; // Default to outward/join for safety?
    }
}

export const handleAreaDragFromCorner = (
    e: MouseEvent,
    corner: IntercardinalDirection,
    areaId: string,
    viewport: Rect, // Initial viewport of the dragged area
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>
) => {
    e.preventDefault();
    setAreaResizing(true);

    const initialMousePosition = Vec2.fromEvent(e);
    let lastMousePosition: Vec2 = initialMousePosition;
    // Store references to the currently active move/mouseup handlers
    let currentOnMove: ((vec: Vec2) => void) | null = null;
    let currentOnMouseUp: (() => void) | null = null;

    // --- Initial State Acquisition from Zustand ---
    const getFreshState = useAreaStore.getState; // Helper to get fresh state
    const initialAreaState = getFreshState();
    const initialLayout = initialAreaState.layout;
    const initialRootId = initialAreaState.rootId;

    if (!initialRootId || !initialLayout[initialRootId]) {
        console.error("handleAreaDragFromCorner: Invalid initial state (rootId or layout missing)");
        setAreaResizing(false);
        return;
    }

    // Correct call to computeAreaToParentRow with layout and rootId
    const areaToParentRowMap = computeAreaToParentRow(initialLayout, initialRootId);
    const parentRowId = areaToParentRowMap[areaId];

    // --- Function: createNewArea (Initiate Split) ---
    function createNewArea(horizontal: boolean) {
        const currentViewportSize = horizontal ? viewport.width : viewport.height;
        if (currentViewportSize < AREA_MIN_CONTENT_WIDTH * 2) {
            console.log("Area too small to split, initiating join/move logic.");
            setupJoinMoveHandlers();
            if (currentOnMove) {
                currentOnMove(lastMousePosition);
            }
            return;
        }

        console.log(`Splitting area ${areaId}. Horizontal: ${horizontal}`);

        // --- Perform State Updates using Zustand ---
        const splitResult = getFreshState().splitArea({
            areaIdToSplit: areaId,
            parentRowId: parentRowId,
            horizontal: horizontal,
            corner: corner,
        });

        if (!splitResult || !splitResult.newRowId || splitResult.separatorIndex === undefined) {
            console.error("Failed to split area or get split result info. Switching to join/move.");
            setupJoinMoveHandlers();
            if (currentOnMove) {
                currentOnMove(lastMousePosition);
            }
            return;
        }

        const { newRowId, separatorIndex } = splitResult;
        const newRowLayout = getFreshState().layout[newRowId] as AreaRowLayout;

        if (!newRowLayout || newRowLayout.type !== 'area_row') {
            console.error(`Split seemed successful but row ${newRowId} not found or not a row in state.`);
            setAreaResizing(false);
            return;
        }

        console.log(`Split successful. New row: ${newRowId}, Separator index: ${separatorIndex}. Setting up resize handlers.`);
        setupResizeHandlers(newRowLayout, separatorIndex, setResizePreview);
        if (currentOnMove) {
            currentOnMove(lastMousePosition);
        }
    }

    // --- Function: setupResizeHandlers (After Split) ---
    function setupResizeHandlers(
        rowToResize: AreaRowLayout,
        sepIndex: number,
        setResizePreviewFn: Dispatch<SetStateAction<ResizePreviewState | null>>
    ) {
        const isHorizontalRow = rowToResize.orientation === 'horizontal';
        const areaBeforeId = rowToResize.areas[sepIndex - 1]?.id;
        const areaAfterId = rowToResize.areas[sepIndex]?.id;

        if (!areaBeforeId || !areaAfterId) {
            console.error("Cannot set up resize handlers: invalid separator index or missing areas.", { rowToResize, sepIndex });
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); };
            return;
        }

        const initialSizes = rowToResize.areas.map(a => a.size);
        const sizeToShare = initialSizes[sepIndex - 1] + initialSizes[sepIndex];

        // --- Debounce Logic --- similar to areaDragResize
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const debounceDelay = 75; // ms
        let lastT = 0.5; // Store last calculated t for final update

        const performGlobalUpdate = (sizes: number[]) => {
            console.log("[Debounced Update - Split] Updating global state with sizes:", sizes);
            getFreshState().setRowSizes({ rowId: rowToResize.id, sizes });
        };

        const triggerDebouncedUpdate = (sizes: number[]) => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                timeoutId = null;
                performGlobalUpdate(sizes);
            }, debounceDelay);
        };

        const cancelDebouncedUpdate = () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                timeoutId = null;
                console.log("[Debounced Update - Split] Cancelled pending update.");
            }
        };
        // --- End Debounce Logic ---

        currentOnMove = (vec: Vec2) => {
            const currentState = getFreshState();
            const currentLayout = currentState.layout;
            const currentRow = currentLayout[rowToResize.id] as AreaRowLayout;
            const currentRootId = currentState.rootId;

            if (!currentRow || !currentRootId || currentRow.type !== 'area_row') {
                console.warn("Resize handler: Row or rootId not found/invalid in current state.");
                return;
            }

            const areaToViewportMap = computeAreaToViewport(
                currentLayout,
                currentRootId,
                getAreaRootViewport()
            );

            const v0 = areaToViewportMap[areaBeforeId];
            const v1 = areaToViewportMap[areaAfterId];

            if (!v0 || !v1) {
                console.warn("Resize handler: Viewports for adjacent areas not found.");
                return;
            }

            const sharedViewport: Rect = isHorizontalRow
                ? { left: v0.left, top: v0.top, width: v0.width + v1.width, height: v0.height }
                : { left: v0.left, top: v0.top, width: v0.width, height: v0.height + v1.height };

            const viewportSize = isHorizontalRow ? sharedViewport.width : sharedViewport.height;
            if (viewportSize <= 0) {
                console.warn("Resize handler: Shared viewport size is zero or negative.");
                return;
            }

            const minT = AREA_MIN_CONTENT_WIDTH / viewportSize;
            const t0 = isHorizontalRow ? sharedViewport.left : sharedViewport.top;
            const t1 = t0 + viewportSize;
            const val = isHorizontalRow ? vec.x : vec.y;
            const t = capToRange(minT, 1 - minT, (val - t0) / (t1 - t0));

            // Store last t
            lastT = t;

            // 1. Update PREVIEW state IMMEDIATELY
            setResizePreviewFn({
                rowId: rowToResize.id,
                separatorIndex: sepIndex,
                t: t
            });

            // 2. Trigger DEBOUNCED global state update
            const tempSize0 = t * sizeToShare;
            const tempSize1 = (1 - t) * sizeToShare;
            const tempSizes = currentRow.areas.map((area, index) => {
                if (index === sepIndex - 1) return tempSize0;
                if (index === sepIndex) return tempSize1;
                return area.size;
            });
            const tempTotalSize = tempSizes.reduce((sum, s) => sum + s, 0);
            if (tempTotalSize > 0) {
                const normalizedSizes = tempSizes.map(s => s / tempTotalSize);
                triggerDebouncedUpdate(normalizedSizes);
            } else {
                console.warn("Resize handler: Debounce skipped, zero total size.");
            }
        };

        currentOnMouseUp = () => {
            console.log("Resize finished after split.");
            // 1. Cancel any pending debounced update
            cancelDebouncedUpdate();

            // 2. Calculate FINAL sizes based on lastT
            const finalSize0 = lastT * sizeToShare;
            const finalSize1 = (1 - lastT) * sizeToShare;

            // Get the latest row state to construct the final sizes array correctly
            const finalRowState = getFreshState().layout[rowToResize.id] as AreaRowLayout;
            if (!finalRowState || finalRowState.type !== 'area_row') {
                console.error("Resize mouseup: Cannot find final row state.");
                setResizePreviewFn(null); // Attempt cleanup
                setAreaResizing(false);
                currentOnMove = null;
                currentOnMouseUp = null;
                return;
            }

            const finalSizes = finalRowState.areas.map((area, index) => {
                if (index === sepIndex - 1) return finalSize0;
                if (index === sepIndex) return finalSize1;
                return area.size;
            });

            // Normalize final sizes
            const finalTotalSize = finalSizes.reduce((sum, s) => sum + s, 0);
            let finalNormalizedSizes = finalSizes;
            if (finalTotalSize > 0) {
                finalNormalizedSizes = finalSizes.map(s => s / finalTotalSize);
            } else {
                console.error("Resize mouseup: Final total size is zero, cannot normalize. Using equal distribution as fallback.");
                const count = finalRowState.areas.length;
                finalNormalizedSizes = Array(count).fill(1 / count);
            }

            // 3. Update global state IMMEDIATELY with final sizes
            performGlobalUpdate(finalNormalizedSizes);

            // 4. Clean up preview state AFTER a tick
            setTimeout(() => setResizePreviewFn(null), 0);

            // 5. General cleanup
            setAreaResizing(false);
            currentOnMove = null;
            currentOnMouseUp = null;
        };
    }

    // --- Function: setupJoinMoveHandlers (If Split Fails or Area too Small) ---
    function setupJoinMoveHandlers() {
        console.log("Setting up join/move handlers for area:", areaId);

        // Find the parent row of the source area ONCE
        const initialParentRow = parentRowId ? initialLayout[parentRowId] as AreaRowLayout : null;
        if (!initialParentRow || initialParentRow.type !== 'area_row') {
            console.error("Join/Move setup: Source area does not have a valid parent row. Cannot determine siblings.");
            // Cannot proceed with join logic without siblings
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); getFreshState().setJoinPreview(null); }; // Basic cleanup
            return;
        }
        const sourceAreaIndex = initialParentRow.areas.findIndex(a => a.id === areaId);
        if (sourceAreaIndex === -1) {
            console.error(`Join/Move setup: Source area ${areaId} not found within its supposed parent row ${parentRowId}.`);
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); getFreshState().setJoinPreview(null); };
            return;
        }

        // Determine the ACTUAL eligible siblings (all others in the same row, based on original logic)
        const actualEligibleAreaIds = initialParentRow.areas
            .filter((_, index) => index !== sourceAreaIndex)
            .map(a => a.id);

        // Identify IMMEDIATE siblings
        const leftSiblingId = sourceAreaIndex > 0 ? initialParentRow.areas[sourceAreaIndex - 1].id : null;
        const rightSiblingId = sourceAreaIndex < initialParentRow.areas.length - 1 ? initialParentRow.areas[sourceAreaIndex + 1].id : null;
        const immediateSiblings = [leftSiblingId, rightSiblingId].filter(id => id !== null) as string[];

        console.log("Eligible siblings for join:", actualEligibleAreaIds, "Immediate siblings:", immediateSiblings);

        currentOnMove = (vec: Vec2) => {
            const currentState = getFreshState();
            const currentLayout = currentState.layout;
            const currentRootId = currentState.rootId;
            if (!currentRootId) return;

            const areaToViewportMap = computeAreaToViewport(currentLayout, currentRootId, getAreaRootViewport());

            let targetAreaId: string | null = null;
            let direction: CardinalDirection | null = null;

            // Logic to find target area based on vec and viewports
            // Iterate ONLY over IMMEDIATE eligible siblings to find the target
            for (const eligibleId of immediateSiblings) {
                // No need to check for self (id === areaId)
                const vp = areaToViewportMap[eligibleId];
                if (vp && vec.x >= vp.left && vec.x <= vp.left + vp.width && vec.y >= vp.top && vec.y <= vp.top + vp.height) {
                    targetAreaId = eligibleId;
                    // Determine direction (simplified)
                    const sourceVp = areaToViewportMap[areaId]; // Viewport of the area being dragged
                    if (sourceVp) {
                        // Use target viewport center vs source viewport center for more robust direction?
                        const targetVp = vp;
                        const deltaX = (targetVp.left + targetVp.width / 2) - (sourceVp.left + sourceVp.width / 2);
                        const deltaY = (targetVp.top + targetVp.height / 2) - (sourceVp.top + sourceVp.height / 2);

                        if (initialParentRow.orientation === 'horizontal') {
                            direction = deltaX > 0 ? 'e' : 'w';
                        } else {
                            direction = deltaY > 0 ? 's' : 'n';
                        }
                    }
                    break; // Found the target among immediate eligible siblings
                }
            }

            // Call setJoinPreview ONLY if a valid immediate sibling target is hovered
            if (targetAreaId && direction) {
                getFreshState().setJoinPreview({
                    areaId: targetAreaId, // The immediate eligible sibling area currently hovered
                    movingInDirection: direction,
                    eligibleAreaIds: actualEligibleAreaIds // Pass the correct full list of *all* siblings for potential future use?
                    // Or should this also be immediateSiblings? Let's keep all siblings for now.
                });
            } else {
                // If not hovering over an eligible immediate sibling, clear the preview
                if (getFreshState().joinPreview !== null) { // Only clear if needed
                    getFreshState().setJoinPreview(null);
                }
            }
        };

        currentOnMouseUp = () => {
            console.log("Join/Move finished.");
            const state = getFreshState();
            const preview = state.joinPreview;

            // Check if the PREVIEW state contains a valid IMMEDIATE sibling target when mouse is released
            if (preview && preview.areaId && preview.movingInDirection && immediateSiblings.includes(preview.areaId)) {
                console.log(`Triggering final join/move action: source=${areaId}, target=${preview.areaId}, direction=${preview.movingInDirection}`);
                getFreshState().joinOrMoveArea({ sourceAreaId: areaId, targetAreaId: preview.areaId, direction: preview.movingInDirection });
            } else {
                console.log("MouseUp but no valid join target in preview state. Cancelling join.");
                // No action needed here, preview is cleared below anyway
            }

            // Clear preview regardless of whether the action was triggered
            getFreshState().setJoinPreview(null);
            setAreaResizing(false);
            currentOnMove = null;
            currentOnMouseUp = null;
        };
    }

    // --- Initial Decision Logic ---
    const deltaThreshold = 10;
    let initialDirectionDetermined = false;

    const determineInitialDirection = (currentPos: Vec2) => {
        // Use new Vec2 for delta calculation to avoid modifying original vectors
        const delta = new Vec2(currentPos.x - initialMousePosition.x, currentPos.y - initialMousePosition.y);

        const dist = delta.length();

        console.log(`InternalMouseMove: dist=${dist.toFixed(1)}, corner=${corner}, moveVec=(${delta.x.toFixed(1)}, ${delta.y.toFixed(1)})`);

        if (dist < 10) { // Threshold
            return; // Not moved enough
        }

        // DIRECTION DETERMINED - Detach this initial listener and attach the correct one
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp); // Need a matching mouseup

        // *** LOG before determination ***
        console.log(`---> Determining direction: corner=${corner}, moveVec.x=${delta.x}, moveVec.y=${delta.y}`);
        const isMovingInwards = determineIfMovingInwards(corner, delta);
        const horizontalSplit = Math.abs(delta.x) > Math.abs(delta.y);

        console.log(`Initial direction determined: ${isMovingInwards ? 'Inward' : 'Outward'} (Split - Horizontal: ${horizontalSplit})`);

        if (isMovingInwards) {
            // If moving inward, create a new area (division)
            console.log(`Initial direction determined: Inward (Split - Horizontal: ${horizontalSplit})`);
            createNewArea(horizontalSplit);
        } else {
            // If moving outward, initiate join/move
            console.log(`Initial direction determined: Outward (Join/Move)`);
            setupJoinMoveHandlers();
        }

        initialDirectionDetermined = true;
        // Trigger the first move event for the selected handler
        if (currentOnMove) {
            currentOnMove(currentPos);
        }
    };

    // --- Global Mouse Event Listeners ---
    const handleMouseMove = (moveEvent: MouseEvent) => {
        const vec = Vec2.fromEvent(moveEvent);
        lastMousePosition = vec;

        if (!initialDirectionDetermined) {
            determineInitialDirection(vec);
        } else if (currentOnMove) {
            currentOnMove(vec);
        }
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
        console.log("Global Mouse Up");
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (!initialDirectionDetermined) {
            console.log("Mouse up before initial direction determined.");
            setAreaResizing(false);
            // Ensure join preview is cleared if mouseup happens early
            if (getFreshState().joinPreview !== null) {
                getFreshState().setJoinPreview(null);
            }
        } else if (currentOnMouseUp) {
            currentOnMouseUp();
        } else {
            console.warn("Mouse up, direction determined but no final handler set.");
            setAreaResizing(false);
        }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
};
