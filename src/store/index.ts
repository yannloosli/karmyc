/**
 * Store Redux du module core
 * 
 * Ce fichier est responsable de :
 * 1. La configuration du store Redux avec Redux Toolkit
 * 2. L'intégration des middlewares (historique, persistance, actions)
 * 3. La configuration de la persistance avec redux-persist
 * 4. L'export des types et du store
 * 
 * @see docs/StoreReduxDesign.md - Section 3.1 Configuration du Store
 */

// Le store sera implémenté et exporté ici au fur et à mesure
// de l'implémentation du système 

import { configureStore } from '@reduxjs/toolkit';
import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import { actionRegistry } from '../actions';
import { historyPlugin } from '../actions/plugins/history';
import {
    diffMiddleware,
    stateMiddleware
} from './middleware';

// Import des reducers
import { errorMiddleware } from './errorHandling';
import { registerDefaultKeyboardShortcuts } from './initializers/registerDefaultKeyboardShortcuts';
import areaReducer from './slices/areaSlice';
import { contextMenuReducer } from './slices/contextMenuSlice';
import diffReducer from './slices/diffSlice';
import historyReducer from './slices/historySlice';
import notificationReducer from './slices/notificationSlice';
import stateReducer from './slices/stateSlice';
import toolbarReducer from './slices/toolbarSlice';

// Configuration de la persistance
const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['toolbar', 'state'], // Persister les projets, toolbars et états
    blacklist: ['undoable', 'diff'], // Ne pas persister l'historique undo/redo et les diffs
};

// Combiner les reducers
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

// Créer le store avec tous les middlewares
export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
        }).concat(errorMiddleware, diffMiddleware, stateMiddleware),
    devTools: process.env.NODE_ENV !== 'production'
});

// Enregistrer les plugins par défaut
actionRegistry.registerPlugin(historyPlugin);

// Types pour TypeScript
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Exporter les actions et sélecteurs
export * from './selectors';
export * from './slices/areaSlice';
export * from './slices/contextMenuSlice';
export * from './slices/diffSlice';
export * from './slices/stateSlice';
export * from './slices/toolbarSlice';

// Export du gestionnaire d'erreurs
export { ErrorHandler, errorUtils } from './errorHandling';

// Initialiser les raccourcis clavier
registerDefaultKeyboardShortcuts();

// Exporter une fonction pour réinitialiser les raccourcis clavier
// Peut être utile si des modules externes ajoutent leurs propres raccourcis
export function resetAndRegisterKeyboardShortcuts() {
    registerDefaultKeyboardShortcuts();
}
