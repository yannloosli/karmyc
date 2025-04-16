/**
 * Functions for vector and angle manipulation
 */

import { positiveAngleRadians } from './core';
import { intersectInfiniteLines } from './intersection/intersectInfiniteLines';
import { Mat2 } from './mat';
import { Vec2 } from './vec2';

type Line = [Vec2, Vec2];

/**
 * Calculates the distance between two points
 */
export function getDistance(a: Vec2, b: Vec2) {
    return Math.hypot(b.x - a.x, b.y - a.y);
}

/**
 * Sort function for vectors by position (top-left)
 */
export const sortVecTopLeft = (a: Vec2, b: Vec2, acceptableVariance = 0): number => {
    return Math.abs(a.y - b.y) <= acceptableVariance ? a.x - b.x : a.y - b.y;
};

/**
 * Rotates a vector counter-clockwise
 * @deprecated Use Vec2's rotate method directly
 */
export function rotateVec2CCW(vec: Vec2, angle: number, anchor = Vec2.new(0, 0)): Vec2 {
    if (angle === 0) {
        return vec;
    }

    return vec.rotate(angle, anchor);
}

/**
 * Gets the angle in radians between two vectors
 */
export function getAngleRadians(from: Vec2, to: Vec2): number {
    const vec = to.sub(from);
    return Math.atan2(vec.y, vec.x);
}

/**
 * Gets the positive angle in radians between two vectors
 */
export function getAngleRadiansPositive(from: Vec2, to: Vec2): number {
    const vec = to.sub(from);
    return positiveAngleRadians(Math.atan2(vec.y, vec.x));
}

/**
 * Rotates a vector to a target angle
 */
export function rotateVecToAngleRadians(vec: Vec2, targetAngle: number): Vec2 {
    const angle = getAngleRadians(Vec2.new(0, 0), vec);
    const diff = Math.abs(angle - targetAngle);
    return rotateVec2CCW(vec, diff);
}

/**
 * Projects a vector onto a line defined by an angle
 */
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

/**
 * Projects a vector onto the nearest 45-degree line
 */
export const projectVecTo45DegAngle = (vec: Vec2): Vec2 => {
    const angleRad = getAngleRadians(Vec2.new(0, 0), vec);
    const tick = (Math.PI * 2) / 8;
    const angle = Math.round(angleRad / tick) * tick;
    return projectVecToAngle(vec, angle);
};

/**
 * Splits a line into two segments according to a ratio
 */
export const splitLine = (line: Line, t: number): [Line, Line] => {
    const [start, end] = line;
    const mid = start.lerp(end, t);
    return [[start, mid], [mid, end]];
};

/**
 * Creates an outline around a line with a given width
 */
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
