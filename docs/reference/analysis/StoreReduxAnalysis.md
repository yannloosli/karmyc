# Analyse et Conception du Store Redux

## 1. Analyse de la structure actuelle

### 1.1 Architecture générale

Le système actuel de gestion d'état utilise Redux classique avec une architecture personnalisée pour gérer l'historique des actions et les états. L'architecture est divisée en deux types d'états principaux :

- **ApplicationState** : L'état global de l'application qui inclut l'historique
- **ActionState** : L'état actuel sans l'historique, utilisé pour les opérations courantes

Cette séparation permet une gestion fine de l'historique tout en maintenant des performances optimales pour les opérations qui ne nécessitent pas d'accéder à l'historique.

### 1.2 Composants clés du système actuel

#### 1.2.1 Store Redux

Le store est créé de manière simple avec `createStore` de Redux :

```typescript
// src/state/store.ts
import { createStore, Store } from "redux";
import { createApplicationStateFromActionState } from "~/state/createApplicationStateFromActionState";
import reducers from "~/state/reducers";
import { getSavedActionState } from "~/state/saveState";

let initialState: ApplicationState | undefined;

const savedActionState = getSavedActionState();
if (savedActionState) {
	initialState = createApplicationStateFromActionState(savedActionState);
}

const storeInstance: Store<ApplicationState> = createStore(reducers, initialState);

export const store = storeInstance;
```

#### 1.2.2 Reducers combinés

Les reducers sont combinés dans un fichier central qui définit également les interfaces globales pour `ApplicationState` et `ActionState` :

```typescript
// src/state/reducers.ts (extrait)
declare global {
	interface ApplicationState {
		area: ActionBasedState<AreaReducerState>;
		compositionState: HistoryState<CompositionState>;
		compositionSelectionState: HistoryState<CompositionSelectionState>;
		// ...autres états
	}

	interface ActionState {
		area: AreaReducerState;
		compositionState: CompositionState;
		compositionSelectionState: CompositionSelectionState;
		// ...autres états
	}
}

const reducers = {
	area: createActionBasedReducer(initialAreaState, areaReducer),
	compositionState: createReducerWithHistory(initialCompositionState, compositionReducer),
	// ...autres reducers
};

export default combineReducers<ApplicationState>(reducers);
```

#### 1.2.3 Gestion de l'historique

Le système utilise deux types de wrappers pour les reducers :

1. **ActionBasedReducer** : Pour les états qui ne nécessitent pas d'historique
   ```typescript
   // src/state/history/actionBasedReducer.ts
   export interface ActionBasedState<S> {
     state: S;
     action: null | {
       id: string;
       state: S;
     };
   }
   
   export function createActionBasedReducer<S>(
     initialState: S,
     reducer: (state: S, action: any) => S,
   ) {
     // Implémentation...
   }
   ```

2. **HistoryReducer** : Pour les états qui nécessitent un historique (undo/redo)
   ```typescript
   // src/state/history/historyReducer.ts
   export interface HistoryState<S> {
     type: "normal" | "selection";
     list: Array<{
       state: S;
       name: string;
       modifiedRelated: boolean;
       allowIndexShift: boolean;
       diffs: Diff[];
     }>;
     index: number;
     indexDirection: -1 | 1;
     action: null | {
       id: string;
       state: S;
     };
   }
   
   export function createReducerWithHistory<S>(
     initialState: S,
     reducer: (state: S, action: any) => S,
     options: Options = {},
   ) {
     // Implémentation...
   }
   ```

#### 1.2.4 Actions d'historique

Le système utilise un ensemble d'actions spécifiques pour gérer l'historique :

- `START_ACTION` : Commence une action qui peut être annulée
- `DISPATCH_TO_ACTION` : Envoie une action à l'action en cours
- `DISPATCH_BATCH_TO_ACTION` : Envoie un lot d'actions
- `SUBMIT_ACTION` : Valide l'action en cours et l'ajoute à l'historique
- `CANCEL_ACTION` : Annule l'action en cours
- `MOVE_INDEX` : Change l'index dans l'historique (undo/redo)

### 1.3 Flux de données

Le flux de données dans le système actuel suit ce schéma :

