import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { areaRegistry } from "~/area/registry";
import { AREA_BORDER_WIDTH, AREA_PLACEMENT_TRESHOLD } from "~/constants";
import { useVec2TransitionState } from "~/hooks/useNumberTransitionState";
import { RootState } from "~/store";
import { clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen, updateAreaToOpenPosition } from "~/store/slices/areaSlice";
import AreaRootStyles from "~/styles/AreaRoot.styles";
import { AreaToOpen } from "~/types/areaTypes";
import { Rect } from "~/types/geometry";
import { computeAreaToParentRow } from "~/utils/areaToParentRow";
import { computeAreaToViewport } from "~/utils/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "~/utils/areaUtils";
import { getAreaRootViewport } from "~/utils/getAreaViewport";
import { contractRect } from "~/utils/math";
import { Vec2 } from "~/utils/math/vec2";
import { requestAction } from "~/utils/requestAction";
import { compileStylesheetLabelled } from "~/utils/stylesheets";
import { AreaComponent } from "./Area";

interface RenderAreaToOpenProps {
    viewport: Rect;
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    areaState: RootState['area'];
    areaToViewport: { [key: string]: Rect };
}

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = React.memo((props) => {
    const { areaToOpen, viewport, dimensions, areaState, areaToViewport } = props;
    const dispatch = useDispatch();
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef(false);

    const updatePosition = useCallback((x: number, y: number) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        rafRef.current = requestAnimationFrame(() => {
            dispatch(updateAreaToOpenPosition({ x, y }));
            isUpdatingRef.current = false;
        });
    }, [dispatch]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    // Memorize areaToViewport calculation
    const memoizedAreaToViewport = useMemo(() => {
        return computeAreaToViewport(areaState.layout, areaState.rootId, getAreaRootViewport());
    }, [areaState.layout, areaState.rootId]);

    // Function to check if an area is a leaf
    const isAreaLeaf = useCallback((areaId: string): boolean => {
        // Search the layout to find the area
        const layout = areaState.layout[areaId];
        if (!layout) return false;

        // If it's an area (not a row), it's a leaf
        return layout.type === 'area';
    }, [areaState.layout]);

    // Calculate the target area ID
    const targetId = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(position, areaState, areaToViewport, dimensions);
    }, [areaToOpen.position, areaState, areaToViewport, dimensions]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Get sourceId from transfer data
        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId) {
            console.warn('[AreaToOpenPreview] handleDrop - No sourceId found');
            dispatch(clearAreaToOpen());
            return;
        }

        // Update state with sourceId and correct type
        const sourceData = JSON.parse(sourceId);

        // If it's a new area creation, keep the current areaToOpen
        if (sourceData.type === 'create-new') {
            requestAction({}, (params) => {
                params.dispatch(finalizeAreaPlacement());
                params.submitAction("Finalize area placement");
            });
            return;
        }

        // For other types (like menubar), use a simplified approach with a single action
        const sourceArea = areaState.areas[sourceData.areaId];
        if (!sourceArea) {
            console.warn('[AreaToOpenPreview] handleDrop - Source area not found:', sourceData.areaId);
            dispatch(clearAreaToOpen());
            return;
        }

        // Check if dropping on the same area or within the same area
        const dropPosition = Vec2.new(e.clientX, e.clientY);
        const hoveredAreaId = getHoveredAreaId(dropPosition, areaState, areaToViewport, dimensions);

        // Get information about the structure for verification
        const areaToParentRow = computeAreaToParentRow(areaState);
        const sourceParentRowId = areaToParentRow[sourceData.areaId];

        // Safety check for parent
        if (!sourceParentRowId) {
            console.warn('[AreaToOpenPreview] handleDrop - No parent row for source area, risky operation, cancelling');
            dispatch(clearAreaToOpen());
            return;
        }

        // Determine if it's a self-drop (same ID or border of the same area)
        let isSelfDrop = false;

        // 1. Direct ID check (exactly the same area)
        if (hoveredAreaId && sourceData.areaId === hoveredAreaId) {
            isSelfDrop = true;
        }
        // 2. Placement check if we're on a border of the same area
        else if (hoveredAreaId && areaToViewport[hoveredAreaId]) {
            const viewport = areaToViewport[hoveredAreaId];
            const placement = getAreaToOpenPlacementInViewport(viewport, dropPosition);

            // If the target area and source area are in the same parent row
            // and we're on a border (top, left, right, bottom)
            const targetParentRowId = areaToParentRow[hoveredAreaId];

            if (targetParentRowId && sourceParentRowId === targetParentRowId &&
                (placement === "top" || placement === "left" || placement === "right" || placement === "bottom")) {

                // For areas in the same parent row, check orientation
                const parentRow = areaState.layout[sourceParentRowId];
                if (parentRow && parentRow.type === 'area_row') {
                    const isHorizontal = parentRow.orientation === 'horizontal';

                    // If we're in the same row and dropping on the same source area
                    if (sourceData.areaId === hoveredAreaId) {
                        isSelfDrop = true;
                    }
                    // Otherwise, check only adjacent areas in the same orientation
                    else {
                        // Find the index of the source area and target area in the row
                        const sourceIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === sourceData.areaId);
                        const targetIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === hoveredAreaId);

                        // If the two zones are adjacent and the drop is in the same orientation as the row,
                        // we allow the drop (not a self-drop)
                        const areAdjacent = Math.abs(sourceIndex - targetIndex) === 1;

                        // If not adjacent or if dropping in a different orientation, not a self-drop
                        if (!areAdjacent) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop on a non-adjacent area in the same row, allowed');
                        } else if ((isHorizontal && (placement === "top" || placement === "bottom")) ||
                            (!isHorizontal && (placement === "left" || placement === "right"))) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop in a different orientation than the row, allowed');
                        } else {
                            // Case where an area is dropped next to itself in the same orientation
                            // Example: left area dropped on the left edge of its right neighbor
                            isSelfDrop = true;
                        }
                    }
                }
            }

            // Check specifically for nested rows that could be related
            const sourceParentRow = areaState.layout[sourceParentRowId];
            if (sourceParentRow && sourceParentRow.type === 'area_row') {
                // If the target area is part of a larger structure that includes the source area
                if (targetParentRowId &&
                    (targetParentRowId === sourceData.areaId ||
                        sourceParentRowId === hoveredAreaId)) {
                    isSelfDrop = true;
                }
            }
        }

        // Cancel if it's a self-drop
        if (isSelfDrop) {
            dispatch(clearAreaToOpen());
            return;
        }

        // Create a single action to move the area
        requestAction({}, (params) => {
            try {
                // Prepare information needed for the move
                const areaToOpenData = {
                    position: { x: e.clientX, y: e.clientY },
                    area: {
                        type: sourceArea.type,
                        state: { ...sourceArea.state, sourceId: sourceData.areaId }
                    }
                };

                // We use setAreaToOpen followed immediately by finalizeAreaPlacement
                // to avoid issues with Immer and intermediate state
                params.dispatch(setAreaToOpen(areaToOpenData));
                params.dispatch(finalizeAreaPlacement());

                // Submit the action after everything is done
                params.submitAction("Move area");
            } catch (error) {
                console.error('[AreaToOpenPreview] handleDrop - Error during move:', error);
                dispatch(clearAreaToOpen());
            }
        });
    }, [dispatch, areaState.areas, areaState, areaToViewport, dimensions]);

    const placement = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(viewport, position);
    }, [viewport, areaToOpen.position]);

    // Memorize the placement lines calculations
    const placementLinesMemo = useMemo(() => {
        const treshold = Math.min(viewport.width, viewport.height) * AREA_PLACEMENT_TRESHOLD;
        const O = Vec2.new(treshold, treshold);

        const w = viewport.width;
        const h = viewport.height;

        const nw_0 = Vec2.new(0, 0);
        const ne_0 = Vec2.new(w, 0);
        const se_0 = Vec2.new(w, h);
        const sw_0 = Vec2.new(0, h);

        const nw_1 = nw_0.add(O);
        const ne_1 = ne_0.add(O.scaleX(-1));
        const se_1 = se_0.add(O.scale(-1));
        const sw_1 = sw_0.add(O.scaleY(-1));

        const lines = [
            [nw_0, nw_1],
            [ne_0, ne_1],
            [sw_0, sw_1],
            [se_0, se_1],
            [nw_1, ne_1],
            [ne_1, se_1],
            [se_1, sw_1],
            [sw_1, nw_1],
        ];

        const placementLines: Record<PlaceArea, Vec2[]> = {
            left: [nw_0, nw_1, sw_1, sw_0],
            top: [nw_0, ne_0, ne_1, nw_1],
            right: [ne_1, ne_0, se_0, se_1],
            bottom: [sw_0, sw_1, se_1, se_0],
            replace: [nw_1, ne_1, se_1, sw_1],
        };

        return { lines, placementLines };
    }, [viewport.width, viewport.height]);

    // Memorize the SVG path calculation
    const pathData = useMemo(() => {
        const hlines = placementLinesMemo.placementLines[placement];
        return hlines
            .map((p: Vec2) => [p.x, p.y].join(","))
            .map((str: string, i: number) => [i === 0 ? "M" : "L", str].join(" "))
            .join(" ") + " Z";
    }, [placementLinesMemo.placementLines, placement]);

    // Get the component from the registry
    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    return (
        <>
            <div
                className={s("areaToOpenContainer")}
                style={{
                    left: areaToOpen.position.x,
                    top: areaToOpen.position.y,
                    position: 'fixed',
                    zIndex: 10001,
                    cursor: 'move',
                    pointerEvents: 'none',
                    userSelect: 'none',
                    touchAction: 'none',
                    willChange: 'transform',
                    transform: 'translate(-50%, -50%) scale(0.4)',
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                <AreaComponent
                    id="-1"
                    Component={Component}
                    raised
                    state={areaToOpen.area.state}
                    type={areaToOpen.area.type}
                    viewport={{
                        left: -(dimensions.x / 2),
                        top: -(dimensions.y / 2),
                        height: dimensions.y,
                        width: dimensions.x,
                    }}
                />
            </div>
            {targetId && isAreaLeaf(targetId) && (
                <div
                    className={s("areaToOpenTargetOverlay")}
                    style={{
                        ...contractRect(viewport, AREA_BORDER_WIDTH),
                        transition: 'opacity 0.1s ease-out',
                        position: 'absolute',
                        zIndex: 10000,
                        pointerEvents: 'auto',
                        userSelect: 'none',
                        touchAction: 'none',
                        willChange: 'transform'
                    }}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <svg width={viewport.width} height={viewport.height} className={s("placement")}>
                        {placementLinesMemo.lines.map(([p0, p1], i) => (
                            <line
                                key={i}
                                x1={p0.x}
                                y1={p0.y}
                                x2={p1.x}
                                y2={p1.y}
                            />
                        ))}
                        <path d={pathData} />
                    </svg>
                </div>
            )}
        </>
    );
});

