import { Rect } from '../types/math';
/**
 * Represents a map of area IDs to their viewport rectangles.
 * Can be undefined or null if no viewports are present.
 */
export type ViewportMap = {
    [key: string]: Rect;
} | undefined | null;
/**
 * Deeply compares two viewport maps.
 * @param map1 The first viewport map.
 * @param map2 The second viewport map.
 * @returns True if the maps are deeply equal, false otherwise.
 */
export declare function areViewportMapsEqual(map1: ViewportMap, map2: ViewportMap): boolean;
