import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useKarmycStore } from "../stores/areaStore";
import AreaRootStyles from "../styles/AreaRoot.styles";
import { AreaRowLayout } from "../types/areaTypes";
import { computeAreaToViewport } from "../utils/areaToViewport";
import { getAreaRootViewport } from "../utils/getAreaViewport";
import { compileStylesheetLabelled } from "../utils/stylesheets";
import { EmptyAreaMessage } from './EmptyAreaMessage';
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";
import { ContextMenuProvider } from "../providers/ContextMenuProvider";
import { DetachedWindowCleanup } from './DetachedWindowCleanup';

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

export const AreaRoot: React.FC = () => {
    // Selectors for active screen state
    const activeScreenAreas = useKarmycStore(selectActiveScreenAreas);

    // Memoize the derived state to avoid unnecessary re-renders
    const rootId = useMemo(() => activeScreenAreas?.rootId, [activeScreenAreas]);
    const layout = useMemo(() => activeScreenAreas?.layout ?? {}, [activeScreenAreas]);
    const joinPreview = useMemo(() => activeScreenAreas?.joinPreview, [activeScreenAreas]);
    const areaToOpen = useMemo(() => activeScreenAreas?.areaToOpen, [activeScreenAreas]);

    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);

    const setViewports = useKarmycStore(state => state.setViewports);

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
        console.log('[AreaRoot] layout:', layout);
        console.log('[AreaRoot] rootId:', rootId);
        console.log('[AreaRoot] viewport:', viewport);
        const layoutSize = Object.keys(layout).length;
        const currentRootItem = rootId ? layout[rootId] : null;

        if (resizePreview) {
            return;
        }

        if (!rootId || !currentRootItem || layoutSize === 0) {
            if (Object.keys(viewportMap).length > 0) setViewportMap({});
            return;
        }

        try {
            const newViewportMap = computeAreaToViewport(layout, rootId, viewport);

            if (JSON.stringify(viewportMap) !== JSON.stringify(newViewportMap)) {
                setViewportMap(newViewportMap);
            }

        } catch (error) {
            console.error("[AreaRoot] Erreur lors du calcul du viewportMap:", error);
            setViewportMap({});
        }
    }, [layout, rootId, viewport, resizePreview]);

    useEffect(() => {
        console.log('[AreaRoot] viewportMap:', viewportMap);
        setViewports(viewportMap);
    }, [viewportMap, setViewports]);

    const getAreaVisualViewport = useCallback((areaId: string): Rect | undefined => {
        const baseViewport = viewportMap[areaId];

        if (!baseViewport || !resizePreview) {
            return baseViewport;
        }

        let parentRow: AreaRowLayout | undefined;
        let areaIndexInRow: number = -1;
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
            const siblingViewport = viewportMap[siblingId];
            if (!siblingViewport) return baseViewport;
            const isFirst = areaIndexInRow === sepIndex - 1;
            const t = resizePreview.t;
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

            } else if (parentRow.orientation === 'vertical') {
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
            } else if (parentRow.orientation === 'stack') {
                // Pour un stack, chaque tab occupe tout l'espace (hors barre d'onglets)
                return baseViewport;
            }
        }
        return baseViewport;
    }, [layout, viewportMap, resizePreview]);

    const currentRootItem = rootId ? layout[rootId] : null;

    useEffect(() => {
        const onDrop = (e: DragEvent) => { console.log('[BODY] NATIVE DROP', e); e};
        const onDragEnd = (e: DragEvent) => { console.log('[BODY] NATIVE DRAGEND', e); };
        document.body.addEventListener('drop', onDrop);
        document.body.addEventListener('dragend', onDragEnd);
        return () => {
            document.body.removeEventListener('drop', onDrop);
            document.body.removeEventListener('dragend', onDragEnd);
        };
    }, []);

    if (!rootId || !currentRootItem) {
        return <EmptyAreaMessage />;
    }

    return (
        <ContextMenuProvider>
            <DetachedWindowCleanup />
            <div className={"area-root " + s('root')}>
                {Object.values(layout).map((item) => {
                    if (item.type === 'area_row') {
                        const rowLayout = item as AreaRowLayout;
                        const areChildrenReady = rowLayout.areas.every(area => viewportMap[area.id]);
                        if (areChildrenReady) {
                            return (
                                <AreaRowSeparators
                                    key={item.id}
                                    row={rowLayout}
                                    setResizePreview={setResizePreview}
                                />
                            );
                        }
                    }
                    return null;
                })}

                {Object.entries(layout).map(([id, item]) => {
                    const visualViewport = getAreaVisualViewport(id);
                    if (visualViewport) {
                        return (
                            <Area
                                key={id}
                                id={id}
                                viewport={visualViewport}
                                setResizePreview={setResizePreview}
                            />
                        );
                    }
                    return null;
                })}

                {joinPreview && joinPreview.areaId && viewportMap[joinPreview.areaId] && (
                    <JoinAreaPreview
                        viewport={viewportMap[joinPreview.areaId]}
                        movingInDirection={joinPreview.movingInDirection!}
                    />
                )}
                {areaToOpen && (
                    <AreaToOpenPreview />
                )}
            </div>
        </ContextMenuProvider>
    );
};
