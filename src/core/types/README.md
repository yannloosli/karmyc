# Types Core

Ce dossier contient les définitions de types TypeScript utilisées dans tout le module core. Ces types définissent la structure des données et les interfaces publiques.

## Structure

```
types/
├── core.ts             # Types fondamentaux du core
├── actions.ts          # Types liés aux actions
├── area.ts            # Types liés aux zones
├── project.ts         # Types liés aux projets
├── state.ts           # Types liés aux états
├── toolbar.ts         # Types liés à la barre d'outils
└── internal.ts        # Types internes (non exportés)
```

## Types Principaux

### Types de Base

```typescript
// Types fondamentaux
export interface IArea {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
}

export interface IProject {
  id: string;
  name: string;
  areas: IArea[];
  createdAt: string;
  updatedAt: string;
}

// Types d'actions
export interface IAction {
  type: string;
  payload: any;
  meta?: {
    timestamp: number;
    userId?: string;
  };
}
```

### Types d'État

```typescript
// Types d'état
export interface IState {
  areas: IArea[];
  activeAreaId: string | null;
  projects: IProject[];
  currentProjectId: string | null;
}

// Types de transition
export interface IStateTransition {
  from: string;
  to: string;
  data?: any;
}
```

## Utilisation

```typescript
import { IArea, IProject, IAction } from '@core/types';

// Utilisation dans un composant
function AreaComponent({ area }: { area: IArea }) {
  // ...
}

// Utilisation dans un hook
function useProject(): IProject | null {
  // ...
}

// Utilisation dans une action
function createAction(payload: any): IAction {
  return {
    type: 'MY_ACTION',
    payload,
    meta: {
      timestamp: Date.now()
    }
  };
}
```

## Bonnes Pratiques

1. **Nommage** : Utiliser des préfixes clairs (I pour les interfaces, T pour les types)
2. **Documentation** : Documenter chaque type avec JSDoc
3. **Immutabilité** : Préférer les types readonly quand possible
4. **Validation** : Utiliser des types stricts pour la validation
5. **Organisation** : Regrouper les types par domaine

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouveaux types
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les types, consulter la documentation technique dans le dossier `docs/`. 
