# Store Core

Ce dossier contient la gestion de l'état global de l'application utilisant Redux Toolkit. Il fournit une architecture modulaire et extensible pour la gestion des données.

## Structure

```
store/
├── slices/              # Slices Redux pour chaque domaine
│   ├── area.ts         # Gestion des zones
│   ├── contextMenu.ts  # Gestion des menus contextuels
│   ├── state.ts        # Gestion des états
│   ├── diff.ts         # Gestion des différences
│   └── toolbar.ts      # Gestion de la barre d'outils
├── middleware/         # Middleware Redux personnalisés
│   ├── history.ts      # Middleware pour l'historique
│   ├── actions.ts      # Middleware pour les actions
│   └── persistence.ts  # Middleware pour la persistance
├── enhancers/         # Enhancers Redux
├── serialization/     # Logique de sérialisation
├── selectors/        # Sélecteurs optimisés
├── registries/       # Registres d'actions et de types
└── __tests__/        # Tests unitaires
```

## Slices Principaux

### areaSlice
Gère l'état des zones interactives.

```typescript
const initialState = {
  areas: [],
  activeAreaId: null
};

const areaSlice = createSlice({
  name: 'area',
  initialState,
  reducers: {
    addArea: (state, action) => { /* ... */ },
    removeArea: (state, action) => { /* ... */ },
    updateArea: (state, action) => { /* ... */ }
  }
});
```

## Middleware

### history
Gère l'historique des actions pour undo/redo.

### actions
Gère l'exécution des actions complexes.

### persistence
Gère la persistance de l'état.

## Utilisation

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { createCoreStore } from './store';

const store = createCoreStore({
  // Configuration personnalisée
});

// Utilisation dans un composant
import { useDispatch, useSelector } from 'react-redux';
import { addArea, selectAllAreas } from './store/slices/areaSlice';

function MyComponent() {
  const dispatch = useDispatch();
  const areas = useSelector(selectAllAreas);

  const handleAddArea = () => {
    dispatch(addArea({ /* ... */ }));
  };
}
```

## Bonnes Pratiques

1. **Immutabilité** : Toujours retourner de nouveaux objets d'état
2. **Sélecteurs** : Utiliser createSelector pour les sélecteurs complexes
3. **Actions** : Utiliser createAsyncThunk pour les actions asynchrones
4. **Tests** : Tester les reducers et les actions
5. **Performance** : Optimiser les sélecteurs avec memoization

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouveaux reducers et actions
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant le store, consulter la documentation technique dans le dossier `docs/`. 
