# Constants Core

Ce dossier contient les constantes et configurations globales utilisées dans tout le module core.

## Structure

```
constants/
├── index.ts             # Export des constantes publiques
├── area.ts             # Constantes liées aux zones
├── actions.ts          # Constantes liées aux actions
├── validation.ts       # Constantes de validation
└── theme.ts           # Constantes de thème
```

## Constantes Principales

### Zones

```typescript
// src/constants/area.ts
export const AREA_CONSTANTS = {
  MIN_WIDTH: 50,
  MIN_HEIGHT: 50,
  MAX_WIDTH: 2000,
  MAX_HEIGHT: 2000,
  DEFAULT_WIDTH: 100,
  DEFAULT_HEIGHT: 100,
  GRID_SIZE: 10,
  SNAP_THRESHOLD: 5
} as const;
```

### Actions

```typescript
// src/constants/actions.ts
export const ACTION_TYPES = {
  AREA: {
    ADD: 'area/add',
    REMOVE: 'area/remove',
    UPDATE: 'area/update',
    SELECT: 'area/select'
  },=
} as const;
```

## Utilisation

```typescript
import { AREA_CONSTANTS, PROJECT_CONSTANTS, ACTION_TYPES } from '@/constants';

function MyComponent() {
  // Utilisation des constantes de zone
  const handleResize = (width: number, height: number) => {
    if (width < AREA_CONSTANTS.MIN_WIDTH) {
      width = AREA_CONSTANTS.MIN_WIDTH;
    }
    if (height < AREA_CONSTANTS.MIN_HEIGHT) {
      height = AREA_CONSTANTS.MIN_HEIGHT;
    }
  };

  // Utilisation des constantes de projet
  const handleSave = () => {
    if (areas.length > PROJECT_CONSTANTS.MAX_AREAS) {
      throw new Error('Trop de zones dans le projet');
    }
  };

  // Utilisation des types d'actions
  const handleAddArea = () => {
    dispatch({ type: ACTION_TYPES.AREA.ADD, payload: newArea });
  };
}
```

## Bonnes Pratiques

1. **Immutabilité** : Utiliser `as const` pour les constantes
2. **Organisation** : Regrouper les constantes par domaine
3. **Nommage** : Utiliser des noms descriptifs et en majuscules
4. **Documentation** : Documenter les constantes complexes
5. **Validation** : Utiliser les constantes pour la validation

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouvelles constantes
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les constantes, consulter la documentation technique dans le dossier `docs/`. 
