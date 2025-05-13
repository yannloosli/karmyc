import React, { useCallback, useEffect, useState } from "react";
import { useLoadingState } from "../../../hooks/useLoadingState";
import { useKarmycStore } from "../../../stores/areaStore";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { AreaRowLayout } from "../../../types/areaTypes";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { LoadingIndicator } from "../../common/LoadingIndicator";
import { EmptyAreaMessage } from '../EmptyAreaMessage';
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";

const s = compileStylesheetLabelled(AreaRootStyles);

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

// Définir le type ResizePreviewState ici ou l'importer
interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

// Helper function to select active screen area state
const selectActiveScreenAreas = (state: ReturnType<typeof useKarmycStore.getState>) => {
    return state.screens[state.activeScreenId]?.areas;
};

const AreaRoot: React.FC = () => {
    // Selectors for active screen state
    const rootId = useKarmycStore(state => selectActiveScreenAreas(state)?.rootId);
    const layout = useKarmycStore(state => selectActiveScreenAreas(state)?.layout ?? {}); // Default to {} if undefined
    const joinPreview = useKarmycStore(state => selectActiveScreenAreas(state)?.joinPreview);
    const areaToOpen = useKarmycStore(state => selectActiveScreenAreas(state)?.areaToOpen);

    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);
    const { isLoading: loadingStateIsLoading } = useLoadingState('area-root');

    // Effect for resize handling (no change)
    useEffect(() => {
        const handleResize = () => {
            setViewport(getAreaRootViewport());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect for viewport calculation
    useEffect(() => {
        const layoutSize = Object.keys(layout).length; // layout is now guaranteed to be an object
        const currentRootItem = rootId ? layout[rootId] : null;

        if (resizePreview) {
            return;
        }

        if (!rootId || !currentRootItem || layoutSize === 0) {
            if (Object.keys(viewportMap).length > 0) setViewportMap({});
            return;
        }

        try {
            // computeAreaToViewport expects non-null layout and rootId here
            const newViewportMap = computeAreaToViewport(layout, rootId, viewport);

            if (JSON.stringify(viewportMap) !== JSON.stringify(newViewportMap)) {
                setViewportMap(newViewportMap);
            }

        } catch (error) {
            console.error("[AreaRoot] Erreur lors du calcul du viewportMap:", error);
            setViewportMap({});
        }
    }, [layout, rootId, viewport, resizePreview]);

    const getAreaVisualViewport = useCallback((areaId: string): Rect | undefined => {
        const baseViewport = viewportMap[areaId];

        if (!baseViewport || !resizePreview) {
            return baseViewport;
        }

        let parentRow: AreaRowLayout | undefined;
        let areaIndexInRow: number = -1;
        // Filter/find on the layout object (already for the active screen)
        parentRow = Object.values(layout)
            .filter((item): item is AreaRowLayout => item.type === 'area_row')
            .find(row => {
                const index = row.areas.findIndex(a => a.id === areaId);
                if (index !== -1) { areaIndexInRow = index; return true; }
                return false;
            });

        if (!parentRow || parentRow.id !== resizePreview.rowId) {
            return baseViewport;
        }

        const sepIndex = resizePreview.separatorIndex;

        if (areaIndexInRow === sepIndex - 1 || areaIndexInRow === sepIndex) {
            const siblingIndex = areaIndexInRow === sepIndex - 1 ? sepIndex : sepIndex - 1;
            const siblingId = parentRow.areas[siblingIndex]?.id;
            if (!siblingId) return baseViewport;
            // siblingViewport must also be fetched from the current viewportMap
            const siblingViewport = viewportMap[siblingId];
            if (!siblingViewport) return baseViewport;
            const isFirst = areaIndexInRow === sepIndex - 1;
            const t = resizePreview.t;
            // Parent viewport also from current map
            const parentViewport = viewportMap[parentRow.id];
            if (!parentViewport) return baseViewport;

            const vp0 = isFirst ? baseViewport : siblingViewport;
            const vp1 = isFirst ? siblingViewport : baseViewport;

            const sharedRect: Rect = {
                left: vp0.left,
                top: vp0.top,
                width: vp0.width + vp1.width,
                height: vp0.height + vp1.height
            };

            if (parentRow.orientation === 'horizontal') {
                const totalPixelWidth = sharedRect.width;
                const newPixelWidth0 = Math.max(0, Math.floor(totalPixelWidth * t));
                const newPixelWidth1 = Math.max(0, totalPixelWidth - newPixelWidth0);

                const newWidth = isFirst ? newPixelWidth0 : newPixelWidth1;
                const newLeft = isFirst ? sharedRect.left : sharedRect.left + newPixelWidth0;

                if (isNaN(newWidth) || isNaN(newLeft)) {
                    console.warn(`[VisViewport] ${areaId}: NaN detected in horizontal calc.`);
                    return baseViewport;
                }
                return { ...baseViewport, width: newWidth, left: newLeft };

            } else { // Vertical
                const totalPixelHeight = sharedRect.height;
                const newPixelHeight0 = Math.max(0, Math.floor(totalPixelHeight * t));
                const newPixelHeight1 = Math.max(0, totalPixelHeight - newPixelHeight0);

                const newHeight = isFirst ? newPixelHeight0 : newPixelHeight1;
                const newTop = isFirst ? sharedRect.top : sharedRect.top + newPixelHeight0;

                if (isNaN(newHeight) || isNaN(newTop)) {
                    console.warn(`[VisViewport] ${areaId}: NaN detected in vertical calc.`);
                    return baseViewport;
                }
                return { ...baseViewport, height: newHeight, top: newTop };
            }
        }
        return baseViewport;
    }, [layout, viewportMap, resizePreview]);

    if (loadingStateIsLoading) {
        return <LoadingIndicator />;
    }

    // Use the layout directly, already defaults to {} if undefined
    const currentRootItem = rootId ? layout[rootId] : null;

    if (!rootId || !currentRootItem) {
        return <EmptyAreaMessage />;
    }

    return (
        <div className={s('root')}>
            {/* Iterate over the active screen's layout */}
            {Object.values(layout).map((item) => {
                if (item.type === 'area_row') {
                    const rowLayout = item as AreaRowLayout;
                    const areChildrenReady = rowLayout.areas.every(area => viewportMap[area.id]);
                    if (areChildrenReady) {
                        return (
                            <AreaRowSeparators
                                key={item.id}
                                areaToViewport={viewportMap}
                                row={rowLayout}
                                setResizePreview={setResizePreview}
                            />
                        );
                    }
                }
                return null;
            })}

            {/* Render Areas using the active screen's layout */}
            {Object.entries(layout).map(([id, item]) => {
                const visualViewport = getAreaVisualViewport(id);
                // Only render if it's an area AND has a calculated viewport
                if (item.type === 'area' && visualViewport) {
                    return (
                        <Area
                            key={id}
                            id={id}
                            viewport={visualViewport}
                            setResizePreview={setResizePreview} // Pass down setResizePreview
                        />
                    );
                }
                return null;
            })}

            {/* Join Preview and AreaToOpen Preview use data from active screen state */}
            {joinPreview && joinPreview.areaId && viewportMap[joinPreview.areaId] && (
                <JoinAreaPreview
                    viewport={viewportMap[joinPreview.areaId]}
                    movingInDirection={joinPreview.movingInDirection!}
                />
            )}
            {areaToOpen && (
                <AreaToOpenPreview
                    areaToViewport={viewportMap}
                />
            )}
        </div>
    );
};

export default AreaRoot; 
