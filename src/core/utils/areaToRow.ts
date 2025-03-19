import { AreaRowLayout } from "../types/areaTypes";
import { CardinalDirection } from "../types/directions";

function insertAtStart(cornerParts: [CardinalDirection, CardinalDirection], horizontal: boolean): boolean {
    const [vertical, horiz] = cornerParts;
    return horizontal ? horiz === "w" : vertical === "n";
}

export function areaToRow(
    rowId: string,
    idForOldArea: string,
    idForNewArea: string,
    horizontal: boolean,
    cornerParts: [CardinalDirection, CardinalDirection]
): AreaRowLayout {
    // Initialiser les deux zones avec des tailles égales
    const rowAreas: Array<AreaRowLayout["areas"][number]> = [
        { size: 0.5, id: idForOldArea }
    ];

    // Insérer la nouvelle zone au début ou à la fin selon la direction
    rowAreas.splice(insertAtStart(cornerParts, horizontal) ? 0 : 1, 0, {
        size: 0.5,
        id: idForNewArea
    });

    return {
        type: "area_row",
        id: rowId,
        orientation: horizontal ? "horizontal" : "vertical",
        areas: rowAreas
    };
} 
