/**
 * @deprecated Use the functions from math/index.ts instead
 * This file is kept for compatibility with existing code
 */

import { Point, Rect } from '../types/geometry';
import { boundingRectOfRects as boundingRectOfRectsNew, isVecInRect as isVecInRectNew } from './math/index';

/**
 * @deprecated Use isVecInRect from math/index.ts instead
 */
export function isVecInRect(vec: Point, rect: Rect): boolean {
    return isVecInRectNew(vec, rect);
}

/**
 * @deprecated Use boundingRectOfRects from math/index.ts instead
 */
export function boundingRectOfRects(rects: Rect[]): Rect | null {
    return boundingRectOfRectsNew(rects);
} 
