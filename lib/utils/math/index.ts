/**
 * Entry point for the mathematics module
 * This file re-exports all mathematical functions and classes
 */

// Export of core functions
export * from './core';

// Export of rectangle manipulation functions
export * from './rect';

// Export of vector and angle functions
export * from './vector';

// Export of main classes
export * from './mat';
export * from './vec2';

// Export of Bezier functions
export * from './bezier';

// Export of intersection functions
export * from './intersection/intersectInfiniteLines';

// Geometric types
export interface Point {
    x: number;
    y: number;
}

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
