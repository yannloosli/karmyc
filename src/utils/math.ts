/**
 * Linear interpolation between two values
 */
export const interpolate = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/**
 * Limit a value to a given range
 */
export const capToRange = (low: number, high: number, value: number) =>
    Math.min(high, Math.max(low, value));
