import React, { useCallback, useEffect, useState } from "react";
import { useLoadingState } from "../../../hooks/useLoadingState";
import { useAreaStore } from "../../../stores/areaStore";
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

// Remove RootInfo interface if not needed
// interface RootInfo { ... }

const AreaRoot: React.FC = () => {
    const rootId = useAreaStore((state) => state.rootId);
    const layout = useAreaStore((state) => state.layout);
    const joinPreview = useAreaStore((state) => state.joinPreview);
    const areaToOpen = useAreaStore((state) => state.areaToOpen);
    // Supprimer la lecture depuis le store global
    // const resizePreview = useAreaStore((state) => state.resizePreview);

    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    // Réintroduire l'état local pour le preview
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
        const layoutSize = Object.keys(layout || {}).length;
        const currentRootItem = rootId ? layout?.[rootId] : null;

        // Ne pas calculer si resize en cours, le calcul se fera via getAreaVisualViewport
        if (resizePreview) {
            console.log("[AreaRoot ViewportEffect] Skipping calculation during resize preview.");
            return;
        }

        if (!rootId || !currentRootItem || layoutSize === 0) {
            console.log("[AreaRoot LOG] Conditions initiales non réunies pour calcul", { rootId, hasCurrentRootItem: !!currentRootItem, layoutSize });
            // S'assurer que viewportMap est vidé s'il n'y a plus rien à afficher
            if (Object.keys(viewportMap).length > 0) setViewportMap({});
            return;
        }

        console.log("[AreaRoot ViewportEffect] Calculating final viewport map (layout or viewport or resizePreview changed).", { hasLayout: !!layout, rootId, hasViewport: !!viewport, resizePreviewIsNull: resizePreview === null });
        // console.log("[AreaRoot LOG] Layout object passed to computeAreaToViewport:", JSON.stringify(layout, null, 2));
        // console.log(`[AreaRoot LOG] Calcul du viewportMap pour rootId: ${rootId}`);

        try {
            const newViewportMap = computeAreaToViewport(layout, rootId, viewport);
            // console.log("[AreaRoot LOG] Résultat de computeAreaToViewport:", newViewportMap);

            // Comparaison profonde pour éviter re-rendus inutiles si l'objet est structurellement identique
            if (JSON.stringify(viewportMap) !== JSON.stringify(newViewportMap)) {
                console.log("[AreaRoot ViewportEffect] Mise à jour de viewportMap.");
                setViewportMap(newViewportMap);
            } else {
                // console.log("[AreaRoot LOG] Skipping setViewportMap, résultat identique.");
            }

        } catch (error) {
            console.error("[AreaRoot] Erreur lors du calcul du viewportMap:", error);
            setViewportMap({});
        }
        // AJOUTER resizePreview aux dépendances
    }, [layout, rootId, viewport, resizePreview]);

    const getAreaVisualViewport = useCallback((areaId: string): Rect | undefined => {
        const baseViewport = viewportMap[areaId];
        // console.log(`[VisViewport] Checking ${areaId}. Preview active: ${!!resizePreview}`);

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
            // --- Retirer le DEBUG et remettre la logique de calcul corrigée ---
            // console.log(`[VisViewport] ${areaId}: DEBUG - Is adjacent, forcing return of base viewport.`);
            // return baseViewport;
            // --- Fin DEBUG ---

            // --- Logique de calcul originale (corrigée) ---
            const siblingIndex = areaIndexInRow === sepIndex - 1 ? sepIndex : sepIndex - 1;
            const siblingId = parentRow.areas[siblingIndex]?.id;
            if (!siblingId) return baseViewport;
            const siblingViewport = viewportMap[siblingId];
            if (!siblingViewport) return baseViewport;
            const isFirst = areaIndexInRow === sepIndex - 1;
            const t = resizePreview.t;
            const parentViewport = viewportMap[parentRow.id];
            if (!parentViewport) return baseViewport;

            // Viewport de la première et deuxième zone adjacente
            const vp0 = isFirst ? baseViewport : siblingViewport;
            const vp1 = isFirst ? siblingViewport : baseViewport;

            // Calculer le viewport partagé total
            const sharedRect: Rect = {
                left: vp0.left,
                top: vp0.top,
                width: vp0.width + vp1.width,
                height: vp0.height + vp1.height
            };

            if (parentRow.orientation === 'horizontal') {
                const totalPixelWidth = sharedRect.width;
                // Calculer la largeur en pixels de la 1ère zone basée sur t
                const newPixelWidth0 = Math.max(0, Math.floor(totalPixelWidth * t));
                // La 2ème zone prend le reste
                const newPixelWidth1 = Math.max(0, totalPixelWidth - newPixelWidth0);

                // Déterminer la largeur et le left pour la zone ACTUELLE (areaId)
                const newWidth = isFirst ? newPixelWidth0 : newPixelWidth1;
                const newLeft = isFirst ? sharedRect.left : sharedRect.left + newPixelWidth0;

                if (isNaN(newWidth) || isNaN(newLeft)) {
                    console.warn(`[VisViewport] ${areaId}: NaN detected in horizontal calc.`);
                    return baseViewport; // Retourner base si calcul invalide
                }
                // Retourner le nouveau viewport pour cette zone
                return { ...baseViewport, width: newWidth, left: newLeft };

            } else { // Cas vertical
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
            // --- Fin logique corrigée ---
        }
        return baseViewport;
    }, [layout, viewportMap, resizePreview]);

    if (loadingStateIsLoading) {
        console.log("[AreaRoot LOG] Affichage du LoadingIndicator");
        return <LoadingIndicator />;
    }

    const currentRootItem = rootId ? layout?.[rootId] : null;

    if (!rootId || !currentRootItem) {
        console.log("[AreaRoot LOG] Affichage EmptyAreaMessage car structure invalide/vide", { rootId, hasCurrentRootItem: !!currentRootItem });
        return <EmptyAreaMessage />;
    }

    console.log("[AreaRoot LOG] Rendu principal", { rootId, viewportMapKeys: Object.keys(viewportMap), resizePreview: !!resizePreview });

    return (
        <div className={s('root')}>
            {/* Iterate over ALL layout items to find rows and render their separators */}
            {Object.values(layout).map((item) => {
                if (item.type === 'area_row') {
                    const rowLayout = item as AreaRowLayout;
                    // Check if all children of THIS row have viewports
                    const areChildrenReady = rowLayout.areas.every(area => viewportMap[area.id]);
                    if (areChildrenReady) {
                        return (
                            <AreaRowSeparators
                                key={item.id} // Use row id as key
                                areaToViewport={viewportMap}
                                row={rowLayout}
                                setResizePreview={setResizePreview}
                            />
                        );
                    }
                }
                return null;
            })}

            {/* Render Areas (keep existing logic) */}
            {Object.entries(layout).map(([id, item]) => {
                const visualViewport = getAreaVisualViewport(id);
                if (item.type === 'area' && visualViewport) {
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
                <AreaToOpenPreview
                    areaToViewport={viewportMap}
                />
            )}
        </div>
    );
};

export default AreaRoot; 
