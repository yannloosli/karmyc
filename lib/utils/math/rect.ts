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
 * Creates a bounding rectangle around a set of points
 */
export const rectOfVecs = (vecs: Vec2[]): Rect => {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    for (const vec of vecs) {
        if (vec.x > xMax) {
            xMax = vec.x;
        }
        if (vec.x < xMin) {
            xMin = vec.x;
        }

        if (vec.y > yMax) {
            yMax = vec.y;
        }
        if (vec.y < yMin) {
            yMin = vec.y;
        }
    }

    return {
        height: yMax - yMin,
        width: xMax - xMin,
        left: xMin,
        top: yMin,
    };
};

/**
 * Function to sort rectangles by position (top-left)
 */
export const sortRectTopLeft = (a: Rect, b: Rect, acceptableVariance = 0): number => {
    return Math.abs(a.top - b.top) <= acceptableVariance ? a.left - b.left : a.top - b.top;
};

/**
 * Checks if two rectangles overlap
 */
export const rectsIntersect = (a: Rect, b: Rect): boolean => {
    // If one rect is on the left of the other
    if (a.left > b.left + b.width || b.left > a.left + a.width) {
        return false;
    }

    // If one rect is above the other
    if (a.top > b.top + b.height || b.top > a.top + a.height) {
        return false;
    }

    return true;
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
 * Translates a rectangle by a vector
 */
export const translateRect = (rect: Rect, translationVector: Vec2): Rect => {
    return {
        width: rect.width,
        height: rect.height,
        left: rect.left + translationVector.x,
        top: rect.top + translationVector.y,
    };
};

/**
 * Translates a rectangle by applying a transformation function
 */
export const translateRectAsVec = (rect: Rect, transformFn: (vec: Vec2) => Vec2): Rect => {
    const { x: left, y: top } = transformFn(Vec2.new(rect.left, rect.top));
    const v0 = transformFn(Vec2.new(0, 0));
    const v1 = transformFn(Vec2.new(1, 1));
    let { x: wt, y: ht } = v1.sub(v0);
    const width = rect.width * wt;
    const height = rect.height * ht;
    return { left, top, width, height };
};

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

/**
 * Expands a rectangle by a given value
 */
export const expandRect = (rect: Rect, expandBy: number): Rect => contractRect(rect, expandBy * -1);

/**
 * Splits a rectangle into two parts according to a ratio
 */
export const splitRect = (
    type: "horizontal" | "vertical",
    rect: Rect,
    t: number,
    margin = 0,
): [Rect, Rect] => {
    if (type === "horizontal") {
        const w = rect.width - margin;
        const lw = w * t;
        const rw = w * (1 - t);
        return [
            {
                left: rect.left,
                height: rect.height,
                width: lw,
                top: rect.top,
            },
            {
                left: rect.left + lw + margin,
                height: rect.height,
                width: rw,
                top: rect.top,
            },
        ];
    }

    const h = rect.height - margin;
    const th = h * t;
    const bh = h * (1 - t);
    return [
        {
            left: rect.left,
            height: th,
            width: rect.width,
            top: rect.top,
        },
        {
            left: rect.left,
            height: bh,
            width: rect.width,
            top: rect.top + th + margin,
        },
    ];
}; 
