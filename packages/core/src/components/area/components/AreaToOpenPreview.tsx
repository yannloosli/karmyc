import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { AREA_BORDER_WIDTH, AREA_PLACEMENT_TRESHOLD } from "@gamesberry/karmyc-core/constants";
import { useVec2TransitionState } from "@gamesberry/karmyc-core/hooks/useNumberTransitionState";
import { useAreaStore } from "@gamesberry/karmyc-core/stores/areaStore";
import AreaRootStyles from "@gamesberry/karmyc-core/styles/AreaRoot.styles";
import { Area, AreaLayout, AreaRowLayout, AreaToOpen } from "@gamesberry/karmyc-core/types/areaTypes";
import { Rect } from "@gamesberry/karmyc-core/types/geometry";
import { computeAreaToParentRow } from "@gamesberry/karmyc-core/utils/areaToParentRow";
import { computeAreaToViewport } from "@gamesberry/karmyc-core/utils/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "@gamesberry/karmyc-core/utils/areaUtils";
import { getAreaRootViewport } from "@gamesberry/karmyc-core/utils/getAreaViewport";
import { requestAction } from "@gamesberry/karmyc-core/utils/requestAction";
import { compileStylesheetLabelled } from "@gamesberry/karmyc-core/utils/stylesheets";
import { contractRect, Vec2 } from "@gamesberry/karmyc-shared";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { AreaComponent } from "./Area";

type LayoutMap = Record<string, AreaLayout | AreaRowLayout>;
type AreasMap = Record<string, Area>;

