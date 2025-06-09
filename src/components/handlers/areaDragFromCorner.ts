import { Dispatch, SetStateAction } from 'react'; 
import { capToRange, Vec2 } from "../../utils";
import { AREA_MIN_CONTENT_WIDTH } from "../../utils/constants";
import { useKarmycStore } from "../../store/areaStore"; 
import { AreaRowLayout } from "../../types/areaTypes";
import { CardinalDirection, IntercardinalDirection } from "../../types/directions";
import type { Rect } from "../../types";
import { computeAreaToParentRow } from "../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../utils/areaToViewport";
import { getAreaRootViewport } from "../../utils/getAreaViewport";

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
    // For purely horizontal or vertical movements, we consider the main direction
    const absX = Math.abs(moveVec.x);
    const absY = Math.abs(moveVec.y);
    const isMainlyHorizontal = absX > absY;
    const isMainlyVertical = absY > absX;

    // If the movement is mainly horizontal, we only consider the x component
    // If the movement is mainly vertical, we only consider the y component
    if (isMainlyHorizontal) {
        switch (corner) {
        case "ne":
        case "se":
            return moveVec.x < 0; // Left = inward
        case "nw":
        case "sw":
            return moveVec.x > 0; // Right = inward
        }
    } else if (isMainlyVertical) {
        switch (corner) {
        case "ne":
        case "nw":
            return moveVec.y > 0; // Down = inward
        case "se":
        case "sw":
            return moveVec.y < 0; // Up = inward
        }
    }

    // For diagonal movements, we use the previous logic
    switch (corner) {
    case "ne":
        return moveVec.x < 0 && moveVec.y > 0;
    case "nw":
        return moveVec.x > 0 && moveVec.y > 0;
    case "se":
        return moveVec.x < 0 && moveVec.y < 0;
    case "sw":
        return moveVec.x > 0 && moveVec.y < 0;
    default:
        console.warn("Unknown corner direction in determineIfMovingInwards:", corner);
        return false;
    }
}

