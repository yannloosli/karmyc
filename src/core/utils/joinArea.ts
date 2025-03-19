import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export const joinAreas = (
    row: AreaRowLayout,
    mergeArea: number,  // C'est la zone source (celle qu'on déplace)
    mergeInto: -1 | 1  // Direction de fusion (-1 pour ouest, 1 pour est)
) => {
    // mergeArea est l'index de la source
    const sourceIndex = mergeArea;
    // La cible est à gauche (mergeInto = -1) ou à droite (mergeInto = 1) de la source
    const targetIndex = sourceIndex + mergeInto;

    console.log('Indices de fusion:', {
        sourceIndex,
        targetIndex,
        mergeInto,
        rowLength: row.areas.length,
        areas: row.areas,
        direction: mergeInto === -1 ? 'ouest' : 'est'
    });

    // Vérifier que les indices sont valides
    if (sourceIndex < 0 || sourceIndex >= row.areas.length ||
        targetIndex < 0 || targetIndex >= row.areas.length) {
        throw new Error(`Invalid indices: source=${sourceIndex}, target=${targetIndex}, length=${row.areas.length}, direction=${mergeInto === -1 ? 'ouest' : 'est'}`);
    }

    const sourceArea = row.areas[sourceIndex];
    const targetArea = row.areas[targetIndex];

    if (!sourceArea || !targetArea) {
        throw new Error(`Missing areas: source=${sourceArea}, target=${targetArea}`);
    }

    // Calculer la nouvelle taille (somme des deux zones)
    const sourceSize = sourceArea.size || 1;
    const targetSize = targetArea.size || 1;
    const newSize = sourceSize + targetSize;

    // Si nous avons seulement 2 zones
    if (row.areas.length === 2) {
        const newArea: AreaLayout = {
            type: "area",
            id: sourceArea.id
        };
        return { area: newArea, removedAreaId: targetArea.id };
    }

    // Pour plus de 2 zones
    const resultAreas = [...row.areas];

    // La zone source prend la position de la cible avec la taille combinée
    resultAreas[targetIndex] = {
        id: sourceArea.id,
        size: newSize
    };

    // Supprimer la position originale de la source
    resultAreas.splice(sourceIndex, 1);

    // Créer la nouvelle zone résultante
    const newArea: AreaRowLayout = {
        ...row,
        areas: resultAreas
    };

    // Retourner le résultat
    return {
        area: newArea,
        removedAreaId: targetArea.id
    };
}; 
