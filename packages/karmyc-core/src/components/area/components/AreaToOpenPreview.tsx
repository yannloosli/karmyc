import { Vec2 } from "@gamesberry/karmyc-shared";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AreaComponent } from "./Area";
import { areaRegistry } from "../../../area/registry";
import { AREA_PLACEMENT_TRESHOLD, TOOLBAR_HEIGHT } from "../../../constants";
import { useAreaStore } from "../../../stores/areaStore";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { Area, AreaLayout, AreaRowLayout, AreaToOpen } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from "../../../utils/areaUtils";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";

type LayoutMap = Record<string, AreaLayout | AreaRowLayout>;
type AreasMap = Record<string, Area>;

interface RenderAreaToOpenProps {
    viewport: Rect;
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    targetId: string | null;
    placement: PlaceArea;
    placementLinesMemo: { lines: Vec2[][]; placementLines: Record<PlaceArea, Vec2[]> };
    pathData: string;
    handleDragOver: (e: React.DragEvent) => void;
    handleDrop: (e: React.DragEvent) => void;
}

const RenderAreaToOpen: React.FC<RenderAreaToOpenProps> = React.memo((props) => {
    const { areaToOpen, viewport, dimensions, targetId, placement, placementLinesMemo, pathData } = props;

    const Component = areaRegistry.getComponent(areaToOpen.area.type);
    if (!Component) {
        return null;
    }

    const containerStyle: React.CSSProperties = {
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
        outline: '3px dashed blue'
    };

    return (
        <div
            className={s("areaToOpenContainer")}
            style={containerStyle}
        >
            <AreaComponent
                id="-1"
                Component={Component}
                raised
                state={areaToOpen.area.state}
                type={areaToOpen.area.type}
                viewport={{
                    left: 0,
                    top: 0,
                    height: dimensions.y,
                    width: dimensions.x,
                }}
                setResizePreview={() => { }}
            />
        </div>
    );
});

const s = compileStylesheetLabelled(AreaRootStyles);

interface OwnProps {
    areaToViewport: { [key: string]: Rect };
}

