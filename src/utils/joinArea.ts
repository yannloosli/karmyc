import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export const joinAreas = (
    row: AreaRowLayout,
    mergeArea: number,  // This is the source area (the one being moved)
    mergeInto: -1 | 1  // Merge direction (-1 for west, 1 for east)
) => {
    // mergeArea is the source index
    const sourceIndex = mergeArea;
    // The target is to the left (mergeInto = -1) or to the right (mergeInto = 1) of the source
    const targetIndex = sourceIndex + mergeInto;

    // Check that indices are valid
    if (sourceIndex < 0 || sourceIndex >= row.areas.length ||
        targetIndex < 0 || targetIndex >= row.areas.length) {
        throw new Error(`Invalid indices: source=${sourceIndex}, target=${targetIndex}, length=${row.areas.length}, direction=${mergeInto === -1 ? 'west' : 'east'}`);
    }

    const sourceArea = row.areas[sourceIndex];
    const targetArea = row.areas[targetIndex];

    if (!sourceArea || !targetArea) {
        throw new Error(`Missing areas: source=${sourceArea}, target=${targetArea}`);
    }

    // Calculate new size (sum of both areas)
    const sourceSize = sourceArea.size || 1;
    const targetSize = targetArea.size || 1;
    const newSize = sourceSize + targetSize;

    // If we have only 2 areas
    if (row.areas.length === 2) {
        const newArea: AreaLayout = {
            type: "area",
            id: sourceArea.id
        };
        return { area: newArea, removedAreaId: targetArea.id };
    }

    // For more than 2 areas
    const resultAreas = [...row.areas];

    // The source area takes the target's position with the combined size
    resultAreas[targetIndex] = {
        id: sourceArea.id,
        size: newSize
    };

    // Remove the original source position
    resultAreas.splice(sourceIndex, 1);

    // Create the new resulting area
    const newArea: AreaRowLayout = {
        ...row,
        areas: resultAreas
    };

    // Return the result
    return {
        area: newArea,
        removedAreaId: targetArea.id
    };
}; 
