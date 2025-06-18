import React, { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useKarmycStore } from "../core/store";
import { AreaRowLayout } from "../types/areaTypes";
import { computeAreaToViewport } from "../utils/areaToViewport";
import { getAreaRootViewport } from "../utils/getAreaViewport";
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";
import { DetachedWindowCleanup } from "./DetachedWindowCleanup";
import { areViewportMapsEqual } from "../utils/objectEquality";

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

export const Karmyc: React.FC<{ offset?: number }> = ({ offset = 0 }) => {
    // Selectors for active screen state
    const activeScreenAreas = useKarmycStore(selectActiveScreenAreas);
    const isDetached = useKarmycStore(state => state.screens[state.activeScreenId]?.isDetached);

    // Ajout d'un flag d'hydratation Zustand
    const [hydrated, setHydrated] = useState(false);
    const layout = useMemo(() => activeScreenAreas?.layout ?? {}, [activeScreenAreas?.layout]);

    // Memoize the derived state to avoid unnecessary re-renders
    const rootId = useMemo(() => activeScreenAreas?.rootId, [activeScreenAreas?.rootId]);
    const joinPreview = useMemo(() => activeScreenAreas?.joinPreview, [activeScreenAreas?.joinPreview]);
    const areaToOpen = useMemo(() => activeScreenAreas?.areaToOpen, [activeScreenAreas?.areaToOpen]);

    // Utiliser useRef pour stocker le dernier viewport calculé
    const lastViewportRef = useRef<Rect | null>(null);
    const [viewport, setViewport] = useState(() => {
        if (isDetached && typeof window !== 'undefined') {
            return {
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }
        // Valeurs par défaut côté serveur
        if (typeof window === 'undefined') {
            return { left: 0, top: 0, width: 800, height: 600 };
        } else {
            return getAreaRootViewport();
        }
    });
    const [resizePreview, setResizePreview] = useState<ResizePreviewState | null>(null);

    const setViewports = useKarmycStore(state => state.setViewports);

    // Effect pour initialiser le viewport après le montage
    useEffect(() => {
        if (!isDetached) {
            const areaRoot = document.querySelector('.area-root');
            if (areaRoot) {
                const rect = areaRoot.getBoundingClientRect();
                setViewport({
                    left: 0,
                    top: 0,
                    width: rect.width,
                    height: rect.height
                });
            }
        }
    }, [isDetached]);

    // Ne mettre à jour le viewport que si nécessaire
    useEffect(() => {
        const handleResize = () => {
            if (isDetached) {
                const newViewport = {
                    left: 0,
                    top: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                };
                if (!lastViewportRef.current ||
                    newViewport.width !== lastViewportRef.current.width ||
                    newViewport.height !== lastViewportRef.current.height) {
                    setViewport(newViewport);
                }
            } else {
                const areaRoot = document.querySelector('.area-root');
                if (areaRoot) {
                    const rect = areaRoot.getBoundingClientRect();
                    const newViewport = {
                        left: 0,
                        top: 0,
                        width: rect.width,
                        height: rect.height
                    };
                    if (!lastViewportRef.current ||
                        newViewport.width !== lastViewportRef.current.width ||
                        newViewport.height !== lastViewportRef.current.height) {
                        setViewport(newViewport);
                    }
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isDetached]);

    // Effect for viewport calculation and direct store update
    useEffect(() => {
        const layoutSize = Object.keys(layout).length;
        const currentRootItem = rootId ? layout[rootId] : null;

        if (!rootId || !currentRootItem || layoutSize === 0) {
            if (lastViewportRef.current !== null) {
                lastViewportRef.current = null;
                setViewports({});
            }
            return;
        }

        // Vérifier que le viewport a des dimensions valides
        if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
            return;
        }

        try {
            const newViewportMap = computeAreaToViewport(layout, rootId, { ...viewport, top: viewport.top + offset });
            const currentStoreViewports = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.areas.viewports;

            // Ne mettre à jour que si les viewports ont réellement changé
            if (!areViewportMapsEqual(currentStoreViewports, newViewportMap)) {
                // Vérifier si le changement est significatif
                const hasSignificantChange = Object.keys(newViewportMap).some(key => {
                    const oldViewport = currentStoreViewports?.[key];
                    const newViewport = newViewportMap[key];
                    if (!oldViewport) return true;

                    return Math.abs(oldViewport.left - newViewport.left) > 1 ||
                        Math.abs(oldViewport.top - newViewport.top) > 1 ||
                        Math.abs(oldViewport.width - newViewport.width) > 1 ||
                        Math.abs(oldViewport.height - newViewport.height) > 1;
                });

                if (hasSignificantChange) {
                    lastViewportRef.current = viewport;
                    setViewports(newViewportMap);
                }
            }
        } catch (error) {
            console.error("[Karmyc] Erreur lors du calcul du viewportMap:", error);
        }
    }, [layout, rootId, viewport, resizePreview, setViewports]);

    const getAreaVisualViewport = useCallback((areaId: string): Rect | undefined => {
        const state = useKarmycStore.getState();
        const activeScreen = state.screens[state.activeScreenId];
        const currentGlobalViewportMap = activeScreen?.areas.viewports || {};

        const baseViewport = currentGlobalViewportMap[areaId];

        // Si l'écran est détaché, retourner le viewport de base avec les dimensions de la fenêtre
        if (activeScreen?.isDetached) {
            return {
                ...baseViewport,
                left: 0,
                top: 0,
                width: window.innerWidth,
                height: window.innerHeight
            };
        }

        // Si pas de resizePreview, retourner le viewport de base
        if (!resizePreview) {
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

    useEffect(() => { setHydrated(true); }, []);
    if (!hydrated) {
        return null;
    }

    return (
        <>
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
                                    offset={offset}
                                    key={item.id}
                                    row={rowLayout}
                                    setResizePreview={setResizePreview}
                                />
                            );
                        }
                    }
                    return null;
                })}

                {Object.entries(layout).map(([id]) => {
                    const visualViewport = getAreaVisualViewport(id);
                    if (visualViewport) {
                        return (
                            <Area
                                key={id}
                                id={id}
                                viewport={{ ...visualViewport, top: visualViewport.top - offset }}
                                setResizePreview={setResizePreview}
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
        </>
    );
};
