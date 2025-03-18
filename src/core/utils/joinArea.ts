import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export const joinAreas = (
    row: AreaRowLayout,
    areaIndex: number,
    mergeInto: -1 | 1
) => {
    const areas = [...row.areas];
    const area = areas[areaIndex];
    const targetArea = areas[areaIndex + mergeInto];

    if (!area || !targetArea) {
        throw new Error("Invalid area index or merge direction");
    }

    // Calculer la nouvelle taille en additionnant les tailles des zones fusionnées
    const newSize = (area.size || 1) + (targetArea.size || 1);

    // Créer la nouvelle zone avec l'ID de la zone cible
    const newArea: AreaLayout = {
        type: "area",
        id: targetArea.id,
    };

    // La zone fusionnée est toujours celle qu'on déplace
    const removedAreaId = area.id;

    // Si nous avons seulement 2 zones, pas besoin de mettre à jour row.areas
    // car la ligne entière sera supprimée
    if (areas.length > 2) {
        // Déterminer l'index de départ pour la fusion
        const startIndex = mergeInto === -1 ? areaIndex - 1 : areaIndex;

        // Supprimer les deux zones et insérer la nouvelle
        areas.splice(startIndex, 2, { id: targetArea.id, size: newSize });

        // Recalculer les tailles pour s'assurer qu'il n'y a pas de trou
        const totalSize = areas.reduce((sum, a) => sum + (a.size || 1), 0);
        const scaleFactor = row.areas.reduce((sum, a) => sum + (a.size || 1), 0) / totalSize;

        // Ajuster les tailles proportionnellement
        areas.forEach(a => {
            a.size = (a.size || 1) * scaleFactor;
        });

        row.areas = areas;
    }

    return { area: newArea, removedAreaId };
}; 
