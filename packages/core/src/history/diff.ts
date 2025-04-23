import { AnyAction } from '@reduxjs/toolkit';
import { THistoryChange, THistoryDiff } from '../types/history';

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
 * Applies a difference to a state
 */
export function applyDiff(
    state: Record<string, any>,
    diff: THistoryDiff
): Record<string, any> {
    const newState = { ...state };

    diff.changes.forEach(change => {
        let current = newState;
        for (let i = 0; i < change.path.length - 1; i++) {
            const key = change.path[i];
            if (!(key in current)) {
                current[key] = {};
            }
            current = current[key];
        }
        const lastKey = change.path[change.path.length - 1];
        current[lastKey] = change.oldValue;
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
