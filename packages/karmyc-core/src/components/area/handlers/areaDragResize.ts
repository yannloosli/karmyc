import { capToRange, interpolate, Vec2 } from "@gamesberry/karmyc-shared";
import { Dispatch, SetStateAction } from 'react';
import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { useAreaStore } from "../../../stores/areaStore";
import { AreaRowLayout } from "../../../types/areaTypes";
import type { Rect } from "../../../types/geometry";
import { computeAreaRowToMinSize } from "../../../utils/areaRowToMinSize";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";

interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

// --- Simple Debounce Implementation ---
function debounce<T extends (...args: any[]) => any>(
    func: T,
    waitFor: number
): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    return (...args: Parameters<T>): void => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null; // Clear timeoutId *before* calling func
            func(...args);
        }, waitFor);
    };
}
// --- Fin Debounce ---

function simpleDragHandler(
    onDrag: (e: MouseEvent) => void,
    onDragEnd: () => void
) {
    // Désactiver la sélection de texte pendant le drag
    document.body.style.userSelect = 'none';
    const handleMouseMove = (e: MouseEvent) => {
        onDrag(e);
    };

    const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        // Réactiver la sélection de texte à la fin du drag
        document.body.style.userSelect = '';
        onDragEnd();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
}

export const handleDragAreaResize = (
    initialEvent: MouseEvent,
    row: AreaRowLayout,
    horizontal: boolean,
    areaIndex: number, // 1 is the first separator
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>
) => {
    // Input validation
    if (!row || !row.areas || row.areas.length === 0) {
        console.error("Invalid row provided for resize:", row);
        return;
    }

    if (areaIndex < 1 || areaIndex >= row.areas.length) {
        console.error("Invalid areaIndex for resize:", { areaIndex, areasLength: row.areas.length });
        return;
    }

    // --- Récupérer l'état de l'écran actif au début --- 
    const initialRootState = useAreaStore.getState();
    const initialActiveScreenId = initialRootState.activeScreenId;
    const initialActiveScreenAreas = initialRootState.screens[initialActiveScreenId]?.areas;

    if (!initialActiveScreenAreas || !initialActiveScreenAreas.layout || !initialActiveScreenAreas.rootId) {
        console.error("Invalid active screen area state for resize:", initialActiveScreenAreas);
        return;
    }
    // Utiliser ces états spécifiques pour la suite
    const activeLayout = initialActiveScreenAreas.layout;
    const activeRootId = initialActiveScreenAreas.rootId;
    // --- Fin récupération état actif ---

    // Calculs initiaux basés sur l'état de l'écran actif
    const rowToMinSize = computeAreaRowToMinSize(activeRootId, activeLayout);
    const rootViewport = getAreaRootViewport();
    if (!rootViewport) {
        console.error("Unable to get root viewport");
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
        return;
    }

    let v0 = initialAreaToViewport[a0.id];
    let v1 = initialAreaToViewport[a1.id];
    if (!v0 || !v1) {
        console.error('Missing initial viewports:', { a0: a0.id, a1: a1.id, viewports: initialAreaToViewport });
        // Peut-être tenter un recalcul ici si nécessaire, ou simplement retourner
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
        sizeToShare = 1.0; // Correction par défaut
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
        return;
    }

    const tMin0 = (AREA_MIN_CONTENT_WIDTH * m0) / viewportSize;
    const tMin1 = (AREA_MIN_CONTENT_WIDTH * m1) / viewportSize;
    if (tMin0 + tMin1 >= 0.99) {
        console.warn('Not enough space to resize:', { tMin0, tMin1 });
        return;
    }

    // Stocker la DERNIERE valeur de t et les derniers pourcentages
    let lastT = 0.5; // Initialiser
    let latestFinalPercentages: number[] | null = null;

    let lastVec = Vec2.fromEvent(initialEvent);

    // --- Gestion du Debounce sans Hooks ---
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const debounceDelay = 75; // ms

    const performGlobalUpdate = (sizes: number[]) => {
        console.log("[Debounced Update] Updating global state with sizes:", sizes);
        useAreaStore.getState().setRowSizes({ rowId: row.id, sizes });
    };

    const triggerDebouncedUpdate = (sizes: number[]) => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            timeoutId = null;
            performGlobalUpdate(sizes);
        }, debounceDelay);
    };

    const cancelDebouncedUpdate = () => {
        if (timeoutId !== null) {
            clearTimeout(timeoutId);
            timeoutId = null;
            console.log("[Debounced Update] Cancelled pending update.");
        }
    };
    // --- Fin Gestion Debounce ---

    simpleDragHandler(
        // onDrag (mousemove)
        (e) => {
            const vec = Vec2.fromEvent(e);
            if (Math.abs(vec.x - lastVec.x) < 1 && Math.abs(vec.y - lastVec.y) < 1) return;
            lastVec = vec;

            const t0 = horizontal ? sharedViewport.left : sharedViewport.top;
            const t1 = horizontal
                ? sharedViewport.left + sharedViewport.width
                : sharedViewport.top + sharedViewport.height;
            const val = horizontal ? vec.x : vec.y;
            const t = capToRange(tMin0, 1 - tMin1, (val - t0) / (t1 - t0));

            // Mettre à jour la prévisualisation locale IMMÉDIATEMENT
            setResizePreview({
                rowId: row.id,
                separatorIndex: areaIndex,
                t: t
            });

            // Stocker la dernière valeur de t
            lastT = t;

            // Calculer les pourcentages pour le debounce
            const tempFinalSizes = [t, 1 - t].map((v) => interpolate(0, sizeToShare, v));
            if (!tempFinalSizes.some(s => isNaN(s) || s < 0)) {
                latestFinalPercentages = row.areas.map((area, i) => {
                    if (i === areaIndex - 1) return tempFinalSizes[0];
                    if (i === areaIndex) return tempFinalSizes[1];
                    const initialRowState = activeLayout[row.id] as AreaRowLayout | undefined;
                    return initialRowState?.areas?.[i]?.size || 0;
                });
                const sum = latestFinalPercentages.reduce((a, b) => a + b, 0);
                if (sum > 0 && Math.abs(sum - 1.0) > 0.001) {
                    latestFinalPercentages = latestFinalPercentages.map(s => s / sum);
                }
                // Déclencher la mise à jour globale débouncée
                triggerDebouncedUpdate(latestFinalPercentages);
            } else {
                console.error("Invalid calculated sizes during move, skipping debounce trigger:", tempFinalSizes);
            }
        },
        // onDragEnd (mouseup)
        () => {
            console.log("Drag resize finished");
            cancelDebouncedUpdate();

            // 2. Calculer les pourcentages FINALS basés sur lastT
            const finalCalculatedSizes = [lastT, 1 - lastT].map((v) => interpolate(0, sizeToShare, v));
            if (finalCalculatedSizes.some(s => isNaN(s) || s < 0)) {
                console.error("Invalid final calculated sizes on mouseup:", finalCalculatedSizes);
                setTimeout(() => setResizePreview(null), 0);
                return;
            }
            let finalPercentages = row.areas.map((area, i) => {
                if (i === areaIndex - 1) return finalCalculatedSizes[0];
                if (i === areaIndex) return finalCalculatedSizes[1];
                const initialRowState = activeLayout[row.id] as AreaRowLayout | undefined;
                return initialRowState?.areas?.[i]?.size || 0;
            });
            const finalSum = finalPercentages.reduce((a, b) => a + b, 0);
            if (finalSum > 0 && Math.abs(finalSum - 1.0) > 0.001) {
                finalPercentages = finalPercentages.map(s => s / finalSum);
            }

            // 3. Mettre à jour l'état global IMMÉDIATEMENT
            performGlobalUpdate(finalPercentages);

            // Nettoyer l'état de prévisualisation APRÈS un délai minimal
            setTimeout(() => setResizePreview(null), 0);
        }
    );
};
