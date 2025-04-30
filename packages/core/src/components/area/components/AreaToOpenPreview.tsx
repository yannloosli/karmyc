import { areaRegistry } from "@gamesberry/karmyc-core/area/registry";
import { AREA_BORDER_WIDTH, AREA_PLACEMENT_TRESHOLD } from "@gamesberry/karmyc-core/constants";
import { useAreaStore } from "@gamesberry/karmyc-core/stores/areaStore";
import AreaRootStyles from "@gamesberry/karmyc-core/styles/AreaRoot.styles";
import { Area, AreaLayout, AreaRowLayout, AreaToOpen } from "@gamesberry/karmyc-core/types/areaTypes";
import { Rect } from "@gamesberry/karmyc-core/types/geometry";
import { computeAreaToViewport } from "@gamesberry/karmyc-core/utils/areaToViewport";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "@gamesberry/karmyc-core/utils/areaUtils";
import { getAreaRootViewport } from "@gamesberry/karmyc-core/utils/getAreaViewport";
import { compileStylesheetLabelled } from "@gamesberry/karmyc-core/utils/stylesheets";
import { contractRect, Vec2 } from "@gamesberry/karmyc-shared";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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

    // Sélectionner uniquement les actions nécessaires du store pour éviter les rendus inutiles
    const updateAreaToOpenPosition = useAreaStore(s => s.updateAreaToOpenPosition);
    const clearAreaToOpen = useAreaStore(s => s.cleanupTemporaryStates);
    const setAreaToOpen = useAreaStore(s => s.setAreaToOpen);
    const finalizeAreaPlacement = useAreaStore(s => s.finalizeAreaPlacement);

    // Ajouter un état local pour suivre le drag
    const [isDragging, setIsDragging] = useState(false);

    // Optimisation du updatePosition pour réduire les mises à jour
    const updatePosition = useCallback((x: number, y: number) => {
        if (isDragging) {
            console.log('[AreaToOpenPreview] Updating position:', { x, y });
            updateAreaToOpenPosition({ x, y });
        }
    }, [updateAreaToOpenPosition, isDragging]);

    // Memoization du calcul de targetId qui est coûteux
    const targetId = useMemo(() => {
        if (!rootId) return null;
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(position, { layout, rootId, areas, areaToOpen }, areaToViewport, dimensions);
    }, [areaToOpen.position.x, areaToOpen.position.y, layout, rootId, areas, areaToViewport, dimensions]);

    // Le calcul du placement est également coûteux, mémoisons-le
    const placement = useMemo(() => {
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(viewport, position);
    }, [viewport, areaToOpen.position.x, areaToOpen.position.y]);

    // Simplifier le handleDragOver
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    // Ajouter un gestionnaire de dragStart
    const handleDragStart = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
        console.log('[AreaToOpenPreview] DragStart dans la prévisualisation');
    }, []);

    // Ajouter un gestionnaire de dragEnd
    const handleDragEnd = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        console.log('[AreaToOpenPreview] DragEnd dans la prévisualisation');
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
                    pointerEvents: 'auto',
                    userSelect: 'none',
                    touchAction: 'none',
                    willChange: 'transform',
                    transform: 'translate(-50%, -50%) scale(0.4)',
                    outline: '2px solid red'
                }}
                draggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
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
                    onDragOver={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        console.log('[AreaToOpenPreview] DragOver on overlay');
                        updatePosition(e.clientX, e.clientY);
                    }}
                    onDrop={(e) => {
                        e.preventDefault();
                        e.stopPropagation();

                        // Annuler le timeout de nettoyage de dragEnd s'il existe
                        if ((window as any).__dragEndCleanupTimeout) {
                            clearTimeout((window as any).__dragEndCleanupTimeout);
                            (window as any).__dragEndCleanupTimeout = null;
                            console.log('[AreaToOpenPreview] Cancelled dragEnd cleanup timeout from overlay');
                        }

                        console.log('[AreaToOpenPreview] Drop on overlay!', {
                            position: { x: e.clientX, y: e.clientY },
                            targetId,
                            placement
                        });

                        try {
                            // Mettre à jour une dernière fois la position
                            updatePosition(e.clientX, e.clientY);
                            // Finaliser le placement
                            finalizeAreaPlacement();
                            console.log('[AreaToOpenPreview] finalizeAreaPlacement completed successfully');
                        } catch (error) {
                            console.error('[AreaToOpenPreview] Drop overlay error:', error);
                            clearAreaToOpen();
                        } finally {
                            setIsDragging(false);
                        }
                    }}
                    onDragEnter={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[AreaToOpenPreview] DragEnter on overlay');
                    }}
                    onDragLeave={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('[AreaToOpenPreview] DragLeave from overlay');
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

    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !rootId || !props.areaToViewport || Object.keys(props.areaToViewport).length === 0) return null;
        const currentPositionVec2 = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(
            currentPositionVec2,
            { layout, rootId, areas, areaToOpen },
            props.areaToViewport,
            detectionDimensions
        );
    }, [
        areaToOpen?.position.x,
        areaToOpen?.position.y,
        layout,
        rootId,
        areas,
        props.areaToViewport,
        detectionDimensions
    ]);

    const areaToOpenTargetViewport = useMemo(() => {
        return areaToOpenTargetId ? props.areaToViewport[areaToOpenTargetId] : null;
    }, [areaToOpenTargetId, props.areaToViewport]);

    const initialDimensions = useMemo(() => Vec2.new(100, 100), []);
    const [areaToOpenDimensions, setAreaToOpenDimensions] = useState(initialDimensions);

    useEffect(() => {
        if (!areaToOpenTargetId) return;
        const viewport = props.areaToViewport[areaToOpenTargetId];
        if (!viewport) return;

        const newDimensions = Vec2.new(viewport.width, viewport.height);
        if (newDimensions.x !== areaToOpenDimensions.x || newDimensions.y !== areaToOpenDimensions.y) {
            setAreaToOpenDimensions(newDimensions);
        }
    }, [areaToOpenTargetId, props.areaToViewport, areaToOpenDimensions]);

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
}, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps.areaToViewport || {});
    const nextKeys = Object.keys(nextProps.areaToViewport || {});

    if (prevKeys.length !== nextKeys.length) return false;

    return prevKeys.every(key => nextKeys.includes(key));
});