const s = compileStylesheetLabelled(AreaRootStyles);

interface OwnProps {
    areaToViewport: { [key: string]: Rect };
}

export const AreaToOpenPreview: React.FC<OwnProps> = React.memo((props) => {
    const areaState = useSelector((state: RootState) => state.area);
    const { areaToOpen } = areaState;

    // Visual dimensions of the preview (with animation)
    const [areaToOpenDimensions, setAreaToOpenDimensions] = useVec2TransitionState(
        Vec2.new(100, 100),
        { duration: 250, bezier: [0.24, 0.02, 0.18, 0.97] },
    );

    // Fixed dimensions for target area detection
    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !props.areaToViewport || Object.keys(props.areaToViewport).length === 0) return null;
        return getHoveredAreaId(areaToOpen.position, areaState, props.areaToViewport, detectionDimensions);
    }, [areaToOpen, areaState, props.areaToViewport, detectionDimensions]);

    const areaToOpenTargetViewport = areaToOpenTargetId ? props.areaToViewport[areaToOpenTargetId] : null;

    useEffect(() => {
        if (!areaToOpenTargetId) return;

        const viewport = props.areaToViewport[areaToOpenTargetId];
        if (!viewport) return;

        const dimensions = Vec2.new(viewport.width, viewport.height);
        setAreaToOpenDimensions(dimensions);
    }, [areaToOpenTargetId, props.areaToViewport]);

    if (!areaToOpen || !areaToOpenTargetViewport) {
        return null;
    }

    return (
        <RenderAreaToOpen
            areaToOpen={areaToOpen}
            viewport={areaToOpenTargetViewport}
            dimensions={areaToOpenDimensions}
            areaState={areaState}
            areaToViewport={props.areaToViewport}
        />
    );
});
