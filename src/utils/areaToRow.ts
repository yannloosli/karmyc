import { AreaRowLayout } from "../types/areaTypes";
import { CardinalDirection } from "../types/directions";

function insertAtStart(cornerParts: [CardinalDirection, CardinalDirection], horizontal: boolean): boolean {
    const [vertical, horiz] = cornerParts;
    return horizontal ? horiz === "w" : vertical === "n";
}

/**
 * Convertit une zone en une ligne contenant deux zones
 * @param rowId Identifiant de la nouvelle ligne
 * @param idForOldArea Identifiant pour l'ancienne zone
 * @param idForNewArea Identifiant pour la nouvelle zone
 * @param horizontal Orientation horizontale ou verticale
 * @param cornerParts Direction du coin pour déterminer l'ordre des zones
 * @returns Un layout de ligne contenant deux zones avec des tailles valides
 */
export function areaToRow(
    rowId: string,
    idForOldArea: string,
    idForNewArea: string,
    horizontal: boolean,
    cornerParts: [CardinalDirection, CardinalDirection]
): AreaRowLayout {
    // Taille minimale pour éviter les zones de taille nulle
    const MIN_SIZE = 0.2; // 20%
    const MAX_SIZE = 0.8; // 80%

    // Détermine la taille initiale basée sur la position de division
    // Pour une meilleure UX, si on divise à partir d'un coin, favorsier une petite zone
    // Si nous n'avons pas cette information, utiliser une division égale
    const position = cornerParts ? 0.3 : 0.5; // 30% si division par coin, 50% sinon

    // Calculer les tailles en respectant les limites min/max
    const newAreaSize = Math.max(MIN_SIZE, Math.min(MAX_SIZE, position));
    const oldAreaSize = 1 - newAreaSize;

    // Vérifier que les tailles sont valides
    if (newAreaSize <= 0 || oldAreaSize <= 0 || Math.abs(newAreaSize + oldAreaSize - 1) > 0.001) {
        console.warn(`Invalid area sizes calculated: ${newAreaSize} + ${oldAreaSize}. Using equal distribution.`);
        // Fallback à une distribution égale
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

    // Initialiser les deux zones avec les tailles calculées
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
