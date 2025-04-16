/**
 * Utilities for generating unique identifiers
 */

/**
 * Generates a unique identifier based on timestamp and random number
 */
export function generateUniqueId(): string {
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generates a unique numeric ID for an object map
 */
export function generateNumericId(map: Record<string, any>): string {
    const keys = Object.keys(map)
        .map(x => parseInt(x))
        .filter(x => !isNaN(x));

    const max = keys.length > 0 ? Math.max(...keys) : 0;
    return (max + 1).toString();
} 
