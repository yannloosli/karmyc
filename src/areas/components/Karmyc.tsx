import React, { useCallback, useEffect, useState, useMemo } from "react";
import { useKarmycStore } from "../../core/data/areaStore";
import { AreaRowLayout } from "../../core/types/areaTypes";
import { computeAreaToViewport } from "../../core/utils/areaToViewport";
import { getAreaRootViewport } from "../../core/utils/getAreaViewport";
import { EmptyAreaMessage } from './EmptyAreaMessage';
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";
import { ContextMenuProvider } from "../../core/providers/ContextMenuProvider";
import { DetachedWindowCleanup } from '../../core/ui/DetachedWindowCleanup';

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

export const Karmyc: React.FC = () => {
    // Selectors for active screen state
    const activeScreenAreas = useKarmycStore(selectActiveScreenAreas);

    // Memoize the derived state to avoid unnecessary re-renders
    const rootId = useMemo(() => activeScreenAreas?.rootId, [activeScreenAreas?.rootId]);
    const layout = useMemo(() => activeScreenAreas?.layout ?? {}, [activeScreenAreas?.layout]);
    const joinPreview = useMemo(() => activeScreenAreas?.joinPreview, [activeScreenAreas?.joinPreview]);
    const areaToOpen = useMemo(() => activeScreenAreas?.areaToOpen, [activeScreenAreas?.areaToOpen]);

    const [viewport, setViewport] = useState(getAreaRootViewport());
    const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);

    const setViewports = useKarmycStore(state => state.setViewports);
    const loggingEnabled = useKarmycStore(state => state.options?.enableLogging);

    // Effect for resize handling (no change)
    useEffect(() => {
        const handleResize = () => {
            setViewport(getAreaRootViewport());
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Effect for viewport calculation and direct store update
    useEffect(() => {
        const layoutSize = Object.keys(layout).length;
        const currentRootItem = rootId ? layout[rootId] : null;
        
        loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Start. layoutSize:', layoutSize, 'rootId:', rootId, 'currentRootItem exists:', !!currentRootItem, 'resizePreview:', resizePreview);

        /*
        if (resizePreview) {
            loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Bailing due to resizePreview');
            return;
        }
        */

        if (!rootId || !currentRootItem || layoutSize === 0) {
            loggingEnabled && console.warn('[Karmyc Calculation Effect (Direct to Store)] Condition to clear viewportMap met! rootId:', rootId, 'layoutSize:', layoutSize, 'currentRootItem:', currentRootItem);
            // Vider les viewports dans le store si le layout est vide/invalide
            const currentStoreViewports = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.viewports;
            if (currentStoreViewports && Object.keys(currentStoreViewports).length > 0) {
                loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Clearing viewports in store due to empty/invalid layout.');
                setViewports({});
            } else {
                loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Store viewports already empty or condition met without non-empty map.');
            }
            return;
        }

        try {
            const newViewportMap = computeAreaToViewport(layout, rootId, viewport);
            loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Computed newViewportMap:', JSON.parse(JSON.stringify(newViewportMap)));

            const currentStoreViewports = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.viewports;
            if (JSON.stringify(currentStoreViewports) !== JSON.stringify(newViewportMap)) {
                loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Store viewports are different, calling setViewports with new data.');
                setViewports(newViewportMap);
            } else {
                loggingEnabled && console.log('[Karmyc Calculation Effect (Direct to Store)] Store viewports are THE SAME as newViewportMap, not calling setViewports.');
            }

        } catch (error) {
            console.error("[Karmyc] Erreur lors du calcul du viewportMap (Direct to Store):", error);
            // Optionnel: vider le store en cas d'erreur de calcul critique
            // setViewports({}); 
        }
    }, [layout, rootId, viewport, resizePreview, setViewports, loggingEnabled]);

    const getAreaVisualViewport = useCallback((areaId: string): Rect | undefined => {
        const state = useKarmycStore.getState();
        const activeScreen = state.screens[state.activeScreenId];
        const currentGlobalViewportMap = activeScreen?.areas.viewports || {};
        
        const baseViewport = currentGlobalViewportMap[areaId];

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
            const siblingViewport = currentGlobalViewportMap[siblingId];
            if (!siblingViewport) return baseViewport;
            const isFirst = areaIndexInRow === sepIndex - 1;
            const t = resizePreview.t;
            const parentRowViewport = currentGlobalViewportMap[parentRow.id];
            if (!parentRowViewport) return baseViewport;

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
    }, [layout, resizePreview]);

    if (Object.keys(layout).length === 0 && activeScreenAreas?._id !== 0) {
        // Temporisation pour permettre au store de se mettre à jour après un reset/load
        // setTimeout(() => {
        //     const currentLayout = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.layout;
        //     if (Object.keys(currentLayout || {}).length === 0) {
        //         console.warn("[Karmyc] Layout is empty after potential update. Forcing reload as a fallback.");
        //         window.location.reload();
        //     }
        // }, 500);
    }

    return (
        <ContextMenuProvider>
            <DetachedWindowCleanup />
            <div className="area-root">
                {Object.values(layout).map((item) => {
                    if (item.type === 'area_row') {
                        const rowLayout = item as AreaRowLayout;
                        const currentGlobalViewportMap = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.viewports || {};
                        const areChildrenReady = rowLayout.areas.every(area => currentGlobalViewportMap[area.id]);
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
                    const type = item.type;
                    console.log('type', type);

                    if (visualViewport) {
                        return (
                            <Area
                                key={id}
                                id={id}
                                viewport={visualViewport}
                                setResizePreview={setResizePreview}
                                isLeaf={type !== 'area_row'}
                            />
                        );
                    }
                    return null;
                })}

                {joinPreview && joinPreview.areaId && 
                    (() => {
                        const currentGlobalViewportMap = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.viewports || {};
                        const joinViewport = currentGlobalViewportMap[joinPreview.areaId!];
                        return joinViewport ? (
                            <JoinAreaPreview
                                viewport={joinViewport}
                                movingInDirection={joinPreview.movingInDirection!}
                            />
                        ) : null;
                    })()
                }
                {areaToOpen && (
                    <AreaToOpenPreview />
                )}
            </div>
        </ContextMenuProvider>
    );
};
