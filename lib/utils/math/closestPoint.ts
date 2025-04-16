/**
 * From https://stackoverflow.com/a/44993719
 */

import { CubicBezier, interpolateCubicBezier } from './bezier';
import { Vec2 } from './vec2';

export type Line = [Vec2, Vec2];
export type PointOnPath = { x: number; y: number; d: number; t: number };

export const closestPointOnPath = (
    path: Line | CubicBezier,
    vec: Vec2,
): { t: number; point: Vec2 } => {
    if (path.length === 2) {
        return closestPointOnLine(path as Line, vec);
    }
    return closestPointOnCubicBezier(path as CubicBezier, vec);
};

const closestPointOnLine = ([a, b]: Line, vec: Vec2): { t: number; point: Vec2 } => {
    const a_to_p: [number, number] = [vec.x - a.x, vec.y - a.y];
    const a_to_b: [number, number] = [b.x - a.x, b.y - a.y];
    const atb2 = a_to_b[0] ** 2 + a_to_b[1] ** 2;
    const atp_dot_atb = a_to_p[0] * a_to_b[0] + a_to_p[1] * a_to_b[1];
    const t = Math.min(1, Math.max(0, atp_dot_atb / atb2));
    const point = Vec2.new(a.x + a_to_b[0] * t, a.y + a_to_b[1] * t);
    return { point, t };
};

const closestPointOnCubicBezier = (bezier: CubicBezier, vec: Vec2) => {
    const { out, localMinimum } = _closestPointOnBezier(bezier, vec);
    return { point: out, t: localMinimum as number };
};

/* eslint-disable */

/** Find the ~closest point on a Bézier curve to a point you supply.
 * bezier  : Array of vectors representing control points for a Bézier curve
 * point   : The point (vector) you want to find the closest point to
 * returns: Object with the closest point and other details
 */
export function _closestPointOnBezier(bezier: CubicBezier, point: Vec2): { out: Vec2; localMinimum: number } {
    /**
     * Newton's method for finding the closest point on a bezier curve.
     * Start with a guess of t=0.5, and iteratively improve the guess
     * until we reach a tolerance threshold.
     */
    let t = 0.5;
    let prevT = t;
    const maxIterations = 10;
    let iterations = 0;
    const tolerance = 1e-6;

    let bestT = t;
    let bestDist = Number.MAX_VALUE;

    while (iterations < maxIterations) {
        // Get the point on the curve at t
        const pt = interpolateCubicBezier(bezier, t);
        const dist = Vec2.dot(pt.sub(point), pt.sub(point)); // squared distance

        if (dist < bestDist) {
            bestDist = dist;
            bestT = t;
        }

        // The derivative is the tangent direction
        const d1 = getBezierDerivative(bezier, t);

        // Vector from the point on the curve to the query point
        const toPoint = point.sub(pt);

        // Project the vector onto the tangent to see how far we need to move
        // Use dot product to determine how far to move along the tangent
        const dot = Vec2.dot(toPoint, d1);

        // The second derivative (acceleration) of the curve at point t
        const d2 = getBezierSecondDerivative(bezier, t);

        // Newton's method: f(t) = (p(t) - point) • p'(t)
        // f'(t) = p'(t) • p'(t) + (p(t) - point) • p''(t)
        // This is the derivative of the dot product of (p(t) - point) and the tangent
        const numerator = dot;
        // Calculate the denominator for Newton's method: ||p'(t)||² + (p(t) - point) • p''(t)
        const denominator = Vec2.dot(d1, d1) + Vec2.dot(toPoint, d2);

        if (Math.abs(numerator) < tolerance || Math.abs(denominator) < tolerance) {
            break;
        }

        // Newton's method: t = t - f(t) / f'(t)
        prevT = t;
        t = t - numerator / denominator;

        // Clamp t to [0, 1]
        t = Math.max(0, Math.min(1, t));

        // If t didn't change much, we've converged
        if (Math.abs(t - prevT) < tolerance) {
            break;
        }

        iterations++;
    }

    // Use the best t found during iterations
    t = bestT;
    const out = interpolateCubicBezier(bezier, t);

    return {
        out,
        localMinimum: t
    };
}

/** Find a minimum point for a bounded function. May be a local minimum.
 * minX   : the smallest input value
 * maxX   : the largest input value
 * ƒ      : a function that returns a value `y` given an `x`
 * ε      : how close in `x` the bounds must be before returning
 * returns: the `x` value that produces the smallest `y`
 */
function localMinimum(minX: number, maxX: number, f: (n: number) => number, lim: number) {
    if (lim === undefined) lim = 1e-10;
    let m = minX,
        n = maxX,
        k;
    while (n - m > lim) {
        k = (n + m) / 2;
        if (f(k - lim) < f(k + lim)) n = k;
        else m = k;
    }
    return k;
}

