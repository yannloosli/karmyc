import { AreaRowLayout } from "../types/areaTypes";
import { CardinalDirection } from "../types/directions";

function insertAtStart(cornerParts: [CardinalDirection, CardinalDirection], horizontal: boolean): boolean {
    const [vertical, horiz] = cornerParts;
    return horizontal ? horiz === "w" : vertical === "n";
}

/**
 * Converts an area into a row containing two areas
 */
export function areaToRow(
    rowId: string,
    idForOldArea: string,
    idForNewArea: string,
    horizontal: boolean,
    cornerParts: [CardinalDirection, CardinalDirection]
): AreaRowLayout {
    // Minimum size to avoid zero-sized areas
    const MIN_SIZE = 0.2; // 20%
    const MAX_SIZE = 0.8; // 80%

    // Determines the initial size based on the division position
    // For better UX, if dividing from a corner, favor a smaller area
    // If we don't have this information, use an equal division
    const position = cornerParts ? 0.3 : 0.5; // 30% if dividing from corner, 50% otherwise

    // Calculate sizes respecting min/max limits
    const newAreaSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, position));
    const oldAreaSize = 1 - newAreaSize;

    // Verify that sizes are valid
    if (newAreaSize <= 0 || oldAreaSize <= 0 || Math.abs(newAreaSize + oldAreaSize - 1) > 0.001) {
        console.warn(`Invalid area sizes calculated: ${newAreaSize} + ${oldAreaSize}. Using equal distribution.`);
        // Fallback to equal distribution
        return {
            type: "area_row",
            id: rowId,
            orientation: horizontal ? "horizontal" : "vertical",
            areas: [
                { size: 0.5, id: insertAtStart(cornerParts, horizontal) ? idForNewArea : idForOldArea },
                { size: 0.5, id: insertAtStart(cornerParts, horizontal) ? idForOldArea : idForNewArea }
            ]
        };
    }

    // Initialize the two areas with calculated sizes
    const firstArea = {
        size: insertAtStart(cornerParts, horizontal) ? newAreaSize : oldAreaSize,
        id: insertAtStart(cornerParts, horizontal) ? idForNewArea : idForOldArea
    };

    const secondArea = {
        size: insertAtStart(cornerParts, horizontal) ? oldAreaSize : newAreaSize,
        id: insertAtStart(cornerParts, horizontal) ? idForOldArea : idForNewArea
    };

    return {
        type: "area_row",
        id: rowId,
        orientation: horizontal ? "horizontal" : "vertical",
        areas: [firstArea, secondArea]
    };
} 
