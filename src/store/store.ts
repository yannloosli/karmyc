import { configureStore, combineReducers } from '@reduxjs/toolkit'
import componentsReducer from './slices/componentsSlice'
import customComponentsReducer from './slices/customComponentsSlice'
import presetsReducer from './slices/presetsSlice'
import appReducer from './slices/appSlice'
import undoable from 'redux-undo'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import storageSession from 'redux-persist/lib/storage/session'
import { presetsMiddleware } from './middleware/presetsMiddleware'
import filterActions from '../utils/undo'

// État initial pour customComponents
const customComponentsInitialState = {
    newTheme: {
        brand: 'cyan',
        primaryColor: 'blue.400',
        textColor: 'gray.900',
        bgColor: 'blackAlpha.100',
        paperColor: 'whiteAlpha.900',
        borderColor: 'gray.200',
        headingFontFamily: 'roboto',
        bodyFontFamily: 'roboto',
        components: {},
    },
    components: {},
    selectedCustomId: null,
}

// Configuration pour les données volumineuses
const componentsPersistConfig = {
    key: 'components',
    storage: storage,
    blacklist: ['hoveredId', 'selectedId', 'sortHoveredId', 'sortPosition'],
    version: 1,
    stateReconciler: (inboundState: any, originalState: any) => {
        // Si pas d'état entrant, utiliser l'état initial
        if (!inboundState?.present) {
            return {
                ...originalState,
                present: {
                    components: {
                        root: {
                            id: 'root',
                            type: 'root',
                            props: {},
                            children: [],
                            parent: null,
                            componentName: 'Root'
                        }
                    },
                    selectedId: 'root',
                    hoveredId: null,
                    rootComponents: [],
                    sortHoveredId: undefined,
                    sortPosition: undefined
                },
                past: [],
                future: []
            }
        }
        return {
            ...originalState,
            ...inboundState,
            present: {
                ...originalState.present,
                ...inboundState.present,
                components: {
                    ...originalState.present.components,
                    ...inboundState.present.components
                }
            }
        }
    }
}

// Configuration pour les données essentielles
const customComponentsPersistConfig = {
    key: 'customComponents',
    storage,
    version: 1,
    stateReconciler: (inboundState: any, originalState: any) => {
        // Si pas d'état entrant, utiliser l'état initial
        if (!inboundState?.present) {
            return {
                ...originalState,
                present: customComponentsInitialState,
                past: [],
                future: []
            }
        }
        return {
            ...originalState,
            ...inboundState,
            present: {
                ...originalState.present,
                ...inboundState.present,
                components: {
                    ...originalState.present.components,
                    ...inboundState.present.components
                },
                newTheme: {
                    ...customComponentsInitialState.newTheme,
                    ...inboundState.present.newTheme
                }
            }
        }
    }
}

// Configuration pour app
const appPersistConfig = {
    key: 'app',
    storage,
    whitelist: ['editorWidth', 'theme'],
    version: 1,
    stateReconciler: (inboundState: any, originalState: any) => {
        // Si pas d'état entrant, utiliser l'état initial
        if (!inboundState?.present) {
            return {
                ...originalState,
                present: {
                    editorWidth: '100%',
                    showLayout: true,
                    showLoader: false,
                    inputTextFocused: false,
                    overlay: { 
                        rect: {
                            x: 0,
                            y: 0,
                            width: 0,
                            height: 0,
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0
                        }, 
                        id: '', 
                        type: '' 
                    },
                    theme: 'light',
                    isLoading: false
                },
                past: [],
                future: []
            }
        }
        return {
            ...originalState,
            ...inboundState,
            present: {
                ...originalState.present,
                ...inboundState.present
            }
        }
    }
}

// Configuration pour les presets
const presetsPersistConfig = {
    key: 'presets',
    storage,
    version: 1,
}

// Créer les reducers persistés
const persistedComponentsReducer = persistReducer(
    componentsPersistConfig,
    undoable(componentsReducer, { 
        limit: 25,
        filter: filterActions
    })
)

const persistedCustomComponentsReducer = persistReducer(
    customComponentsPersistConfig,
    undoable(customComponentsReducer, { 
        limit: 25,
        filter: filterActions
    })
)

const persistedPresetsReducer = persistReducer(
    presetsPersistConfig,
    presetsReducer
)

const persistedAppReducer = persistReducer(
    appPersistConfig,
    undoable(appReducer, { 
        limit: 25,
        filter: filterActions
    })
)

// Combiner les reducers
const rootReducer = combineReducers({
    components: persistedComponentsReducer,
    customComponents: persistedCustomComponentsReducer,
    presets: persistedPresetsReducer,
    app: persistedAppReducer,
})

// Configurer le store
const store = configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
            },
            immutableCheck: { warnAfter: 200 },
        }).concat(presetsMiddleware),
    devTools: process.env.NODE_ENV !== 'production',
})

// Créer le persistor
export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export { store }
export default store
