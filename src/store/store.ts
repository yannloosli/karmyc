import { configureStore, combineReducers } from '@reduxjs/toolkit'
import componentsReducer from './slices/componentsSlice'
import customComponentsReducer from './slices/customComponentsSlice'
import appReducer from './slices/appSlice'
import undoable from 'redux-undo'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import storageSession from 'redux-persist/lib/storage/session'

// État initial pour customComponents
const customComponentsInitialState = {
    newTheme: {
        brand: {},
        components: {},
    },
    components: {},
}

// Configuration pour les données volumineuses
const componentsPersistConfig = {
    key: 'components',
    storage: storageSession,
    blacklist: ['present.hoveredId', 'present.selectedId', 'past', 'future'],
    version: 1,
}

// Configuration pour les données essentielles
const customComponentsPersistConfig = {
    key: 'customComponents',
    storage,
    blacklist: ['past', 'future'],
    version: 1,
    stateReconciler: (inboundState, originalState) => ({
        ...originalState,
        ...inboundState,
        present: {
            ...originalState.present,
            ...inboundState.present,
            ...customComponentsInitialState,
        },
    }),
}

// Configuration pour app avec editorWidth explicitement inclus
const appPersistConfig = {
    key: 'app',
    storage,
    whitelist: ['editorWidth', 'theme'], // Explicitement lister les champs à persister
    version: 1,
}

// Créer les reducers persistés
const persistedComponentsReducer = persistReducer(
    componentsPersistConfig,
    undoable(componentsReducer, { limit: 5 })
)

const persistedCustomComponentsReducer = persistReducer(
    customComponentsPersistConfig,
    undoable(customComponentsReducer, { limit: 5 })
)

const persistedAppReducer = persistReducer(
    appPersistConfig,
    undoable(appReducer, { limit: 5 })
)

// Combiner les reducers
const rootReducer = combineReducers({
    components: persistedComponentsReducer,
    customComponents: persistedCustomComponentsReducer,
    app: persistedAppReducer,
})

// Configurer le store
const store = configureStore({
    reducer: rootReducer,
    preloadedState: {
        customComponents: {
            present: customComponentsInitialState,
        },
        app: {
            present: {
                editorWidth: '100%',
                showLayout: false,
                showLoader: false,
                inputTextFocused: false,
                overlay: { rect: new DOMRect(), id: '', type: '' },
                theme: 'light',
                isLoading: false
            },
            past: [],
            future: [],
            _persist: { version: 1, rehydrated: true }
        },
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
            immutableCheck: { warnAfter: 200 },
        }),
    devTools: process.env.NODE_ENV !== 'production',
})

// Créer le persistor
export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export { store }
