/**
 * Middleware for state persistence
 * 
 * This middleware is responsible for:
 * 1. Automatically saving the state to local storage
 * 2. Restoring the state when the application starts
 * 3. Managing version conflicts
 * 
 * @see docs/StoreReduxDesign.md - Section 3.1 Store Configuration
 */

import { Middleware } from '@reduxjs/toolkit';

const STORAGE_KEY = 'karmyc-state';
const STATE_VERSION = '1.0.0';

interface PersistedState {
    version: string;
    state: any;
}

export const persistenceMiddleware: Middleware = store => next => action => {
    // Execute the action normally
    const result = next(action);

    // Save the state after each action
    const currentState = store.getState();
    const persistedState: PersistedState = {
        version: STATE_VERSION,
        state: currentState
    };

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
    } catch (error) {
        console.warn('Failed to persist state:', error);
    }

    return result;
};

/**
 * Utility function to restore persisted state
 */
export const restorePersistedState = (): any | null => {
    try {
        const persistedData = localStorage.getItem(STORAGE_KEY);
        if (!persistedData) return null;

        const persistedState: PersistedState = JSON.parse(persistedData);

        // Check version
        if (persistedState.version !== STATE_VERSION) {
            console.warn('State version mismatch, clearing persisted state');
            localStorage.removeItem(STORAGE_KEY);
            return null;
        }

        return persistedState.state;
    } catch (error) {
        console.warn('Failed to restore persisted state:', error);
        return null;
    }
}; 
