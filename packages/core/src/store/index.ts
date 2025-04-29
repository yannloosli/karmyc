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
import {
    FLUSH,
    PAUSE,
    PERSIST,
    PURGE,
    REGISTER,
    REHYDRATE
} from 'redux-persist';

import {
    diffMiddleware,
    stateMiddleware
} from './middleware';

// Import reducers
import { errorMiddleware } from './errorHandling';
import areaReducer, { areaSlice } from './slices/areaSlice';
import { closeContextMenu, contextMenuReducer, openContextMenu } from './slices/contextMenuSlice';
import diffReducer from './slices/diffSlice';
import notificationReducer from './slices/notificationSlice';
import spaceReducer from './slices/spaceSlice';
import stateReducer from './slices/stateSlice';
import toolbarReducer from './slices/toolbarSlice';

// Persistence configuration (COMMENTÉE POUR DÉSACTIVER)
/*
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['toolbar', 'state', 'area', 'space'], 
    blacklist: ['undoable', 'diff'], 
};
*/

// Combine reducers
const rootReducer = combineReducers({
    area: areaReducer,
    contextMenu: contextMenuReducer,
    notification: notificationReducer,
    diff: diffReducer,
    state: stateReducer,
    space: spaceReducer,
    toolbar: toolbarReducer
});

// COMMENTÉE : const persistedReducer = persistReducer(persistConfig, rootReducer);

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
    // Utiliser rootReducer directement au lieu de persistedReducer
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) => {
        const middleware = getDefaultMiddleware({
            serializableCheck: {
                // Ignore these action types in serializableCheck
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
            immutableCheck: { warnAfter: 100 }, // Augmenter le seuil pour l'avertissement
        }).concat(
            errorMiddleware,
            diffMiddleware,
            stateMiddleware,
            areaCleanupMiddleware
        );
        // Utilisation de "any" pour contourner l'erreur de typage
        return middleware as any;
    },
    devTools: import.meta.env.DEV // Utiliser import.meta.env.DEV au lieu de process.env
});

// Export selectors
export * from './selectors';

// Export area slice actions
export {
    addArea, areaSlice, removeArea,
    setActiveArea, updateArea
} from './slices/areaSlice';

// Export space slice actions 
export {
    addDrawingLineToSpace, addSpace, removeSpace, setActiveSpace, setDrawingLinesForSpace,
    setDrawingStrokeWidthForSpace, spaceSlice, updateSpace, updateSpaceGenericSharedState
} from './slices/spaceSlice';

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