export const AreaToOpenPreview: React.FC<OwnProps> = React.memo((props) => {
    // Lire chaque partie de l'état séparément pour éviter les problèmes de référence d'objet
    const areaToOpen = useAreaStore(state => state.screens[state.activeScreenId]?.areas.areaToOpen);
    const layout = useAreaStore(state => (state.screens[state.activeScreenId]?.areas.layout || {}) as LayoutMap);
    const rootId = useAreaStore(state => state.screens[state.activeScreenId]?.areas.rootId || null);
    const areas = useAreaStore(state => (state.screens[state.activeScreenId]?.areas.areas || {}) as AreasMap);

    // Actions
    const updateAreaToOpenPosition = useAreaStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacement = useAreaStore(state => state.finalizeAreaPlacement);
    const cleanupTemporaryStates = useAreaStore(state => state.cleanupTemporaryStates);

    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef(false);

    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const updatePosition = useCallback((x: number, y: number) => {
        if (isUpdatingRef.current) {
            return;
        }
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
        if (!areaToOpenTargetId || !areaToOpenTargetViewport) return;
        const newDimensions = Vec2.new(areaToOpenTargetViewport.width, areaToOpenTargetViewport.height);
        if (newDimensions.x !== areaToOpenDimensions.x || newDimensions.y !== areaToOpenDimensions.y) {
            setAreaToOpenDimensions(newDimensions);
        }
    }, [areaToOpenTargetId, areaToOpenTargetViewport, areaToOpenDimensions]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const sourceData = JSON.parse(e.dataTransfer.getData('text/plain'));
        if (!sourceData || sourceData.type !== 'menubar') { // Only handle menubar drops for now
            console.warn('[AreaToOpenPreview] handleDrop - Invalid or missing source data');
            cleanupTemporaryStates();
            return;
        }

        const sourceAreaId = sourceData.areaId;
        let targetAreaId: string | null = null;

        // Find the actual target element underneath the cursor, ignoring the preview itself
        const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

        for (const element of elementsUnderCursor) {
            // Ignore the overlay itself and the preview container
            if (element.classList.contains('global-drag-overlay') || element.classList.contains(s('areaToOpenContainer'))) {
                continue;
            }
            // Find the closest element with a data-areaid attribute
            const areaElement = element.closest<HTMLElement>('[data-areaid]');
            if (areaElement) {
                const potentialTargetId = areaElement.dataset.areaid;
                // Ensure it's not the preview ID ('-1') and not the source ID
                if (potentialTargetId && potentialTargetId !== '-1' && potentialTargetId !== sourceAreaId) {
                    targetAreaId = potentialTargetId;
                    break; // Found the first valid target underneath
                }
            }
        }

        if (!targetAreaId) {
            console.log('[AreaToOpenPreview] handleDrop - No valid drop target found under cursor, cleaning up.');
            cleanupTemporaryStates();
            return;
        }

        console.log(`[AreaToOpenPreview] handleDrop - Valid drop detected. Source: ${sourceAreaId}, Target: ${targetAreaId}`);

        try {
            // Update final position (optional, finalize might handle it)
            updatePosition(e.clientX, e.clientY);
            // Finalize the placement - Note: finalizeAreaPlacement might need modification 
            // if it previously relied solely on areaToOpenTargetId from getHoveredAreaId.
            // It might now need the explicit targetAreaId passed to it.
            // For now, we assume it uses the latest state correctly.
            finalizeAreaPlacement();
        } catch (error) {
            console.error('[AreaToOpenPreview] handleDrop - Error during finalization:', error);
            cleanupTemporaryStates();
        }
        // No need to explicitly null dragRef here, handleDragEnd on the source will do it.
    }, [cleanupTemporaryStates, finalizeAreaPlacement, updatePosition, s /* s is needed for class check */]);

    const placement = useMemo(() => {
        if (!areaToOpen || !areaToOpenTargetViewport) return 'replace';
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(areaToOpenTargetViewport, position);
    }, [areaToOpenTargetViewport, areaToOpen?.position.x, areaToOpen?.position.y]);

    const placementLinesMemo = useMemo(() => {
        if (!areaToOpenTargetViewport) return { lines: [], placementLines: {} as Record<PlaceArea, Vec2[]> };
        const viewport = areaToOpenTargetViewport;
        const treshold = Math.min(viewport.width, viewport.height) * AREA_PLACEMENT_TRESHOLD;
        const O = Vec2.new(treshold, treshold);
        const w = viewport.width; const h = viewport.height;
        const nw_0 = Vec2.new(0, 0); const ne_0 = Vec2.new(w, 0);
        const se_0 = Vec2.new(w, h); const sw_0 = Vec2.new(0, h);
        const nw_1 = nw_0.add(O); const ne_1 = ne_0.add(O.scaleX(-1));
        const se_1 = se_0.add(O.scale(-1)); const sw_1 = sw_0.add(O.scaleY(-1));
        const lines = [[nw_0, nw_1], [ne_0, ne_1], [sw_0, sw_1], [se_0, se_1], [nw_1, ne_1], [ne_1, se_1], [se_1, sw_1], [sw_1, nw_1]];
        const placementLines: Record<PlaceArea, Vec2[]> = {
            left: [nw_0, nw_1, sw_1, sw_0], top: [nw_0, ne_0, ne_1, nw_1],
            right: [ne_1, ne_0, se_0, se_1], bottom: [sw_0, sw_1, se_1, se_0],
            replace: [nw_1, ne_1, se_1, sw_1],
        };
        return { lines, placementLines };
    }, [areaToOpenTargetViewport]);

    const pathData = useMemo(() => {
        if (!areaToOpenTargetViewport || !placementLinesMemo.placementLines || !placementLinesMemo.placementLines[placement]) return "";
        const hlines = placementLinesMemo.placementLines[placement];
        return hlines.map((p: Vec2) => [p.x, p.y].join(",")).map((str: string, i: number) => [i === 0 ? "M" : "L", str].join(" ")).join(" ") + " Z";
    }, [areaToOpenTargetViewport, placementLinesMemo.placementLines, placement]);

    if (!areaToOpen) {
        return null;
    }

    return (
        <>
            <RenderAreaToOpen
                areaToOpen={areaToOpen}
                viewport={areaToOpenTargetViewport ?? { left: 0, top: 0, width: 0, height: 0 }}
                dimensions={areaToOpenDimensions}
                targetId={areaToOpenTargetId ?? null}
                placement={placement}
                placementLinesMemo={placementLinesMemo}
                pathData={pathData}
                handleDragOver={handleDragOver}
                handleDrop={handleDrop}
            />

            <div
                className="global-drag-overlay"
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    pointerEvents: 'auto'
                }}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
            >
                {areaToOpenTargetViewport && (
                    <svg width={areaToOpenTargetViewport.width}
                        height={areaToOpenTargetViewport.height}
                        className={s("placement")}
                        style={{
                            position: 'absolute',
                            left: areaToOpenTargetViewport.left,
                            top: areaToOpenTargetViewport.top + TOOLBAR_HEIGHT,
                            pointerEvents: 'none'
                        }}
                    >
                        {placementLinesMemo.lines.map(([p0, p1], i) => (
                            <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} />
                        ))}
                        <path d={pathData} />
                    </svg>
                )}
            </div>
        </>
    );
}, (prevProps, nextProps) => {
    const prevKeys = Object.keys(prevProps.areaToViewport || {});
    const nextKeys = Object.keys(nextProps.areaToViewport || {});
    if (prevKeys.length !== nextKeys.length) return false;
    return prevKeys.every(key => nextKeys.includes(key));
});
