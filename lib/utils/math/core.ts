/**
 * Basic mathematical functions
 */

/**
 * Linear interpolation between two values
 */
export const interpolate = (a: number, b: number, t: number) => a * (1 - t) + b * t;

/**
 * Limit a value to a given range
 */
export const capToRange = (low: number, high: number, value: number) =>
    Math.min(high, Math.max(low, value));

/**
 * Checks if a value is within a given margin of another value
 */
export const valueWithinMargin = (value: number, at: number, margin: number): boolean => {
    return value >= at - margin && value <= at + margin;
};

/**
 * Checks if a value is within a given range
 */
export const valueWithinRange = (value: number, min: number, max: number): boolean => {
    return value >= min && value <= max;
};

/**
 * Converts a value from one range to another
 */
export const translateToRange = (
    value: number,
    rangeMin: number,
    rangeMax: number,
    viewportWidth: number,
) => {
    const diff = rangeMax - rangeMin;
    const cutoff = rangeMax - diff;

    return interpolate(0, viewportWidth, (value - cutoff) / diff);
};

/**
 * Calculates the distance between a transformed value and another value
 */
export const distanceFromTranslatedX = (
    a: number,
    b: number,
    translate: (value: number) => number,
): number => {
    return Math.abs(translate(a) - translate(b));
};

/**
 * Converts an angle in radians to its equivalent positive value
 */
export const positiveAngleRadians = (angle: number) => {
    if (angle >= 0) {
        return angle;
    }
    return Math.PI * 2 - Math.abs(angle);
}; 
