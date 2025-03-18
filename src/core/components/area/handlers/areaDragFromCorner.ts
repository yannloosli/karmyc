import { AREA_MIN_CONTENT_WIDTH } from "../../../constants";
import { areaSlice, AreaState } from "../../../store/slices/areaSlice";
import { AreaRowLayout } from "../../../types/areaTypes";
import { CardinalDirection, IntercardinalDirection } from "../../../types/directions";
import type { RequestActionParams } from "../../../types/requestAction";
import { computeAreaToParentRow } from "../../../utils/areaToParentRow";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { capToRange, isVecInRect } from "../../../utils/math";
import type { Rect } from "../../../utils/math/types";
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
            console.log('Creating new area:', { horizontal, viewport });

            if ((horizontal ? viewport.width : viewport.height) < AREA_MIN_CONTENT_WIDTH * 2) {
                console.log('Area too small, joining instead');
                const handlers = joinAreas();
                currentHandlers = handlers;
                if (handlers.onMove) {
                    handlers.onMove(lastMousePosition);
                }
                handlerSet = true;
                return;
            }

            params.performDiff((diff) => {
                // 1. Convertir en row
                params.dispatch(areaActions.convertAreaToRow({
                    areaId,
                    cornerParts: directionParts,
                    horizontal
                }));

                // 2. Récupérer l'état mis à jour
                const currentState = getActionState().area;
                console.log('Current state after conversion:', currentState);

                // 3. Vérifier que la ligne a été créée
                const row = currentState.layout[areaId] as AreaRowLayout;
                if (!row || !row.areas) {
                    console.error('Row not found after conversion');
                    params.cancelAction();
                    return;
                }

                // 4. Récupérer les IDs des nouvelles zones
                const newAreas = row.areas.map(area => area.id);
                console.log('New areas:', newAreas);

                // 5. Initialiser les tailles des zones
                params.dispatch(areaActions.setRowSizes({
                    rowId: areaId,
                    sizes: [0.5, 0.5]
                }));

                // 6. Forcer une mise à jour du layout
                diff.resizeAreas();

                // 7. Calculer et initialiser les viewports
                const rootViewport = getAreaRootViewport();
                console.log('Root viewport:', rootViewport);

                const viewports: Record<string, Rect> = {};
                newAreas.forEach((newAreaId, index) => {
                    const newViewport = {
                        left: viewport.left + (horizontal && index === 1 ? viewport.width / 2 : 0),
                        top: viewport.top + (!horizontal && index === 1 ? viewport.height / 2 : 0),
                        width: horizontal ? viewport.width / 2 : viewport.width,
                        height: horizontal ? viewport.height : viewport.height / 2
                    };
                    viewports[newAreaId] = newViewport;

                    // Mettre à jour directement l'area avec son viewport
                    params.dispatch(areaActions.updateArea({
                        id: newAreaId,
                        changes: { viewport: newViewport }
                    }));
                });

                // 8. Mettre à jour les viewports dans le state global
                params.dispatch(areaActions.setViewports({ viewports }));

                // 9. Forcer une seconde mise à jour pour s'assurer que tout est synchronisé
                diff.resizeAreas();

                // 10. Configurer les handlers
                const getT = (vec: Vec2): number => {
                    const viewportSize = horizontal ? viewport.width : viewport.height;
                    const minT = AREA_MIN_CONTENT_WIDTH / viewportSize;
                    const t0 = horizontal ? viewport.left : viewport.top;
                    const t1 = horizontal ? viewport.left + viewport.width : viewport.top + viewport.height;
                    const val = horizontal ? vec.x : vec.y;
                    return capToRange(minT, 1 - minT, (val - t0) / (t1 - t0));
                };

                const onMoveFn = (vec: Vec2) => {
                    const t = getT(vec);
                    const newViewports: Record<string, Rect> = {};

                    // Mettre à jour les viewports pendant le déplacement
                    newAreas.forEach((newAreaId, index) => {
                        const size = index === 0 ? t : 1 - t;
                        const newViewport = {
                            left: viewport.left + (horizontal && index === 1 ? viewport.width * t : 0),
                            top: viewport.top + (!horizontal && index === 1 ? viewport.height * t : 0),
                            width: horizontal ? viewport.width * size : viewport.width,
                            height: horizontal ? viewport.height : viewport.height * size
                        };
                        newViewports[newAreaId] = newViewport;

                        // Mettre à jour directement l'area
                        params.dispatch(areaActions.updateArea({
                            id: newAreaId,
                            changes: { viewport: newViewport }
                        }));
                    });

                    // Mettre à jour les tailles et les viewports
                    params.dispatch(areaActions.setRowSizes({
                        rowId: areaId,
                        sizes: [t, 1 - t]
                    }));

                    params.dispatch(areaActions.setViewports({ viewports: newViewports }));

                    // Forcer la mise à jour
                    params.performDiff((diff) => {
                        diff.resizeAreas();
                    });
                };

                const onMouseUpFn = () => {
                    // Forcer une dernière mise à jour
                    params.addDiff((diff) => {
                        diff.resizeAreas();
                    });
                    params.submitAction("Create new area");
                };

                currentHandlers = {
                    onMove: onMoveFn,
                    onMouseUp: onMouseUpFn
                };
            });
        }

        function joinAreas() {
            if (!row) {
                throw new Error("Expected row to be valid.");
            }

            let areaIndex = row.areas.map((x) => x.id).indexOf(areaId);
            let eligibleAreaIndices = getEligibleAreaIndices(state, row, areaIndex);

            // Vérifier que les viewports sont disponibles pour toutes les zones éligibles
            const eligibleAreaIds = eligibleAreaIndices.map((i) => row.areas[i].id);
            for (const id of eligibleAreaIds) {
                if (!areaToViewport[id]) {
                    console.error('Viewport not available for area:', id);
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

                for (let i = 0; i < eligibleAreaIndices.length; i += 1) {
                    const eligibleAreaIndex = eligibleAreaIndices[i];
                    const eligibleAreaId = row.areas[eligibleAreaIndex].id;

                    if (!isVecInRect(vec, areaToViewport[eligibleAreaId])) {
                        continue;
                    }

                    const arrowDirection = getArrowDirection(row, areaIndex, eligibleAreaIndex);
                    const nextAreaId = row.areas[eligibleAreaIndices[i]].id;

                    const mergeArea = Math.min(areaIndex, eligibleAreaIndex);
                    const mergeInto = eligibleAreaIndex > areaIndex ? 1 : -1;

                    areaIndex = eligibleAreaIndex;
                    eligibleAreaIndices = getEligibleAreaIndices(state, row, areaIndex);

                    params.dispatch(
                        areaActions.setJoinAreasPreview({
                            areaId: nextAreaId,
                            direction: arrowDirection,
                            eligibleAreaIds: getEligibleAreaIds(eligibleAreaIndices),
                        }),
                    );
                    params.performDiff(() => { });
                }
            };

            const onMouseUpFn: (() => void) | undefined = () => {
                if (!isVecInRect(lastMousePosition, areaToViewport[row.areas[areaIndex].id])) {
                    // Nettoyer les états temporaires avant d'annuler
                    params.dispatch(areaActions.cleanupTemporaryStates());
                    params.cancelAction();
                    return;
                }

                params.dispatch(areaActions.joinAreas({
                    rowId: row.id,
                    mergeArea: Math.min(areaIndex, areaIndex + 1),
                    mergeInto: areaIndex < row.areas.length - 1 ? 1 : -1
                }));
                // Nettoyer les états temporaires après la fusion
                params.dispatch(areaActions.cleanupTemporaryStates());
                params.addDiff(() => { });
                params.submitAction("Join areas");
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