interface RenderAreaToOpenProps {
    viewport: Rect;
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    layout: LayoutMap;
    rootId: string | null;
    areas: AreasMap;
    areaToViewport: { [key: string]: Rect };
}

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = React.memo((props) => {
    const { areaToOpen, viewport, dimensions, layout, rootId, areas, areaToViewport } = props;
    const updateAreaToOpenPosition = useAreaStore(s => s.updateAreaToOpenPosition);
    const clearAreaToOpen = useAreaStore(s => s.cleanupTemporaryStates);
    const setAreaToOpen = useAreaStore(s => s.setAreaToOpen);
    const finalizeAreaPlacement = useAreaStore(s => s.finalizeAreaPlacement);

    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef(false);

    const updatePosition = useCallback((x: number, y: number) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        rafRef.current = requestAnimationFrame(() => {
            updateAreaToOpenPosition({ x, y });
            isUpdatingRef.current = false;
        });
    }, [updateAreaToOpenPosition]);

    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    const memoizedAreaToViewport = useMemo(() => {
        if (!rootId) return {};
        return computeAreaToViewport(layout, rootId, getAreaRootViewport());
    }, [layout, rootId]);

    const isAreaLeaf = useCallback((areaId: string): boolean => {
        const layoutEntry = layout[areaId];
        if (!layoutEntry) return false;

        return layoutEntry.type === 'area';
    }, [layout]);

    const targetId = useMemo(() => {
        if (!rootId) return null;
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(position, { layout, rootId, areas, areaToOpen }, areaToViewport, dimensions);
    }, [areaToOpen, layout, rootId, areas, areaToViewport, dimensions]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceId = e.dataTransfer.getData('text/plain');
        if (!sourceId) {
            console.warn('[AreaToOpenPreview] handleDrop - No sourceId found');
            clearAreaToOpen();
            return;
        }

        const sourceData = JSON.parse(sourceId);

        if (sourceData.type === 'create-new') {
            requestAction({}, (params) => {
                finalizeAreaPlacement();
                params.submitAction("Finalize area placement");
            });
            return;
        }

        const sourceArea = areas[sourceData.areaId];
        if (!sourceArea) {
            console.warn('[AreaToOpenPreview] handleDrop - Source area not found:', sourceData.areaId);
            clearAreaToOpen();
            return;
        }

        const dropPosition = Vec2.new(e.clientX, e.clientY);
        const hoveredAreaId = getHoveredAreaId(dropPosition, { layout, rootId, areas, areaToOpen }, areaToViewport, dimensions);

        const areaToParentRow = computeAreaToParentRow(layout, rootId);
        const sourceParentRowId = areaToParentRow[sourceData.areaId];

        if (!sourceParentRowId) {
            console.warn('[AreaToOpenPreview] handleDrop - No parent row for source area, risky operation, cancelling');
            clearAreaToOpen();
            return;
        }

        let isSelfDrop = false;

        if (hoveredAreaId && sourceData.areaId === hoveredAreaId) {
            isSelfDrop = true;
        }
        else if (hoveredAreaId && areaToViewport[hoveredAreaId]) {
            const viewport = areaToViewport[hoveredAreaId];
            const placement = getAreaToOpenPlacementInViewport(viewport, dropPosition);

            const targetParentRowId = areaToParentRow[hoveredAreaId];

            if (targetParentRowId && sourceParentRowId === targetParentRowId &&
                (placement === "top" || placement === "left" || placement === "right" || placement === "bottom")) {

                const parentRow = layout[sourceParentRowId];
                if (parentRow && parentRow.type === 'area_row') {
                    const isHorizontal = parentRow.orientation === 'horizontal';

                    if (sourceData.areaId === hoveredAreaId) {
                        isSelfDrop = true;
                    }
                    else {
                        const sourceIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === sourceData.areaId);
                        const targetIndex = parentRow.areas.findIndex((a: { id: string }) => a.id === hoveredAreaId);

                        const areAdjacent = Math.abs(sourceIndex - targetIndex) === 1;

                        if (!areAdjacent) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop on a non-adjacent area in the same row, allowed');
                        } else if ((isHorizontal && (placement === "top" || placement === "bottom")) ||
                            (!isHorizontal && (placement === "left" || placement === "right"))) {
                            console.log('[AreaToOpenPreview] handleDrop - Drop in a different orientation than the row, allowed');
                        } else {
                            isSelfDrop = true;
                        }
                    }
                }
            }

            const sourceParentRow = layout[sourceParentRowId];
            if (sourceParentRow && sourceParentRow.type === 'area_row') {
                if (targetParentRowId &&
                    (targetParentRowId === sourceData.areaId ||
                        sourceParentRowId === hoveredAreaId)) {
                    isSelfDrop = true;
                }
            }
        }

        if (isSelfDrop) {
            clearAreaToOpen();
            return;
        }

        requestAction({}, (params) => {
            try {
                const areaToOpenData = {
                    position: { x: e.clientX, y: e.clientY },
                    area: {
                        type: sourceArea.type,
                        state: { ...sourceArea.state, sourceId: sourceData.areaId }
                    }
                };

                setAreaToOpen(areaToOpenData);
                finalizeAreaPlacement();

                params.submitAction("Move area");
            } catch (error) {
                console.error('[AreaToOpenPreview] handleDrop - Error during move:', error);
                clearAreaToOpen();
            }
        });
    }, [clearAreaToOpen, setAreaToOpen, finalizeAreaPlacement, areas, layout, rootId, areaToViewport, dimensions, areaToOpen]);

    const placement = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(viewport, position);
    }, [viewport, areaToOpen.position]);

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

    const pathData = useMemo(() => {
        const hlines = placementLinesMemo.placementLines[placement];
        return hlines
            .map((p: Vec2) => [p.x, p.y].join(","))
            .map((str: string, i: number) => [i === 0 ? "M" : "L", str].join(" "))
            .join(" ") + " Z";
    }, [placementLinesMemo.placementLines, placement]);

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
                    setResizePreview={() => { }}
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
    const areaToOpen = useAreaStore(s => s.areaToOpen);
    const layout = useAreaStore(s => s.layout as LayoutMap);
    const rootId = useAreaStore(s => s.rootId);
    const areas = useAreaStore(s => s.areas as AreasMap);

    const initialPosition = useMemo(() => areaToOpen ? Vec2.new(areaToOpen.position) : Vec2.ORIGIN, [areaToOpen]);

    const dimensionOptions = useMemo(() => ({ duration: 250, bezier: [0.24, 0.02, 0.18, 0.97] as [number, number, number, number] }), []);
    const [areaToOpenDimensions, setAreaToOpenDimensions] = useVec2TransitionState(
        Vec2.new(100, 100),
        dimensionOptions
    );

    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !rootId || !props.areaToViewport || Object.keys(props.areaToViewport).length === 0) return null;
        const currentPositionVec2 = Vec2.new(areaToOpen.position);
        return getHoveredAreaId(currentPositionVec2, { layout, rootId, areas, areaToOpen }, props.areaToViewport, detectionDimensions);
    }, [areaToOpen, layout, rootId, areas, props.areaToViewport, detectionDimensions]);

    const areaToOpenTargetViewport = areaToOpenTargetId ? props.areaToViewport[areaToOpenTargetId] : null;

    const positionOptions = useMemo(() => ({ duration: 0.1 }), []);
    const [position, setPosition] = useVec2TransitionState(
        initialPosition,
        positionOptions
    );

    useEffect(() => {
        if (areaToOpen) {
            setPosition(Vec2.new(areaToOpen.position));
        }
    }, [areaToOpen?.position.x, areaToOpen?.position.y, setPosition, areaToOpen]);

    const previewStyle: React.CSSProperties = useMemo(() => ({
        left: position.x,
        top: position.y,
        position: 'fixed',
        zIndex: 10001,
        cursor: 'move',
        pointerEvents: 'none',
        userSelect: 'none',
        touchAction: 'none',
        willChange: 'transform',
        transform: 'translate(-50%, -50%) scale(0.4)',
    }), [position]);

    useEffect(() => {
        if (!areaToOpenTargetId) return;

        const viewport = props.areaToViewport[areaToOpenTargetId];
        if (!viewport) return;

        const dimensions = Vec2.new(viewport.width, viewport.height);
        setAreaToOpenDimensions(dimensions);
    }, [areaToOpenTargetId, props.areaToViewport, setAreaToOpenDimensions]);

    if (!areaToOpen || !areaToOpenTargetViewport) {
        return null;
    }

    return (
        <RenderAreaToOpen
            areaToOpen={areaToOpen}
            viewport={areaToOpenTargetViewport}
            dimensions={areaToOpenDimensions}
            layout={layout}
            rootId={rootId}
            areas={areas}
            areaToViewport={props.areaToViewport}
        />
    );
});