1. Une action est démarrée avec `START_ACTION`
2. Des modifications sont apportées à l'état avec `DISPATCH_TO_ACTION`
3. L'action est validée avec `SUBMIT_ACTION` ou annulée avec `CANCEL_ACTION`
4. L'historique est mis à jour si l'action est validée
5. L'utilisateur peut naviguer dans l'historique avec `MOVE_INDEX`

### 1.4 Forces et faiblesses du système actuel

#### Forces
- Architecture bien pensée pour gérer l'historique des actions
- Séparation claire entre les états avec et sans historique
- Système de différences (diffs) pour visualiser les changements

#### Faiblesses
- Utilisation de Redux classique sans les avantages de Redux-Toolkit
- Boilerplate important pour définir les reducers et les actions
- Pas d'utilisation des fonctionnalités modernes comme createSlice
- Complexité accrue pour les développeurs qui découvrent le code

## 2. Conception proposée avec Redux-Toolkit

### 2.1 Objectifs de la refactorisation

- Simplifier le code en utilisant Redux-Toolkit
- Réduire le boilerplate pour les actions et reducers
- Maintenir les fonctionnalités d'historique et de différences
- Améliorer la maintenabilité et l'extensibilité
- Faciliter l'intégration de nouveaux modules

### 2.2 Structure des dossiers proposée

```
src/
└── core/
    ├── store/
    │   ├── index.ts                  # Point d'entrée du store
    │   ├── rootReducer.ts            # Combinaison de tous les reducers
    │   ├── middleware/               # Middleware personnalisés
    │   │   ├── index.ts
    │   │   └── logger.ts
    │   ├── hooks.ts                  # Hooks personnalisés (useSelector, useDispatch)
    │   └── types.ts                  # Types globaux pour le store
    ├── slices/                       # Slices Redux pour chaque domaine
    │   ├── area/
    │   │   ├── areaSlice.ts
    │   │   └── selectors.ts
    │   ├── contextMenu/
    │   │   ├── contextMenuSlice.ts
    │   │   └── selectors.ts
    │   └── ...
    ├── history/                      # Système d'historique
    │   ├── historyMiddleware.ts      # Middleware pour gérer l'historique
    │   ├── historySlice.ts           # Slice pour l'état de l'historique
    │   ├── undoRedo.ts               # Fonctions pour undo/redo
    │   └── types.ts                  # Types pour l'historique
    └── actions/                      # Système d'actions modulaire
        ├── registry.ts               # Registre des actions
        ├── types.ts                  # Types pour les actions
        └── plugins/                  # Plugins d'actions
```

### 2.3 Conception du store principal

#### 2.3.1 Configuration du store

```typescript
// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from './rootReducer';
import { historyMiddleware } from '../history/historyMiddleware';

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => 
    getDefaultMiddleware({
      serializableCheck: {
        // Ignorer certaines actions non-sérialisables si nécessaire
        ignoredActions: ['history/SUBMIT_ACTION'],
      },
    }).concat(historyMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

#### 2.3.2 Root Reducer

```typescript
// src/store/rootReducer.ts
import { combineReducers } from '@reduxjs/toolkit';
import areaReducer from '../slices/area/areaSlice';
import contextMenuReducer from '../slices/contextMenu/contextMenuSlice';
// Importer d'autres reducers...

export const rootReducer = combineReducers({
  area: areaReducer,
  contextMenu: contextMenuReducer,
  // Autres reducers...
});
```

#### 2.3.3 Hooks personnalisés

```typescript
// src/store/hooks.ts
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from './index';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

// Hook pour accéder à l'état actuel (sans l'historique)
export const useActionState = () => {
  return useAppSelector(state => ({
    area: state.area.present,
    project: state.project.present,
    // etc.
  }));
};
```

### 2.4 Conception des slices

#### 2.4.1 Exemple de slice pour Area

```typescript
// src/slices/area/areaSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AreaReducerState } from '~/area/state/areaReducer';

const initialState: AreaReducerState = {
  // État initial
};

export const areaSlice = createSlice({
  name: 'area',
  initialState,
  reducers: {
    // Actions spécifiques à l'area
    updateArea: (state, action: PayloadAction<Partial<AreaReducerState>>) => {
      return { ...state, ...action.payload };
    },
    // Autres actions...
  },
});

export const { updateArea } = areaSlice.actions;
export default areaSlice.reducer;
```

#### 2.4.2 Sélecteurs optimisés

```typescript
// src/slices/area/selectors.ts
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '../../store';

