/**
 * Functions for manipulating Bezier curves
 */

import { Vec2 } from './vec2';

export type CubicBezier = [Vec2, Vec2, Vec2, Vec2];

/**
 * Calculates the control point P2 of a cubic Bezier curve
 */
function _completeCubicBezierCalcP2(p3: Vec2, p1: Vec2): Vec2 {
    return Vec2.new(p1.x + (p3.x - p1.x) * 0.4, p1.y + (p3.y - p1.y) * 0.4);
}

/**
 * Completes a cubic Bezier curve from partial points
 */
export function completeCubicBezier(
    p0: Vec2,
    p1: Vec2 | null,
    p2: Vec2 | null,
    p3: Vec2,
): CubicBezier {
    if (p1 === null) {
        const newP1 = _completeCubicBezierCalcP2(p2!, p0);
        return [p0, newP1, p2!, p3];
    } else {
        const newP2 = _completeCubicBezierCalcP2(p1!, p3);
        return [p0, p1, newP2, p3];
    }
}

/**
 * Converts a quadratic Bezier curve to a cubic one
 */
export function quadraticToCubicBezier(p0: Vec2, p1: Vec2, p2: Vec2): CubicBezier {
    const cp0 = p0.add(p1.sub(p0).scale(2 / 3));
    const cp1 = p2.add(p1.sub(p2).scale(2 / 3));
    return [p0, cp0, cp1, p2];
}

/**
 * Interpolates a point on a cubic Bezier curve
 */
export function interpolateCubicBezier(cubicBezier: CubicBezier, t: number): Vec2 {
    const [p0, p1, p2, p3] = cubicBezier;

    const u = 1 - t;

    let x = Math.pow(u, 3) * p0.x;
    x += 3 * t * Math.pow(u, 2) * p1.x;
    x += 3 * u * Math.pow(t, 2) * p2.x;
    x += Math.pow(t, 3) * p3.x;

    let y = Math.pow(u, 3) * p0.y;
    y += 3 * t * Math.pow(u, 2) * p1.y;
    y += 3 * u * Math.pow(t, 2) * p2.y;
    y += Math.pow(t, 3) * p3.y;

    return Vec2.new(x, y);
} 
