import React, { Dispatch, SetStateAction } from 'react';
import { capToRange, interpolate, Vec2 } from "../../utils";
import { AREA_MIN_CONTENT_WIDTH } from "../../utils/constants";
import { useKarmycStore } from "../../core/store";
import { AreaRowLayout } from "../../types/areaTypes";
import type { Rect } from "../../types";
import { computeAreaRowToMinSize } from "../../utils/areaRowToMinSize";
import { computeAreaToViewport } from "../../utils/areaToViewport";
import { getAreaRootViewport } from "../../utils/getAreaViewport";
import { blockPointerEvents, restorePointerEvents } from "../../utils/pointerEvents";

interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

function simpleDragHandler(
    onDrag: (e: MouseEvent) => void,
    onDragEnd: () => void
) {
    // Disable text selection during drag
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
        onDrag(e);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Re-enable text selection at the end of drag
        document.body.style.userSelect = '';
        // Restaurer les événements de pointeur
        restorePointerEvents();
        onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

export const handleDragAreaResize = (
    row: AreaRowLayout,
    horizontal: boolean,
    areaIndex: number, // 1 is the first separator
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>
) => {
    // Check if we are in a detached window
    const isDetached = useKarmycStore.getState().screens[useKarmycStore.getState().activeScreenId]?.isDetached;
    if (isDetached) {
        return;
    }

    // Bloquer les événements de pointeur pour éviter les événements parasites
    blockPointerEvents();

    // Input validation
    if (!row || !row.areas || row.areas.length === 0) {
        console.error("Invalid row data for resize");
        restorePointerEvents();
        return;
    }

    if (areaIndex < 1 || areaIndex >= row.areas.length) {
        console.error("Invalid areaIndex for resize:", { areaIndex, areasLength: row.areas.length });
        restorePointerEvents();
        return;
    }

    // --- Get active screen state at the beginning ---
    const initialRootState = useKarmycStore.getState();
    const initialActiveScreenId = initialRootState.activeScreenId;
    const initialActiveScreenAreas = initialRootState.screens[initialActiveScreenId]?.areas;

    if (!initialActiveScreenAreas || !initialActiveScreenAreas.layout || !initialActiveScreenAreas.rootId) {
        console.error("Invalid active screen area state for resize:", initialActiveScreenAreas);
        restorePointerEvents();
        return;
    }
    // Use these specific states for the rest
    const activeLayout = initialActiveScreenAreas.layout;
    const activeRootId = initialActiveScreenAreas.rootId;
    // --- End active state retrieval ---

    // Initial calculations based on active screen state
    const rowToMinSize = computeAreaRowToMinSize(activeRootId, activeLayout);
    const rootViewport = getAreaRootViewport();
    if (!rootViewport) {
        console.error("Unable to get root viewport");
        restorePointerEvents();
        return;
    }
    const initialAreaToViewport = computeAreaToViewport(
        activeLayout,
        activeRootId,
        rootViewport,
    );

    const a0 = row.areas[areaIndex - 1];
    const a1 = row.areas[areaIndex];
    if (!a0 || !a1) {
        console.error('Invalid area indices:', { areaIndex, areas: row.areas });
        restorePointerEvents();
        return;
    }

    let v0 = initialAreaToViewport[a0.id];
    let v1 = initialAreaToViewport[a1.id];
    if (!v0 || !v1) {
        console.error('Missing initial viewports:', { a0: a0.id, a1: a1.id, viewports: initialAreaToViewport });
        // Maybe attempt a recalculation here if needed, or just return
        restorePointerEvents();
        return;
    }

    const getMinSize = (id: string) => {
        const layoutItem = activeLayout[id];
        if (!layoutItem) return 1;
        if (layoutItem.type === "area") return 1;
        const minSize = rowToMinSize[layoutItem.id];
        return horizontal ? (minSize?.width ?? 1) : (minSize?.height ?? 1);
    };

    const m0 = getMinSize(a0.id);
    const m1 = getMinSize(a1.id);
    let sizeToShare = a0.size + a1.size;
    if (isNaN(sizeToShare) || sizeToShare <= 0) {
        sizeToShare = 1.0; // Default correction
    }

    const sharedViewport: Rect = {
        width: horizontal ? v0.width + v1.width : v0.width,
        height: !horizontal ? v0.height + v1.height : v0.height,
        left: v0.left,
        top: v0.top,
    };

    const viewportSize = horizontal ? sharedViewport.width : sharedViewport.height;
    if (viewportSize <= 0) {
        console.error("Invalid viewport size:", viewportSize);
        restorePointerEvents();
        return;
    }

    const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
    const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;
    if (tMin0 + tMin1 >= 0.99) {
        console.warn('Not enough space to resize:', { tMin0, tMin1 });
        restorePointerEvents();
        return;
    }

    // Variables pour le debounce du store global
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let lastUpdateTime = 0;
    const minUpdateInterval = 32; // ~30fps pour le store global (moins agressif)
    let animationFrameId: number | null = null;
    let lastMousePosition: Vec2 | null = null;
    let lastT: number = 0.5; // Stockage de la dernière valeur t

    // Fonction pour mettre à jour le store global (debounced)
    const performGlobalUpdate = (sizes: number[]) => {
        const now = performance.now();
        if (now - lastUpdateTime < minUpdateInterval) {
            return;
        }
        lastUpdateTime = now;
        useKarmycStore.getState().setRowSizes({ rowId: row.id, sizes });
    };

    // Fonction pour la mise à jour finale (synchrone)
    const performFinalUpdate = (sizes: number[]) => {
        useKarmycStore.getState().setRowSizesFinal({ rowId: row.id, sizes });
    };

    // Fonction principale de mise à jour - PRIORITÉ À LA PREVIEW LOCALE
    const updateFromMousePosition = (vec: Vec2) => {
        // Calcul de la position relative dans le viewport partagé
        const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
        const t1 = horizontal
            ? sharedViewport.left + sharedViewport.width
            : sharedViewport.top + sharedViewport.height;
        const val = horizontal ? vec.x : vec.y;
        const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

        // Stockage de la dernière valeur t
        lastT = t;

        // 1. MISE À JOUR IMMÉDIATE DE LA PREVIEW LOCALE (priorité absolue)
        setResizePreview({
            rowId: row.id,
            separatorIndex: areaIndex,
            t: t
        });

        // 2. Calcul des tailles pour le store global
        const tempFinalSizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));
        if (!tempFinalSizes.some(s => isNaN(s) || s < 0)) {
            const latestFinalPercentages = row.areas.map((_, i) => {
                if (i === areaIndex - 1) return tempFinalSizes[0];
                if (i === areaIndex) return tempFinalSizes[1];
                const initialRowState = activeLayout[row.id] as AreaRowLayout | undefined;
                return initialRowState?.areas?.[i]?.size || 0;
            });
            const sum = latestFinalPercentages.reduce((a, b) => a + b, 0);
            if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
                const normalizedPercentages = latestFinalPercentages.map(s => s / sum);
                // 3. MISE À JOUR DU STORE GLOBAL (debounced)
                performGlobalUpdate(normalizedPercentages);
            } else {
                performGlobalUpdate(latestFinalPercentages);
            }
        }
    };

    // Animation frame pour la fluidité (seulement pour le store global)
    const animate = () => {
        // La preview est déjà mise à jour immédiatement
        // Cette animation sert seulement pour le store global
        animationFrameId = requestAnimationFrame(animate);
    };

    // Déclenchement de l'animation avec debounce pour le store
    const triggerDebouncedUpdate = (vec: Vec2) => {
        lastMousePosition = vec;
        // Mise à jour immédiate de la preview (pas de délai)
        updateFromMousePosition(vec);
        if (!animationFrameId) {
            animationFrameId = requestAnimationFrame(animate);
        }
    };

    // Annulation des mises à jour
    const cancelDebouncedUpdate = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        lastMousePosition = null;
    };

    simpleDragHandler(
        // onDrag (mousemove) - PRIORITÉ À LA PREVIEW
        (e) => {
            const vec = Vec2.fromEvent(e);
            triggerDebouncedUpdate(vec);
        },
        // onDragEnd (mouseup) - MISE À JOUR FINALE SYNCHRONE
        () => {
            cancelDebouncedUpdate();
            
            // Calcul final basé sur la dernière position
            if (lastMousePosition) {
                const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
                const t1 = horizontal
                    ? sharedViewport.left + sharedViewport.width
                    : sharedViewport.top + sharedViewport.height;
                const val = horizontal ? lastMousePosition.x : lastMousePosition.y;
                const finalT = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));
                
                const finalSizes = [finalT, 1 - finalT].map((v) => interpolate(0, sizeToShare, v));
                if (!finalSizes.some(s => isNaN(s) || s < 0)) {
                    const latestFinalPercentages = row.areas.map((_, i) => {
                        if (i === areaIndex - 1) return finalSizes[0];
                        if (i === areaIndex) return finalSizes[1];
                        const initialRowState = activeLayout[row.id] as AreaRowLayout | undefined;
                        return initialRowState?.areas?.[i]?.size || 0;
                    });
                    const sum = latestFinalPercentages.reduce((a, b) => a + b, 0);
                    if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
                        const normalizedPercentages = latestFinalPercentages.map(s => s / sum);
                        performFinalUpdate(normalizedPercentages);
                    } else {
                        performFinalUpdate(latestFinalPercentages);
                    }
                }
            }
            
            // Nettoyage de la preview après un délai
            setTimeout(() => setResizePreview(null), 0);
        }
    );
};