export const selectArea = (state: RootState) => state.area;

export const selectAreaById = createSelector(
  [selectArea, (_, id: string) => id],
  (area, id) => area.areas.find(a => a.id === id)
);
```

### 2.5 Intégration de redux-undo

Pour gérer l'historique des actions, nous utiliserons redux-undo avec une configuration personnalisée :

```typescript
// src/history/undoableReducer.ts
import undoable, { includeAction } from 'redux-undo';

export function createUndoableReducer(reducer, options = {}) {
  return undoable(reducer, {
    filter: includeAction([
      // Liste des actions qui doivent être enregistrées dans l'historique
      'project/UPDATE_PROJECT',
      'composition/UPDATE_COMPOSITION',
      // etc.
    ]),
    limit: 50, // Limite de l'historique
    ...options,
  });
}
```

### 2.6 Système d'actions modulaire

#### 2.6.1 Registre d'actions

```typescript
// src/actions/registry.ts
import { AnyAction } from '@reduxjs/toolkit';

type ActionHandler = (action: AnyAction) => void;

interface ActionPlugin {
  id: string;
  priority: number;
  handler: ActionHandler;
}

class ActionRegistry {
  private plugins: ActionPlugin[] = [];

  registerPlugin(plugin: ActionPlugin) {
    this.plugins.push(plugin);
    // Trier par priorité
    this.plugins.sort((a, b) => b.priority - a.priority);
  }

  unregisterPlugin(id: string) {
    this.plugins = this.plugins.filter(plugin => plugin.id !== id);
  }

  handleAction(action: AnyAction) {
    for (const plugin of this.plugins) {
      plugin.handler(action);
    }
  }
}

export const actionRegistry = new ActionRegistry();
```

#### 2.6.2 Middleware pour les actions

```typescript
// src/actions/middleware.ts
import { Middleware } from '@reduxjs/toolkit';
import { actionRegistry } from './registry';

export const actionMiddleware: Middleware = store => next => action => {
  // Exécuter l'action normalement
  const result = next(action);
  
  // Notifier les plugins
  actionRegistry.handleAction(action);
  
  return result;
};
```

### 2.7 Stratégie de migration

Pour migrer progressivement du système actuel vers Redux-Toolkit, nous suivrons cette stratégie :

1. Créer la nouvelle structure de dossiers dans `src/core`
2. Implémenter le store Redux-Toolkit en parallèle du store existant
3. Créer un wrapper qui permet d'utiliser les deux stores pendant la transition
4. Migrer progressivement chaque domaine fonctionnel vers les nouveaux slices
5. Une fois tous les domaines migrés, supprimer l'ancien store

#### 2.7.1 Wrapper de compatibilité

```typescript
// src/compatibility/storeWrapper.ts
import { store as oldStore } from '~/state/store';
import { store as newStore } from '../store';

// Fonction pour synchroniser les deux stores pendant la transition
export function syncStores() {
  // Logique de synchronisation...
}

// Hooks de compatibilité
export function useCompatSelector(selector) {
  // Utiliser le nouveau store si le sélecteur est compatible,
  // sinon utiliser l'ancien store
}
```

## 3. Avantages de la nouvelle architecture

### 3.1 Réduction du boilerplate

Redux-Toolkit réduit considérablement la quantité de code nécessaire pour définir les actions et les reducers grâce à `createSlice`.

### 3.2 Meilleure organisation du code

La structure proposée organise le code de manière plus modulaire et maintenable, avec une séparation claire des responsabilités.

### 3.3 Performances améliorées

Redux-Toolkit utilise immer.js pour les mises à jour d'état, ce qui permet d'écrire du code qui semble muter l'état tout en préservant l'immutabilité.

### 3.4 Facilité d'extension

Le système d'actions modulaire et la structure des slices facilitent l'ajout de nouvelles fonctionnalités sans modifier le code existant.

### 3.5 Meilleure expérience de développement

Les hooks personnalisés et les sélecteurs optimisés améliorent l'expérience de développement et réduisent les erreurs potentielles.

## 4. Prochaines étapes

1. Créer la structure de dossiers pour le nouveau store
2. Implémenter le store principal avec Redux-Toolkit
3. Créer un premier slice pour tester l'intégration
4. Mettre en place le système d'historique avec redux-undo
5. Documenter l'API et les exemples d'utilisation 
