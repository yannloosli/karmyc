import { Point, Rect } from '../types/geometry';

export function isVecInRect(vec: Point, rect: Rect): boolean {
    return (
        vec.x >= rect.left &&
        vec.x <= rect.right &&
        vec.y >= rect.top &&
        vec.y <= rect.bottom
    );
}

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
        right = Math.max(right, rect.right);
        bottom = Math.max(bottom, rect.bottom);
    }

    const width = right - left;
    const height = bottom - top;

    return {
        left,
        top,
        width,
        height,
        right,
        bottom,
    };
} 
