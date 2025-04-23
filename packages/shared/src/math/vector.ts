/**
 * Functions for vector and angle manipulation
 */

import { Vec2 } from './vec2';

type Line = [Vec2, Vec2];

/**
 * Calculates the distance between two points
 */
export function getDistance(a: Vec2, b: Vec2) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Gets the angle in radians between two vectors
 */
export function getAngleRadians(from: Vec2, to: Vec2): number {
    const vec = to.sub(from);
    return Math.atan2(vec.y, vec.x);
}

// Removed unused function: sortVecTopLeft
/*
export const sortVecTopLeft = (a: Vec2, b: Vec2, acceptableVariance = 0): number => {
    return Math.abs(a.y - b.y) <= acceptableVariance ? a.x - b.x : a.y - b.y;
};
*/

// Removed unused function: rotateVec2CCW
/*
export function rotateVec2CCW(vec: Vec2, angle: number, anchor = Vec2.new(0, 0)): Vec2 {
    if (angle === 0) {
        return vec;
    }

    return vec.rotate(angle, anchor);
}
*/

// Removed unused function: getAngleRadiansPositive
/*
export function getAngleRadiansPositive(from: Vec2, to: Vec2): number {
    const vec = to.sub(from);
    return positiveAngleRadians(Math.atan2(vec.y, vec.x));
}
*/

// Removed unused function: rotateVecToAngleRadians
/*
export function rotateVecToAngleRadians(vec: Vec2, targetAngle: number): Vec2 {
    const angle = getAngleRadians(Vec2.new(0, 0), vec);
    const diff = Math.abs(angle - targetAngle);
    return rotateVec2CCW(vec, diff);
}
*/

// Removed unused function: projectVecToAngle
/*
export const projectVecToAngle = (vec: Vec2, angle: number): Vec2 => {
    if (vec.x === 0 && vec.y === 0) {
        return vec;
    }

    const rotmat = Mat2.rotation(angle);
    const perpmat = Mat2.rotation(angle + Math.PI / 2);

    // Use type any to work around the linter error with Vec2
    const fromOrigin: any = [Vec2.new(0, 0), rotmat.multiplyVec2(Vec2.new(1, 0))];
    const fromVec: any = [
        vec.add(perpmat.i()),
        vec.add(perpmat.i().scale(-1))
    ];

    const result = intersectInfiniteLines(fromOrigin, fromVec);
    return Vec2.new(result.x, result.y);
};
*/

// Removed unused function: projectVecTo45DegAngle
/*
export const projectVecTo45DegAngle = (vec: Vec2): Vec2 => {
    const angleRad = getAngleRadians(Vec2.new(0, 0), vec);
    const tick = (Math.PI * 2) / 8;
    const angle = Math.round(angleRad / tick) * tick;
    return projectVecToAngle(vec, angle);
};
*/

// Removed unused function: splitLine
/*
export const splitLine = (line: Line, t: number): [Line, Line] => {
    const [start, end] = line;
    const mid = start.lerp(end, t);
    return [[start, mid], [mid, end]];
};
*/

// Removed unused function: outlineLine
/*
export const outlineLine = (line: Line, width: number): Vec2[] => {
    const [a, b] = line;
    const v = b.sub(a);
    const l = getDistance(a, b);

    if (l === 0) {
        return [a, a, a, a];
    }

    const n = Vec2.new(-v.y / l, v.x / l).scale(width / 2);
    return [a.add(n), b.add(n), b.sub(n), a.sub(n)];
};
*/
