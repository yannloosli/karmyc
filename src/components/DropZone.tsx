import React, { useEffect, useMemo } from "react";
import { Vec2 } from "../utils";
import { AreaToOpen } from "../types/areaTypes";
import { PlaceArea } from "../utils/areaUtils";
import { useKarmycStore } from "../store/areaStore";
import useAreaDragAndDrop from "../hooks/useAreaDragAndDrop";
import { AREA_PLACEMENT_TRESHOLD } from "../utils/constants";
import { useTranslation } from '../hooks/useTranslation';

interface DropZoneProps {
    areaToOpen: AreaToOpen;
    dimensions: Vec2;
    setAreaToOpenDimensions: (dimensions: Vec2) => void;
}

export const DropZone: React.FC<DropZoneProps> = React.memo(({
    areaToOpen,
    dimensions,
    setAreaToOpenDimensions
}) => {
    const setViewports = useKarmycStore(state => state.setViewports);
    const areaToViewport = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.viewports);
    const { t } = useTranslation();
    
    const {
        handleDragOver,
        handleDrop,
        handleDragEnd,
        areaToOpenTargetId,
        areaToOpenTargetViewport,
        calculatedPlacement
    } = useAreaDragAndDrop();

    useEffect(() => {
        if (!areaToOpenTargetId || !areaToOpenTargetViewport) return;
        const newDimensions = Vec2.new(areaToOpenTargetViewport.width, areaToOpenTargetViewport.height);
        if (newDimensions.x !== dimensions.x || newDimensions.y !== dimensions.y) {
            setAreaToOpenDimensions(newDimensions);
        }
    }, [areaToOpenTargetId, areaToOpenTargetViewport, dimensions, setAreaToOpenDimensions]);

    // Update viewports
    useEffect(() => {
        setViewports(areaToViewport);
    }, [areaToViewport, setViewports]);

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
            stack: [nw_1, ne_1, se_1, sw_1],
        };
        return { lines, placementLines };
    }, [areaToOpenTargetViewport]);

    const pathData = useMemo(() => {
        if (!areaToOpenTargetViewport || !placementLinesMemo.placementLines || !placementLinesMemo.placementLines[calculatedPlacement]) return "";
        const hlines = placementLinesMemo.placementLines[calculatedPlacement];
        return hlines.map((p: Vec2) => [p.x, p.y].join(",")).map((str: string, i: number) => [i === 0 ? "M" : "L", str].join(" ")).join(" ") + " Z";
    }, [areaToOpenTargetViewport, placementLinesMemo.placementLines, calculatedPlacement]);

    if (!areaToOpenTargetViewport) {
        return null;
    }

    return (
        <div
            className={`area-to-open-overlay`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >

            {areaToOpenTargetViewport && (
                <svg
                    width={areaToOpenTargetViewport.width}
                    height={areaToOpenTargetViewport.height}
                    className="area-to-open-overlay__placement"
                    style={{
                        left: areaToOpenTargetViewport.left,
                        top: areaToOpenTargetViewport.top,
                    }}
                >
                    {placementLinesMemo.lines.map(([p0, p1], i) => (
                        <line key={i} x1={p0.x} y1={p0.y} x2={p1.x} y2={p1.y} />
                    ))}
                    <path d={pathData} />
                </svg>
            )}
        </div>
    );
}); 
