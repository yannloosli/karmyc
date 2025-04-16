/**
 * Core module Redux store
 * 
 * This file is responsible for:
 * 1. Redux store configuration with Redux Toolkit
 * 2. Middleware integration (history, persistence, actions)
 * 3. Persistence configuration with redux-persist
 * 4. Export of types and store
 * 
 * @see docs/StoreReduxDesign.md - Section 3.1 Store Configuration
 */

// The store will be implemented and exported here as the system
// implementation progresses

import { configureStore, Middleware } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { actionRegistry } from '../actions';
import { historyPlugin } from '../actions/plugins/history';
import {
    diffMiddleware,
    historyMiddleware,
    stateMiddleware
} from './middleware';

// Import reducers
import { errorMiddleware } from './errorHandling';
import areaReducer, { areaSlice } from './slices/areaSlice';
import { closeContextMenu, contextMenuReducer, openContextMenu } from './slices/contextMenuSlice';
import diffReducer from './slices/diffSlice';
import historyReducer from './slices/historySlice';
import notificationReducer from './slices/notificationSlice';
import stateReducer from './slices/stateSlice';
import toolbarReducer from './slices/toolbarSlice';

// Persistence configuration
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['toolbar', 'state', 'area'], // Add 'area' to persist layouts and areas
    blacklist: ['undoable', 'diff'], // Don't persist undo/redo history and diffs
};

// Combine reducers
const rootReducer = combineReducers({
    area: areaReducer,
    history: historyReducer,
    toolbar: toolbarReducer,
    diff: diffReducer,
    state: stateReducer,
    contextMenu: contextMenuReducer,
    notification: notificationReducer
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

// Define the RootState type based on the rootReducer
export type RootState = ReturnType<typeof rootReducer>;

// Create middleware for periodic state cleanup
const areaCleanupMiddleware: Middleware = api => {
    // Define cleanup interval (every 60 seconds)
    const CLEANUP_INTERVAL = 60 * 1000;

    // Flag to track if cleanup is in progress
    let cleanupRunning = false;

    // Cleanup function
    const performCleanup = () => {
        if (cleanupRunning) return;

        try {
            cleanupRunning = true;

            // Check if cleanup is needed
            const state = api.getState().area;

            // Check for disconnected areas
            const rootId = state.rootId;
            if (rootId && state.layout[rootId]) {
                api.dispatch(areaSlice.actions.cleanState());
            }
        } catch (e) {
            console.error("Error during periodic area cleanup:", e);
        } finally {
            cleanupRunning = false;
        }
    };

    // Start periodic cleanup
    const interval = setInterval(performCleanup, CLEANUP_INTERVAL);

    // Clear interval if store is destroyed
    window.addEventListener('beforeunload', () => {
        clearInterval(interval);
    });

    return next => action => {
        // Continue middleware chain
        return next(action);
    };
};

// Create store with all middlewares
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) => {
        const middleware = getDefaultMiddleware({
            serializableCheck: false,
        }).concat(
            errorMiddleware,
            diffMiddleware,
            stateMiddleware,
            historyMiddleware,
            areaCleanupMiddleware
        );
        // Utilisation de "any" pour contourner l'erreur de typage
        return middleware as any;
    },
    devTools: process.env.NODE_ENV !== 'production'
});

// Define AppDispatch type based on the store
export type AppDispatch = typeof store.dispatch;

// Make store globally accessible for keyboard shortcuts
if (typeof window !== 'undefined') {
    (window as any).store = store;
}

// Register default plugins
actionRegistry.registerPlugin(historyPlugin);

// Export selectors
export * from './selectors';

// Export area slice actions
export {
    addArea, areaSlice, removeArea,
    setActiveArea, updateArea
} from './slices/areaSlice';

// Export context menu actions
export { closeContextMenu, openContextMenu };

// Re-export actions from other slices individually to avoid naming conflicts
// Diff slice exports
export {
    diffSlice
} from './slices/diffSlice';

// State slice exports
export {
    stateSlice
} from './slices/stateSlice';

// Toolbar slice exports
export {
    toolbarSlice
} from './slices/toolbarSlice';

// Export error handler
export { ErrorHandler, errorUtils } from './errorHandling';