export const handleAreaDragFromCorner = (
    e: MouseEvent,
    corner: IntercardinalDirection,
    areaId: string,
    viewport: Rect, // Initial viewport of the dragged area
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>,
    setAreaResizing: (resizing: boolean) => void
) => {
    // Check if we are in a detached window
    const isDetached = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.isDetached;
    if (isDetached) {
        return;
    }

    e.preventDefault();
    setAreaResizing(true);

    const initialMousePosition = Vec2.fromEvent(e);
    let lastMousePosition: Vec2 = initialMousePosition;
    // Store references to the currently active move/mouseup handlers
    let currentOnMove: ((vec: Vec2) => void) | null = null;
    let currentOnMouseUp: (() => void) | null = null;

    // --- Helper to get fresh state for the ACTIVE SCREEN --- (Crucial change)
    const getActiveScreenState = () => {
        const rootState = useKarmycStore.getState();
        return rootState.screens[rootState.activeScreenId]?.areas;
    };

    // --- Initial State Acquisition from ACTIVE SCREEN --- (Crucial change)
    const initialActiveScreenState = getActiveScreenState();
    if (!initialActiveScreenState) {
        console.error("handleAreaDragFromCorner: Could not get active screen state.");
        setAreaResizing(false);
        return;
    }
    const initialLayout = initialActiveScreenState.layout;
    const initialRootId = initialActiveScreenState.rootId;

    if (!initialRootId || !initialLayout || !initialLayout[initialRootId]) { // Check layout itself too
        console.error("handleAreaDragFromCorner: Invalid initial active screen state (rootId or layout missing/invalid)");
        setAreaResizing(false);
        return;
    }

    // Pass the active screen's layout and rootId
    const areaToParentRowMap = computeAreaToParentRow(initialLayout, initialRootId);
    const parentRowId = areaToParentRowMap[areaId];

    // --- Function: createNewArea (Initiate Split) ---
    function createNewArea(horizontal: boolean) {
        const currentViewportSize = horizontal ? viewport.width : viewport.height;
        const minRequiredSize = AREA_MIN_CONTENT_WIDTH * 2;
        
        if (currentViewportSize < minRequiredSize) {
            setupJoinMoveHandlers();
            if (currentOnMove) {
                currentOnMove(lastMousePosition);
            }
            return;
        }

        // Get source area type and state
        const sourceAreaData = useKarmycStore.getState().getAreaById(areaId);
        if (!sourceAreaData) {
            console.error("Source area data not found");
            setAreaResizing(false);
            return;
        }

        // --- Perform State Updates using Zustand (Actions are on root store) ---
        const splitResult = useKarmycStore.getState().splitArea({
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

        // Wait for layout to be updated
        const checkLayout = () => {
            const currentActiveScreenStateAfterSplit = getActiveScreenState();
            if (!currentActiveScreenStateAfterSplit) {
                console.error("Failed to get active screen state after split");
                setAreaResizing(false);
                return;
            }
            
            const newRowLayout = currentActiveScreenStateAfterSplit.layout[newRowId] as AreaRowLayout;

            if (!newRowLayout || newRowLayout.type !== 'area_row') {
                console.error(`Split seemed successful but row ${newRowId} not found or not a row in active screen state.`);
                setAreaResizing(false);
                return;
            }

            // Check that areas have valid sizes
            const hasValidSizes = newRowLayout.areas.every(area => area.size >= 0.1);
            if (!hasValidSizes) {
                console.error("Invalid sizes detected in new row layout");
                setAreaResizing(false);
                return;
            }

            // Update new area type and state
            const newAreaId = newRowLayout.areas[separatorIndex].id;
            useKarmycStore.getState().updateArea({
                id: newAreaId,
                type: sourceAreaData.type,
                state: { ...sourceAreaData.state }
            });

            // Update area sizes to be equal
            const equalSizes = newRowLayout.areas.map(() => 1 / newRowLayout.areas.length);
            useKarmycStore.getState().setRowSizes({ 
                rowId: newRowId, 
                sizes: equalSizes 
            });

            setupResizeHandlers(newRowLayout, separatorIndex, setResizePreview);
            if (currentOnMove) {
                currentOnMove(lastMousePosition);
            }
        };

        // Wait one tick to ensure layout is updated
        setTimeout(checkLayout, 0);
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

        // Vérifier que la taille totale est valide
        if (sizeToShare <= 0) {
            console.error("Invalid total size for resize operation");
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); };
            return;
        }

        // --- Debounce Logic --- similar to areaDragResize
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const debounceDelay = 75; // ms
        let lastT = 0.5; // Store last calculated t for final update

        const performGlobalUpdate = (sizes: number[]) => {
            // Vérifier que les tailles sont valides avant la mise à jour
            const minSize = 0.1; // 10% minimum
            const hasInvalidSizes = sizes.some(size => size < minSize);
            
            if (hasInvalidSizes) {
                console.warn("Invalid sizes detected, adjusting to minimum values");
                // Ajuster les tailles pour respecter le minimum
                const adjustedSizes = sizes.map(size => Math.max(size, minSize));
                const total = adjustedSizes.reduce((sum, s) => sum + s, 0);
                const normalizedSizes = adjustedSizes.map(s => s / total);
                useKarmycStore.getState().setRowSizes({ rowId: rowToResize.id, sizes: normalizedSizes });
            } else {
                useKarmycStore.getState().setRowSizes({ rowId: rowToResize.id, sizes });
            }
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
            }
        };
        // --- End Debounce Logic ---

        currentOnMove = (vec: Vec2) => {
            // Get FRESH ACTIVE screen state
            const currentActiveState = getActiveScreenState();
            if (!currentActiveState) return;
            const currentLayout = currentActiveState.layout;
            const currentRow = currentLayout[rowToResize.id] as AreaRowLayout;
            const currentRootId = currentActiveState.rootId;

            if (!currentRow || !currentRootId || currentRow.type !== 'area_row') {
                console.warn("Resize handler: Row or rootId not found/invalid in current active screen state.");
                return;
            }

            // Use active screen layout/rootId for viewport calculation
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

            const minT = Math.max(0.1, AREA_MIN_CONTENT_WIDTH / viewportSize); // Minimum 10%
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

            // Vérifier que les tailles sont valides
            const minSize = 0.1; // 10% minimum
            const hasInvalidSizes = tempSizes.some(size => size < minSize);
            
            if (hasInvalidSizes) {
                console.warn("Invalid sizes detected in preview, adjusting to minimum values");
                // Ajuster les tailles pour respecter le minimum
                const adjustedSizes = tempSizes.map(size => Math.max(size, minSize));
                const total = adjustedSizes.reduce((sum, s) => sum + s, 0);
                const normalizedSizes = adjustedSizes.map(s => s / total);
                triggerDebouncedUpdate(normalizedSizes);
            } else {
                const tempTotalSize = tempSizes.reduce((sum, s) => sum + s, 0);
                if (tempTotalSize > 0) {
                    const normalizedSizes = tempSizes.map(s => s / tempTotalSize);
                    triggerDebouncedUpdate(normalizedSizes);
                } else {
                    console.warn("Resize handler: Debounce skipped, zero total size.");
                }
            }
        };

        currentOnMouseUp = () => {
            // 1. Cancel any pending debounced update
            cancelDebouncedUpdate();

            // 2. Calculate FINAL sizes based on lastT
            const finalSize0 = lastT * sizeToShare;
            const finalSize1 = (1 - lastT) * sizeToShare;

            // Get the latest row state to construct the final sizes array correctly
            const finalRowState = getActiveScreenState()?.layout[rowToResize.id] as AreaRowLayout;
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
        // Find the parent row of the source area ONCE
        const initialParentRow = parentRowId ? initialLayout[parentRowId] as AreaRowLayout : null;
        if (!initialParentRow || initialParentRow.type !== 'area_row') {
            console.error("Join/Move setup: Source area does not have a valid parent row. Cannot determine siblings.");
            // Cannot proceed with join logic without siblings
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); useKarmycStore.getState().setJoinPreview(null); }; // Basic cleanup
            return;
        }
        const sourceAreaIndex = initialParentRow.areas.findIndex(a => a.id === areaId);
        if (sourceAreaIndex === -1) {
            console.error(`Join/Move setup: Source area ${areaId} not found within its supposed parent row ${parentRowId}.`);
            currentOnMove = null;
            currentOnMouseUp = () => { setAreaResizing(false); useKarmycStore.getState().setJoinPreview(null); };
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

        currentOnMove = (vec: Vec2) => {
            const currentActiveState = getActiveScreenState(); // Use helper
            if (!currentActiveState) return;

            const currentLayout = currentActiveState.layout;
            const currentRootId = currentActiveState.rootId;
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
                useKarmycStore.getState().setJoinPreview({
                    areaId: targetAreaId, // The immediate eligible sibling area currently hovered
                    movingInDirection: direction,
                    eligibleAreaIds: actualEligibleAreaIds // Pass the correct full list of *all* siblings for potential future use?
                    // Or should this also be immediateSiblings? Let's keep all siblings for now.
                });
            } else {
                // If not hovering over an eligible immediate sibling, clear the preview
                if (getActiveScreenState()?.joinPreview !== null) { // Only clear if needed
                    useKarmycStore.getState().setJoinPreview(null);
                }
            }
        };

        currentOnMouseUp = () => {
            const state = getActiveScreenState();
            const preview = state?.joinPreview;

            // Check if the PREVIEW state contains a valid IMMEDIATE sibling target when mouse is released
            if (preview && preview.areaId && preview.movingInDirection && immediateSiblings.includes(preview.areaId)) {
                useKarmycStore.getState().joinOrMoveArea({ sourceAreaId: areaId, targetAreaId: preview.areaId, direction: preview.movingInDirection });
            } 

            // Clear preview regardless of whether the action was triggered
            if (getActiveScreenState()?.joinPreview !== null) {
                useKarmycStore.getState().setJoinPreview(null);
            }
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

        if (dist < 10) { // Threshold
            return; // Not moved enough
        }

        // DIRECTION DETERMINED - Detach this initial listener and attach the correct one
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);

        // *** LOG before determination ***
        const isMovingInwards = determineIfMovingInwards(corner, delta);
        
        // Déterminer si le mouvement est principalement horizontal ou vertical
        const absX = Math.abs(delta.x);
        const absY = Math.abs(delta.y);
        const horizontalSplit = absX > absY;

        if (isMovingInwards) {
            // Si le mouvement est vers l'intérieur, créer une nouvelle zone (division)
            createNewArea(horizontalSplit);
        } else {
            // Si le mouvement est vers l'extérieur, initier join/move
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
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);

        if (!initialDirectionDetermined) {
            setAreaResizing(false);
            // Ensure join preview is cleared if mouseup happens early
            if (getActiveScreenState()?.joinPreview !== null) {
                useKarmycStore.getState().setJoinPreview(null);
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
