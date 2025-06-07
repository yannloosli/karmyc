import { Rect } from '../types/math';

/**
 * Represents a map of area IDs to their viewport rectangles.
 * Can be undefined or null if no viewports are present.
 */
export type ViewportMap = { [key: string]: Rect } | undefined | null;

/**
 * Deeply compares two viewport maps.
 * @param map1 The first viewport map.
 * @param map2 The second viewport map.
 * @returns True if the maps are deeply equal, false otherwise.
 */
export function areViewportMapsEqual(map1: ViewportMap, map2: ViewportMap): boolean {
    // Handles cases where both are null, undefined, or the same instance
    if (map1 === map2) {
        return true;
    }

    // If one is null/undefined and the other isn't, they are not equal
    if (!map1 || !map2) {
        return false;
    }

    const keys1 = Object.keys(map1);
    const keys2 = Object.keys(map2);

    // Different number of areas means they are not equal
    if (keys1.length !== keys2.length) {
        return false;
    }

    // Check each area's viewport
    for (const key of keys1) {
        // If map2 doesn't have a key that map1 has
        if (!map2.hasOwnProperty(key)) {
            return false;
        }
        const rect1 = map1[key];
        const rect2 = map2[key];

        // If any Rect property differs, the maps are not equal
        if (rect1.left !== rect2.left ||
            rect1.top !== rect2.top ||
            rect1.width !== rect2.width ||
            rect1.height !== rect2.height) {
            return false;
        }
    }

    // All checks passed, the maps are deeply equal
    return true;
} 
