import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { areaSlice, AreaState } from "../../../store/slices/areaSlice";
import { AreaRowLayout } from "../../../types/areaTypes";
import { CardinalDirection, IntercardinalDirection } from "../../../types/directions";
import type { Rect } from "../../../types/geometry";
import type { RequestActionParams } from "../../../types/requestAction";
import { computeAreaToParentRow } from "../../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { capToRange } from "../../../utils/math";
import { Vec2 } from "../../../utils/math/vec2";
import { requestAction } from "../../../utils/requestAction";
import { getActionState } from "../../../utils/stateUtils";

const { actions: areaActions } = areaSlice;

const directionVectors = {
    n: { x: 0, y: 1 },
    s: { x: 0, y: -1 },
    w: { x: 1, y: 0 },
    e: { x: -1, y: 0 },
};

const oppositeDirectionVectors = {
    n: { x: 0, y: -1 },
    s: { x: 0, y: 1 },
    w: { x: -1, y: 0 },
    e: { x: 1, y: 0 },
};

const cornerDirections: Record<IntercardinalDirection, [CardinalDirection, CardinalDirection]> = {
    ne: ["n", "e"],
    nw: ["n", "w"],
    se: ["s", "e"],
    sw: ["s", "w"],
};

const getEligibleAreaIndices = (state: AreaState, row: AreaRowLayout, areaIndex: number): number[] => {
    const eligibleAreaIndices: number[] = [];
    for (let i = 0; i < row.areas.length; i++) {
        if (i !== areaIndex) {
            eligibleAreaIndices.push(i);
        }
    }
    return eligibleAreaIndices;
};

const getArrowDirection = (
    row: AreaRowLayout,
    oldAreaIndex: number,
    newAreaIndex: number,
): CardinalDirection => {
    if (row.orientation === "horizontal") {
        return newAreaIndex > oldAreaIndex ? "e" : "w";
    }
    return newAreaIndex > oldAreaIndex ? "s" : "n";
};

const parseCorner = (corner: IntercardinalDirection): [CardinalDirection, CardinalDirection] => {
    return cornerDirections[corner];
};

const updateViewports = () => {
    const currentState = getActionState().area;
    const rootViewport = getAreaRootViewport();
    return computeAreaToViewport(
        currentState.layout,
        currentState.rootId,
        rootViewport
    );
};

