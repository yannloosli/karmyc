/**
 * Entry point for the mathematics module
 * This file re-exports all mathematical functions and classes
 */

// Export of core functions
export { capToRange, interpolate } from './core';

// Export of rectangle manipulation functions
export { boundingRectOfRects, contractRect, rectOfTwoVecs } from './rect';

// Export of vector and angle functions
export { getAngleRadians, getDistance } from './vector';

// Export of main classes
// export * from './mat'; // Mat2 not used
export { Vec2 } from './vec2'; // Keep Vec2 for safety

// Export of Bezier functions
// export * from './bezier'; // Not used

// Export of intersection functions
// export * from './intersection/intersectInfiniteLines'; // Not used

// Geometric types
export interface Point {
    x: number;
    y: number;
}

// We also need Rect, let's make sure it's exported
export type { Rect } from '../../types/geometry';

/**
 * Checks if a point is inside a rectangle
 */
export function isVecInRect(vec: Point, rect: { left: number; top: number; width: number; height: number }): boolean {
    return (
        vec.x >= rect.left &&
        vec.x <= rect.left + rect.width &&
        vec.y >= rect.top &&
        vec.y <= rect.top + rect.height
    );
} 
