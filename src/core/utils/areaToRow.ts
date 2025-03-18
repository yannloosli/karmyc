import { AreaRowLayout } from "../types/areaTypes";
import { CardinalDirection } from "../types/directions";

const insertAtStart = (
    cornerParts: [CardinalDirection, CardinalDirection],
    horizontal: boolean,
): boolean => {
    if (!cornerParts || !Array.isArray(cornerParts)) {
        return false; // Valeur par défaut si cornerParts est invalide
    }
    if (horizontal) {
        return cornerParts.includes("w");
    }
    return cornerParts.includes("n");
};

export function areaToRow(
    rowId: string,
    idForOldArea: string,
    idForNewArea: string,
    horizontal: boolean,
    cornerParts: [CardinalDirection, CardinalDirection]
): AreaRowLayout {
    const rowAreas: Array<AreaRowLayout["areas"][number]> = [{ size: 0.5, id: idForOldArea }];

    rowAreas.splice(insertAtStart(cornerParts, horizontal) ? 0 : 1, 0, {
        size: 0.5,
        id: idForNewArea,
    });

    return {
        type: "area_row",
        id: rowId,
        orientation: horizontal ? "horizontal" : "vertical",
        areas: rowAreas,
    };
} 
