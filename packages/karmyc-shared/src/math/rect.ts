/**
 * Functions for manipulating rectangles and geometric operations
 */

import type { Rect } from '../../types/geometry';
import { Vec2 } from './vec2';

/**
 * Creates a rectangle from two points
 */
export const rectOfTwoVecs = (a: Vec2, b: Vec2): Rect => {
    const xMin = Math.min(a.x, b.x);
    const xMax = Math.max(a.x, b.x);
    const yMin = Math.min(a.y, b.y);
    const yMax = Math.max(a.y, b.y);
    return {
        height: yMax - yMin,
        width: xMax - xMin,
        left: xMin,
        top: yMin,
    };
};

/**
 * Creates a bounding rectangle around a set of rectangles
 */
export function boundingRectOfRects(rects: Rect[]): Rect | null {
    if (rects.length === 0) {
        return null;
    }

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    for (const rect of rects) {
        left = Math.min(left, rect.left);
        top = Math.min(top, rect.top);
        right = Math.max(right, rect.left + rect.width);
        bottom = Math.max(bottom, rect.top + rect.height);
    }

    const width = right - left;
    const height = bottom - top;

    return {
        left,
        top,
        width,
        height,
    };
}

/**
 * Shrinks a rectangle by a given value
 */
export const contractRect = (rect: Rect, contractBy: number): Rect => {
    return {
        left: rect.left + contractBy,
        top: rect.top + contractBy,
        width: rect.width - contractBy * 2,
        height: rect.height - contractBy * 2,
    };
}; 