export const handleAreaDragFromCorner = (
    e: MouseEvent,
    corner: IntercardinalDirection,
    areaId: string,
    viewport: Rect,
) => {
    const initialMousePosition = Vec2.fromEvent(e);
    let lastMousePosition: Vec2 = initialMousePosition;
    let currentHandlers: { onMove?: (vec: Vec2) => void; onMouseUp?: () => void } = {};
    let handlerSet = false;

    requestAction({}, (params: RequestActionParams) => {
        const state = getActionState().area as AreaState;
        const areaToRow = computeAreaToParentRow(state);
        const areaToViewport = computeAreaToViewport(
            state.layout,
            state.rootId,
            getAreaRootViewport(),
        );

        // Row does not exist if the area we are operating on is the root area
        const row = state.layout[areaToRow[areaId]] as AreaRowLayout | null;

        const directionParts = parseCorner(corner);

        function createNewArea(horizontal: boolean) {
            if ((horizontal ? viewport.width : viewport.height) < AREA_MIN_CONTENT_WIDTH * 2) {
                const handlers = joinAreas();
                currentHandlers = handlers;
                if (handlers.onMove) {
                    handlers.onMove(lastMousePosition);
                }
                handlerSet = true;
                return;
            }

            params.performDiff((diff) => {
                // Récupérer l'état actuel
                const currentState = getActionState().area;
                const parentRowId = areaToRow[areaId];
                const parentRow = parentRowId ? currentState.layout[parentRowId] as AreaRowLayout : null;

                // Identifier quelle sera la ligne parente finale et son id
                let finalRowId: string;
                let existingRow = false;

                // Si on a un parent row et que l'orientation est la même
                if (parentRow && ((parentRow.orientation === 'horizontal') === horizontal)) {
                    finalRowId = parentRowId;
                    existingRow = true;
                    // Récupérer la taille actuelle de la zone avant de la diviser
                    const currentArea = parentRow.areas.find(a => a.id === areaId);
                    const currentSize = currentArea ? currentArea.size : 0;

                    // Ajouter une nouvelle zone au parent existant
                    params.dispatch(areaActions.addAreaToRow({
                        rowId: parentRowId,
                        afterAreaId: areaId
                    }));

                    // Récupérer l'état mis à jour
                    const updatedState = getActionState().area;
                    const updatedRow = updatedState.layout[parentRowId] as AreaRowLayout;
                    const areaIndex = updatedRow.areas.findIndex(a => a.id === areaId);
                    const newAreaId = updatedRow.areas[areaIndex + 1].id;

                    // Calculer les nouvelles tailles en préservant les tailles des autres zones
                    const newSizes = updatedRow.areas.map((area, index) => {
                        if (index === areaIndex) {
                            // La zone d'origine prend la moitié de sa taille précédente
                            return currentSize / 2;
                        } else if (index === areaIndex + 1) {
                            // La nouvelle zone prend l'autre moitié
                            return currentSize / 2;
                        } else {
                            // Les autres zones gardent leur taille
                            return area.size;
                        }
                    });

                    // Mettre à jour les tailles
                    params.dispatch(areaActions.setRowSizes({
                        rowId: parentRowId,
                        sizes: newSizes
                    }));

                    // Mettre à jour les viewports
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));
                } else {
                    finalRowId = areaId;
                    existingRow = false;
                    // Créer une nouvelle ligne avec deux zones
                    params.dispatch(areaActions.convertAreaToRow({
                        areaId,
                        cornerParts: directionParts,
                        horizontal
                    }));

                    // Récupérer l'état mis à jour
                    const updatedState = getActionState().area;
                    const newRow = updatedState.layout[areaId] as AreaRowLayout;

                    // Initialiser les tailles des zones à 50/50
                    params.dispatch(areaActions.setRowSizes({
                        rowId: areaId,
                        sizes: [0.5, 0.5]
                    }));

                    // Mettre à jour les viewports
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));
                }

                // Forcer la mise à jour du layout
                diff.resizeAreas();

                // Configurer les handlers pour le redimensionnement
                const getT = (vec: Vec2): number => {
                    // Obtenir l'état actuel et la ligne concernée
                    const state = getActionState().area;
                    const rowId = existingRow ? parentRowId : areaId;
                    const row = state.layout[rowId] as AreaRowLayout;

                    // Déterminer l'orientation réelle
                    const isHorizontalRow = row.orientation === 'horizontal';

                    // Récupérer le viewport actuel
                    const areaToViewport = computeAreaToViewport(
                        state.layout,
                        state.rootId,
                        getAreaRootViewport()
                    );

                    // Si c'est une ligne existante, on utilise le viewport combiné des zones concernées
                    let effectiveViewport: Rect;
                    if (existingRow) {
                        const areaIndex = row.areas.findIndex(a => a.id === areaId);
                        if (areaIndex !== -1 && areaIndex + 1 < row.areas.length) {
                            const v0 = areaToViewport[row.areas[areaIndex].id];
                            const v1 = areaToViewport[row.areas[areaIndex + 1].id];

                            if (v0 && v1) {
                                effectiveViewport = isHorizontalRow
                                    ? {
                                        left: v0.left,
                                        top: v0.top,
                                        width: v0.width + v1.width,
                                        height: v0.height
                                    }
                                    : {
                                        left: v0.left,
                                        top: v0.top,
                                        width: v0.width,
                                        height: v0.height + v1.height
                                    };
                            } else {
                                effectiveViewport = viewport;
                            }
                        } else {
                            effectiveViewport = viewport;
                        }
                    } else {
                        effectiveViewport = viewport;
                    }

                    // Calculer t en fonction de l'orientation réelle et du viewport effectif
                    const viewportSize = isHorizontalRow ? effectiveViewport.width : effectiveViewport.height;
                    const minT = AREA_MIN_CONTENT_WIDTH / viewportSize;
                    const t0 = isHorizontalRow ? effectiveViewport.left : effectiveViewport.top;
                    const t1 = isHorizontalRow ? effectiveViewport.left + effectiveViewport.width : effectiveViewport.top + effectiveViewport.height;
                    const val = isHorizontalRow ? vec.x : vec.y;

                    return capToRange(minT, 1 - minT, (val - t0) / (t1 - t0));
                };

                const onMoveFn = (vec: Vec2) => {
                    // Obtenir l'état actuel
                    const state = getActionState().area;
                    const rowId = existingRow ? parentRowId : areaId;
                    const row = state.layout[rowId] as AreaRowLayout;
                    const areaIndex = existingRow
                        ? row.areas.findIndex(a => a.id === areaId)
                        : 0;

                    // Calculer t
                    const t = getT(vec);

                    // Mettre à jour les tailles
                    let newSizes: number[];
                    if (row.areas.length === 2) {
                        newSizes = [t, 1 - t];
                    } else if (existingRow) {
                        // Pour une ligne existante avec plus de deux zones
                        newSizes = row.areas.map((area, index) => {
                            if (index === areaIndex) {
                                return t;
                            } else if (index === areaIndex + 1) {
                                // La zone suivante
                                const originalSize = area.size + row.areas[areaIndex].size;
                                return Math.max(0, originalSize - t);
                            } else {
                                return area.size;
                            }
                        });
                    } else {
                        // Cas improbable mais géré par sécurité
                        newSizes = Array(row.areas.length).fill(1 / row.areas.length);
                    }

                    // Appliquer les nouvelles tailles
                    params.dispatch(areaActions.setRowSizes({
                        rowId,
                        sizes: newSizes
                    }));

                    // Forcer le recalcul complet
                    const viewports = updateViewports();
                    params.dispatch(areaActions.setViewports({ viewports }));

                    // Forcer la mise à jour immédiate
                    params.performDiff((diff) => {
                        diff.resizeAreas();
                    });
                };

                const onMouseUpFn = () => {
                    params.addDiff((diff) => {
                        diff.resizeAreas();
                    });
                    params.submitAction("Create or update area");
                };

                currentHandlers = {
                    onMove: onMoveFn,
                    onMouseUp: onMouseUpFn
                };
            });
        }

        function joinAreas() {
            if (!row) {
                console.error("Row invalide pour la fusion");
                throw new Error("Expected row to be valid.");
            }

            let areaIndex = row.areas.map((x) => x.id).indexOf(areaId);
            let eligibleAreaIndices = getEligibleAreaIndices(state, row, areaIndex);

            // Vérifier que les viewports sont disponibles pour toutes les zones éligibles
            const eligibleAreaIds = eligibleAreaIndices.map((i) => row.areas[i].id);

            for (const id of eligibleAreaIds) {
                if (!areaToViewport[id]) {
                    console.error('Viewport manquant pour la zone:', id);
                    params.cancelAction();
                    return { onMove: undefined, onMouseUp: undefined };
                }
            }

            const getEligibleAreaIds = (eligibleAreaIndices: number[]) =>
                eligibleAreaIndices.map((i) => row.areas[i].id);

            params.dispatch(
                areaActions.setJoinAreasPreview({
                    areaId: null,
                    direction: null,
                    eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                }),
            );

            const onMoveFn: ((mousePosition: Vec2) => void) | null = (vec) => {
                lastMousePosition = vec;

                let foundEligibleArea = false;
                for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
                    const eligibleAreaIndex = eligibleAreaIndices[i];
                    const eligibleAreaId = row.areas[eligibleAreaIndex].id;
                    const eligibleAreaViewport = areaToViewport[eligibleAreaId];

                    if (!eligibleAreaViewport) {
                        console.error('Viewport manquant pour la zone', eligibleAreaId);
                        continue;
                    }

                    // Convertir viewport en format attendu pour isVecInRect
                    const rect = {
                        left: eligibleAreaViewport.left,
                        top: eligibleAreaViewport.top,
                        right: eligibleAreaViewport.left + eligibleAreaViewport.width,
                        bottom: eligibleAreaViewport.top + eligibleAreaViewport.height
                    };

                    // Vérifier si le point est dans le rectangle
                    if (!(vec.x >= rect.left && vec.x <= rect.right &&
                        vec.y >= rect.top && vec.y <= rect.bottom)) {
                        continue;
                    }

                    foundEligibleArea = true;
                    const arrowDirection = getArrowDirection(row, areaIndex, eligibleAreaIndex);
                    const nextAreaId = row.areas[eligibleAreaIndices[i]].id;

                    // Mettre à jour la prévisualisation de fusion
                    params.dispatch(
                        areaActions.setJoinAreasPreview({
                            areaId: nextAreaId,
                            direction: arrowDirection,
                            eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                        }),
                    );
                    params.performDiff(() => { });
                    break;
                }

                // Si on n'est plus sur une zone éligible, réinitialiser la prévisualisation
                if (!foundEligibleArea) {
                    params.dispatch(
                        areaActions.setJoinAreasPreview({
                            areaId: null,
                            direction: null,
                            eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                        }),
                    );
                    params.performDiff(() => { });
                }
            };

            const onMouseUpFn: (() => void) | undefined = () => {
                // Déterminer si on est sur une zone éligible pour la fusion
                let targetAreaIndex = -1;
                let targetAreaId = null;

                for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
                    const eligibleAreaIndex = eligibleAreaIndices[i];
                    const eligibleAreaId = row.areas[eligibleAreaIndex].id;
                    const eligibleAreaViewport = areaToViewport[eligibleAreaId];

                    if (!eligibleAreaViewport) {
                        console.error('Viewport manquant pour la zone', eligibleAreaId);
                        continue;
                    }

                    // Convertir viewport en format attendu pour vérifier la position
                    const rect = {
                        left: eligibleAreaViewport.left,
                        top: eligibleAreaViewport.top,
                        right: eligibleAreaViewport.left + eligibleAreaViewport.width,
                        bottom: eligibleAreaViewport.top + eligibleAreaViewport.height
                    };

                    // Vérifier si le point est dans le rectangle
                    if (lastMousePosition.x >= rect.left &&
                        lastMousePosition.x <= rect.right &&
                        lastMousePosition.y >= rect.top &&
                        lastMousePosition.y <= rect.bottom) {
                        targetAreaIndex = eligibleAreaIndex;
                        targetAreaId = eligibleAreaId;
                        break;
                    }
                }

                // Si on n'est pas sur une zone éligible, annuler la fusion
                if (targetAreaIndex === -1) {
                    // Nettoyer les états temporaires avant d'annuler
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.cancelAction();
                    return;
                }

                try {
                    // Déterminer quelle zone est fusionnée avec quelle autre zone
                    const mergeArea = areaIndex;  // On utilise l'index de la zone qu'on déplace
                    const mergeInto = targetAreaIndex > areaIndex ? 1 : -1;

                    // Effectuer la fusion
                    params.dispatch(areaActions.joinAreas({
                        rowId: row.id,
                        mergeArea: mergeArea,
                        mergeInto: mergeInto
                    }));

                    // Nettoyer les états temporaires après la fusion
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.addDiff(() => { });
                    params.submitAction("Join areas");
                } catch (error) {
                    console.error('Error joining areas:', error);
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.cancelAction();
                }
            };

            return {
                onMove: onMoveFn,
                onMouseUp: onMouseUpFn
            };
        }

        const handleMouseMove = (e: MouseEvent) => {
            e.preventDefault();
            const mousePosition = Vec2.fromEvent(e);
            lastMousePosition = mousePosition;

            if (!handlerSet) {
                const moveVec = mousePosition.sub(initialMousePosition);
                const exceedsMinDistance = Math.abs(moveVec.x) > AREA_MIN_CONTENT_WIDTH / 2 ||
                    Math.abs(moveVec.y) > AREA_MIN_CONTENT_WIDTH / 2;

                if (!exceedsMinDistance) {
                    return;
                }

                // Si Alt est enfoncé, on fusionne
                if (e.altKey) {
                    const handlers = joinAreas();
                    currentHandlers = handlers;
                    if (handlers.onMove) {
                        handlers.onMove(mousePosition);
                    }
                } else {
                    // Sinon on crée une nouvelle zone
                    // Détermine l'orientation en fonction de la direction du déplacement
                    const horizontal = Math.abs(moveVec.x) > Math.abs(moveVec.y);
                    createNewArea(horizontal);
                }
                handlerSet = true;
                return;
            }

            if (currentHandlers.onMove) {
                currentHandlers.onMove(mousePosition);
            }
        };

        const handleMouseUp = (e: MouseEvent) => {
            e.preventDefault();
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);

            // Toujours nettoyer les états temporaires d'abord
            params.dispatch(areaActions.cleanupTemporaryStates());

            if (currentHandlers.onMouseUp) {
                currentHandlers.onMouseUp();
            } else {
                params.cancelAction();
            }
        };

        // S'assurer que les événements sont nettoyés même en cas d'erreur
        try {
            window.addEventListener("mousemove", handleMouseMove);
            window.addEventListener("mouseup", handleMouseUp);
        } catch (error) {
            console.error('Error setting up event listeners:', error);
            params.dispatch(areaActions.cleanupTemporaryStates());
            params.cancelAction();
        }
    });
}; 