/** Calculate a point along a Bézier segment for a given parameter.
 * out    : A vector to modify to be the point on the curve
 * curve  : Array of vectors representing control points for a Bézier curve
 * t      : Parameter [0,1] for how far along the curve the point should be
 * tmps   : Array of temporary vectors (reduces memory allocations)
 * returns: out (the vector that was modified)
 */
function bezierPoint(out: Vec2, curve: CubicBezier, t: number, tmps?: Vec2[]) {
    if (curve.length < 2) console.error("At least 2 control points are required");
    if (!tmps) {
        tmps = curve.map((pt) => pt.copy());
    } else {
        tmps.forEach((pt, i) => {
            pt.x = curve[i].x;
            pt.y = curve[i].y;
        });
    }

    for (var degree = curve.length - 1; degree--;) {
        for (var i = 0; i <= degree; ++i) lerp(tmps[i], tmps[i], tmps[i + 1], t);
    }

    out.x = tmps[0].x;
    out.y = tmps[0].y;

    return out;
}

function lerp(out: Vec2, a: Vec2, b: Vec2, t: number) {
    let ax = a.x,
        ay = a.y;
    out.x = ax + t * (b.x - ax);
    out.y = ay + t * (b.y - ay);
    return out;
}

/**
 * Options for the getClosestPointOnBezier function
 */
export interface GetClosestPointOnBezierOptions {
    /**
     * Maximum number of iterations
     */
    maxIterations?: number;
    /**
     * Minimum error threshold for convergence
     */
    epsilon?: number;
    /**
     * Initial t value to start the search 
     */
    initialT?: number;
}

/**
 * Find the closest point on a cubic Bezier curve to the given point
 * 
 * Uses the Newton-Raphson method to find the parameter t that gives the closest point on the curve
 */
export function getClosestPointOnBezier(
    curve: CubicBezier,
    point: Vec2,
    options?: GetClosestPointOnBezierOptions,
): number {
    // Set default options
    const {
        maxIterations = 10,
        epsilon = 0.001,
        initialT = 0.5,
    } = options || {};

    let t = initialT;

    // Newton-Raphson iterations
    for (let i = 0; i < maxIterations; i++) {
        // Get current point on curve
        const currentPoint = interpolateCubicBezier(curve, t);

        // Get derivative of curve at t
        const derivative = getBezierDerivative(curve, t);

        // Get second derivative
        const secondDerivative = getBezierSecondDerivative(curve, t);

        // Calculate distance vector from current point to target point
        const distanceVector = currentPoint.sub(point);

        // Calculate numerator: dot product of distance vector and derivative
        const numerator = Vec2.dot(distanceVector, derivative);

        // Calculate denominator: dot product of derivative with itself, plus
        // dot product of distance vector and second derivative
        const denominator = Vec2.dot(derivative, derivative) +
            Vec2.dot(distanceVector, secondDerivative);

        // Avoid division by zero
        if (Math.abs(denominator) < 1e-6) {
            break;
        }

        // Update t
        const newT = t - numerator / denominator;

        // Clamp to [0, 1]
        const clampedNewT = Math.max(0, Math.min(1, newT));

        // Check for convergence
        if (Math.abs(clampedNewT - t) < epsilon) {
            t = clampedNewT;
            break;
        }

        t = clampedNewT;
    }

    return t;
}

/**
 * Calculate the first derivative of a cubic Bezier curve at parameter t
 */
function getBezierDerivative(curve: CubicBezier, t: number): Vec2 {
    const [p0, p1, p2, p3] = curve;
    const u = 1 - t;

    // First derivative of cubic Bezier:
    // B'(t) = 3(1-t)²(P1-P0) + 6(1-t)(t)(P2-P1) + 3t²(P3-P2)

    // 3(1-t)²(P1-P0)
    const term1 = p1.sub(p0).scale(3 * u * u);

    // 6(1-t)(t)(P2-P1)
    const term2 = p2.sub(p1).scale(6 * u * t);

    // 3t²(P3-P2)
    const term3 = p3.sub(p2).scale(3 * t * t);

    return term1.add(term2).add(term3);
}

/**
 * Calculate the second derivative of a cubic Bezier curve at parameter t
 */
function getBezierSecondDerivative(curve: CubicBezier, t: number): Vec2 {
    const [p0, p1, p2, p3] = curve;

    // Second derivative of cubic Bezier:
    // B''(t) = 6(1-t)(P2-2P1+P0) + 6t(P3-2P2+P1)

    // 6(1-t)(P2-2P1+P0)
    const term1 = p2.sub(p1.scale(2)).add(p0).scale(6 * (1 - t));

    // 6t(P3-2P2+P1)
    const term2 = p3.sub(p2.scale(2)).add(p1).scale(6 * t);

    return term1.add(term2);
}
