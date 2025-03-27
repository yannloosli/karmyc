import { AreaReducerState } from "~/types/areaTypes";
import { Rect } from "../types/geometry";
import { Vec2 } from "../utils/math/vec2";

export type PlaceArea = "top" | "left" | "right" | "bottom" | "replace";

export const getHoveredAreaId = (
    position: Vec2,
    areaState: AreaReducerState,
    areaToViewport: {
        [areaId: string]: Rect;
    },
    draggedElementDimensions?: Vec2,
): string | undefined => {
    // Si on a les dimensions de l'élément dragué, on calcule le centre
    const centerPosition = draggedElementDimensions
        ? Vec2.new(
            position.x + draggedElementDimensions.x / 15,
            position.y + draggedElementDimensions.y / 15
        )
        : position;

    console.debug('getHoveredAreaId - Position:', {
        original: { x: position.x, y: position.y },
        center: { x: centerPosition.x, y: centerPosition.y }
    });

    let areaId: string | undefined;
    let minDistance = Infinity;

    // Parcourir toutes les zones et trouver la plus proche
    Object.entries(areaToViewport).forEach(([id, viewport]) => {
        // Ne considérer que les leafs (type === 'area')
        const layout = areaState.layout[id];
        if (!layout || layout.type !== 'area') return;

        // Calculer la distance au bord le plus proche
        const distanceToLeft = Math.abs(centerPosition.x - viewport.left);
        const distanceToRight = Math.abs(centerPosition.x - (viewport.left + viewport.width));
        const distanceToTop = Math.abs(centerPosition.y - viewport.top);
        const distanceToBottom = Math.abs(centerPosition.y - (viewport.top + viewport.height));

        // Si le point est à l'intérieur de la zone, la distance est 0
        const isInside = centerPosition.x >= viewport.left &&
            centerPosition.x <= viewport.left + viewport.width &&
            centerPosition.y >= viewport.top &&
            centerPosition.y <= viewport.top + viewport.height;

        if (isInside) {
            areaId = id;
            minDistance = 0;
            return;
        }

        // Sinon, calculer la distance minimale aux bords
        const distance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

        // Si cette zone est plus proche que la précédente, la sélectionner
        if (distance < minDistance) {
            minDistance = distance;
            areaId = id;
        }
    });

    return areaId;
};

export function getAreaToOpenPlacementInViewport(
    viewport: { left: number; top: number; width: number; height: number },
    position: Vec2
): PlaceArea {

    // Calculer la position relative dans le viewport
    const relativeX = position.x - viewport.left;
    const relativeY = position.y - viewport.top;

    // Calculer les distances aux bords
    const distanceToLeft = relativeX;
    const distanceToRight = viewport.width - relativeX;
    const distanceToTop = relativeY;
    const distanceToBottom = viewport.height - relativeY;

    // Calculer la distance au centre
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const distanceToCenter = Math.sqrt(
        Math.pow(relativeX - centerX, 2) +
        Math.pow(relativeY - centerY, 2)
    );

    // Si on est proche du centre, on retourne "replace"
    const centerThreshold = Math.min(viewport.width, viewport.height) * 0.3; // 30% de la taille minimale
    if (distanceToCenter < centerThreshold) {
        return "replace";
    }

    // Trouver la distance minimale aux bords
    const minDistance = Math.min(
        distanceToLeft,
        distanceToRight,
        distanceToTop,
        distanceToBottom
    );

    // Déterminer le placement en fonction de la distance minimale
    let placement: PlaceArea;
    if (minDistance === distanceToLeft) {
        placement = "left";
    } else if (minDistance === distanceToRight) {
        placement = "right";
    } else if (minDistance === distanceToTop) {
        placement = "top";
    } else {
        placement = "bottom";
    }

    console.log('getAreaToOpenPlacementInViewport - Placement choisi:', placement);
    return placement;
}
