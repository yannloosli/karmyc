import { Vec2 } from "./vec2";
import { AreaReducerState, Rect } from "../types";

export type PlaceArea = "top" | "left" | "right" | "bottom" | "replace";

export const getHoveredAreaId = (
    position: Vec2,
    areaState: AreaReducerState,
    areaToViewport: {
        [areaId: string]: Rect;
    },
    draggedElementDimensions?: Vec2,
): string | undefined => {
    // If we have the dimensions of the dragged element, calculate the center
    const centerPosition = draggedElementDimensions
        ? Vec2.new(
            position.x + draggedElementDimensions.x / 15,
            position.y + draggedElementDimensions.y / 15
        )
        : position;

    let hoveredStackId: string | undefined;
    let hoveredAreaId: string | undefined;
    let minDistance = Infinity;
    let closestAreaId: string | undefined;

    // Go through all areas and find the closest one
    Object.entries(areaToViewport).forEach(([id, viewport]) => {
        const layout = areaState.layout[id];
        if (!layout || (layout.type !== 'area' && !(layout.type === 'area_row' && (layout as any).orientation === 'stack'))) return;

        const isInside = centerPosition.x >= viewport.left &&
            centerPosition.x <= viewport.left + viewport.width &&
            centerPosition.y >= viewport.top &&
            centerPosition.y <= viewport.top + viewport.height;

        if (isInside) {
            if (layout.type === 'area_row' && (layout as any).orientation === 'stack') {
                hoveredStackId = id;
            } else if (layout.type === 'area') {
                hoveredAreaId = id;
            }
            return;
        }

        // Calculate distance to the nearest edge
        const distanceToLeft = Math.abs(centerPosition.x - viewport.left);
        const distanceToRight = Math.abs(centerPosition.x - (viewport.left + viewport.width));
        const distanceToTop = Math.abs(centerPosition.y - viewport.top);
        const distanceToBottom = Math.abs(centerPosition.y - (viewport.top + viewport.height));

        // Calculate minimum distance to edges
        const distance = Math.min(distanceToLeft, distanceToRight, distanceToTop, distanceToBottom);

        // If this area is closer than the previous one, select it
        if (distance < minDistance) {
            minDistance = distance;
            closestAreaId = id;
        }
    });

    // Priorité : 1. Stack hovered, 2. Area hovered, 3. Closest area
    return hoveredStackId || hoveredAreaId || closestAreaId;
};

export function getAreaToOpenPlacementInViewport(
    viewport: { left: number; top: number; width: number; height: number },
    position: Vec2
): PlaceArea {

    // Calculate relative position in the viewport
    const relativeX = position.x - viewport.left;
    const relativeY = position.y - viewport.top;

    // Calculate distances to edges
    const distanceToLeft = relativeX;
    const distanceToRight = viewport.width - relativeX;
    const distanceToTop = relativeY;
    const distanceToBottom = viewport.height - relativeY;

    // Calculate distance to center
    const centerX = viewport.width / 2;
    const centerY = viewport.height / 2;
    const distanceToCenter = Math.sqrt(
        Math.pow(relativeX - centerX, 2) +
        Math.pow(relativeY - centerY, 2)
    );

    // If close to center, return "replace"
    const centerThreshold = Math.min(viewport.width, viewport.height) * 0.3; // 30% of the minimum size
    if (distanceToCenter < centerThreshold) {
        return "replace";
    }

    // Find minimum distance to edges
    const minDistance = Math.min(
        distanceToLeft,
        distanceToRight,
        distanceToTop,
        distanceToBottom
    );

    // Determine placement based on minimum distance
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

    return placement;
}
