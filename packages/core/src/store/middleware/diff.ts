import { AnyAction, Middleware } from '@reduxjs/toolkit';
import { IDiffChange } from '../../types/diff';
import { sendDiffsToSubscribers } from '../diffSubscription';
import { RootState } from '../index';
import { applyDiff, revertDiff } from '../slices/diffSlice';

// Utility function to apply a change
const applyChange = (state: any, change: IDiffChange): void => {
    const { path, type, newValue, oldValue, index } = change;

    // Navigate to the last level of the path
    let current = state;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
        if (!current) return;
    }

    const lastKey = path[path.length - 1];

    switch (type) {
    case 'add':
        if (Array.isArray(current)) {
            if (typeof lastKey === 'number') {
                current.splice(lastKey, 0, newValue);
            } else {
                current.push(newValue);
            }
        } else {
            (current as Record<string, any>)[lastKey] = newValue;
        }
        break;

    case 'remove':
        if (Array.isArray(current)) {
            if (typeof lastKey === 'number') {
                current.splice(lastKey, 1);
            } else {
                const itemIndex = current.indexOf(oldValue);
                if (itemIndex !== -1) {
                    current.splice(itemIndex, 1);
                }
            }
        } else {
            delete (current as Record<string, any>)[lastKey];
        }
        break;

    case 'update':
        (current as Record<string, any>)[lastKey] = newValue;
        break;

    case 'move':
        if (Array.isArray(current) && typeof lastKey === 'number') {
            const item = current.splice(lastKey, 1)[0];
            current.splice(change.newIndex!, 0, item);
        }
        break;

    case 'replace':
        if (Array.isArray(current)) {
            if (typeof lastKey === 'number') {
                current[lastKey] = newValue;
            } else {
                (current as Record<string, any>)[lastKey] = newValue;
            }
        } else {
            (current as Record<string, any>)[lastKey] = newValue;
        }
        break;
    }
};

// Utility function to revert to the previous state
const revertChange = (state: any, change: IDiffChange): void => {
    const { path, type, oldValue, index } = change;

    // Navigate to the last level of the path
    let current = state;
    for (let i = 0; i < path.length - 1; i++) {
        current = current[path[i]];
        if (!current) return;
    }

    const lastKey = path[path.length - 1] as keyof typeof current;

    switch (type) {
    case 'add':
        if (Array.isArray(current)) {
            if (index !== undefined) {
                current.splice(index, 1);
            } else {
                const itemIndex = current.indexOf(change.newValue);
                if (itemIndex !== -1) {
                    current.splice(itemIndex, 1);
                }
            }
        } else {
            delete current[lastKey];
        }
        break;

    case 'remove':
        if (Array.isArray(current)) {
            if (index !== undefined) {
                current.splice(index, 0, oldValue);
            } else {
                current.push(oldValue);
            }
        } else {
            current[lastKey] = oldValue;
        }
        break;

    case 'update':
        current[lastKey] = oldValue;
        break;

    case 'move':
        if (Array.isArray(current) && index !== undefined) {
            const item = current.splice(change.newIndex!, 1)[0];
            current.splice(index, 0, item);
        }
        break;

    case 'replace':
        current[lastKey] = oldValue;
        break;
    }
};

type DiffMiddleware = Middleware<{}, RootState>;

export const diffMiddleware = (store: any) => (next: any) => (action: AnyAction) => {
    // Execute the action normally
    const result = next(action);

    // Handle diff actions
    if (action.type === applyDiff.type) {
        const diff = store.getState().diff.diffs.find((d: { id: string }) => d.id === action.payload);
        if (diff) {
            // Apply diff changes
            diff.changes.forEach((change: IDiffChange) => {
                applyChange(store.getState(), change);
            });

            // Notify subscribers
            sendDiffsToSubscribers(
                store.getState(),
                [diff],
                'forward'
            );
        }
    }

    if (action.type === revertDiff.type) {
        const diff = store.getState().diff.diffs.find((d: { id: string }) => d.id === action.payload);
        if (diff) {
            // Revert to previous values
            diff.changes.forEach((change: IDiffChange) => {
                revertChange(store.getState(), change);
            });

            // Notify subscribers
            sendDiffsToSubscribers(
                store.getState(),
                [diff],
                'backward'
            );
        }
    }

    return result;
}; 
