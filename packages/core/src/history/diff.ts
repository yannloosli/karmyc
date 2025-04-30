import { AnyAction } from '@reduxjs/toolkit';

// Export the type
export interface THistoryChange {
    path: string[];
    oldValue: any;
    newValue: any;
}

// Export the type
export interface THistoryDiff {
    timestamp: number;
    actionType: string;
    changes: THistoryChange[];
}

/**
 * Generates a difference between two states
 */
export function generateDiff(
    prevState: Record<string, any>,
    nextState: Record<string, any>,
    action: AnyAction
): THistoryDiff {
    const diff: THistoryDiff = {
        timestamp: Date.now(),
        actionType: action.type,
        changes: [],
    };

    // Recursive function to generate differences with paths
    function generateChanges(
        prev: any,
        next: any,
        currentPath: string[] = []
    ): THistoryChange[] {
        const changes: THistoryChange[] = [];

        if (typeof prev !== typeof next ||
            (typeof prev === 'object' && prev !== null && next !== null)) {
            if (Array.isArray(prev) && Array.isArray(next)) {
                // Array handling
                const maxLength = Math.max(prev.length, next.length);
                for (let i = 0; i < maxLength; i++) {
                    if (i >= prev.length || i >= next.length) {
                        changes.push({
                            path: [...currentPath, i.toString()],
                            oldValue: i >= prev.length ? undefined : prev[i],
                            newValue: i >= next.length ? undefined : next[i],
                        });
                    } else {
                        changes.push(...generateChanges(prev[i], next[i], [...currentPath, i.toString()]));
                    }
                }
            } else if (typeof prev === 'object' && prev !== null && next !== null) {
                // Object handling
                const allKeys = new Set([...Object.keys(prev), ...Object.keys(next)]);
                for (const key of allKeys) {
                    if (!(key in prev) || !(key in next)) {
                        changes.push({
                            path: [...currentPath, key],
                            oldValue: key in prev ? prev[key] : undefined,
                            newValue: key in next ? next[key] : undefined,
                        });
                    } else {
                        changes.push(...generateChanges(prev[key], next[key], [...currentPath, key]));
                    }
                }
            } else {
                // Primitive values
                changes.push({
                    path: currentPath,
                    oldValue: prev,
                    newValue: next,
                });
            }
        }

        return changes;
    }

    diff.changes = generateChanges(prevState, nextState);
    return diff;
}

/**
 * Applies a difference to a state. 
 * NOTE: This function assumes the diff restores the state represented by `oldValue`.
 * It might need deep cloning depending on usage, but we assume simple cases for now.
 */
export function applyDiff(
    state: Record<string, any>,
    diff: THistoryDiff
): Record<string, any> {
    // Perform a shallow clone initially. Deeper clones might be needed if objects/arrays are shared.
    const newState = { ...state };

    diff.changes.forEach(change => {
        let current: any = newState;
        const path = change.path;

        // Navigate the path to the parent object/array
        for (let i = 0; i < path.length - 1; i++) {
            const key = path[i];
            const nextKey = path[i + 1];
            const nextKeyIsIndex = !isNaN(parseInt(nextKey, 10));

            // Create path segments if they don't exist
            if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
                // Create an array if the next key is an index, otherwise an object
                current[key] = nextKeyIsIndex ? [] : {};
            }
            current = current[key];
        }

        const lastKey = path[path.length - 1];
        const oldValue = change.oldValue;

        // Simple deep clone for objects/arrays before assigning
        const valueToApply = (typeof oldValue === 'object' && oldValue !== null)
            ? JSON.parse(JSON.stringify(oldValue))
            : oldValue;

        // Apply the potentially cloned oldValue at the final path segment
        if (Array.isArray(current) && !isNaN(parseInt(lastKey, 10))) {
            const index = parseInt(lastKey, 10);
            if (valueToApply === undefined) { // Check the potentially cloned value
                if (index >= 0 && index < current.length) {
                    current.splice(index, 1);
                }
            } else {
                current[index] = valueToApply;
            }
        } else {
            if (valueToApply === undefined) { // Check the potentially cloned value
                delete current[lastKey];
            } else {
                current[lastKey] = valueToApply;
            }
        }
    });

    return newState;
}

/**
 * Inverts a difference
 */
export function invertDiff(diff: THistoryDiff): THistoryDiff {
    return {
        ...diff,
        changes: diff.changes.map(change => ({
            ...change,
            oldValue: change.newValue,
            newValue: change.oldValue,
        })),
    };
} 
