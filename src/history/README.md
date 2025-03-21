# Historique

Ce dossier contient le système de gestion de l'historique qui permet d'annuler et de rétablir les actions dans le système de layout.

## Structure

```
history/
├── index.ts             # Point d'entrée et exports publics
├── undoable.ts          # Intégration avec redux-undo
├── diff.ts              # Génération de différences d'état
├── selectors.ts         # Sélecteurs pour l'historique
└── __tests__/          # Tests unitaires
```

## Fonctionnalités

### Gestion de l'Historique

```typescript
import { undoable } from './undoable';

// Configuration du middleware d'historique
const historyMiddleware = undoable({
  limit: 50,                    // Nombre maximum d'étapes dans l'historique
  filter: (action) => {         // Filtre des actions à ne pas historiser
    return !action.meta?.noHistory;
  }
});
```

### Génération de Différences

```typescript
import { generateDiff } from './diff';

// Génération d'une différence entre deux états
const diff = generateDiff(previousState, currentState, {
  ignorePaths: ['timestamp'],    // Chemins à ignorer
  deep: true                     // Comparaison profonde
});
```

## Utilisation

```typescript
import { useHistory } from '@/hooks';

function MyComponent() {
  const { undo, redo, canUndo, canRedo } = useHistory();

  return (
    <div>
      <button onClick={undo} disabled={!canUndo}>
        Annuler
      </button>
      <button onClick={redo} disabled={!canRedo}>
        Rétablir
      </button>
    </div>
  );
}
```

## Configuration

### Options de l'Historique

```typescript
interface IHistoryOptions {
  /** Nombre maximum d'étapes dans l'historique */
  limit?: number;
  /** Filtre pour exclure certaines actions */
  filter?: (action: IAction) => boolean;
  /** Configuration de la persistance */
  persistence?: {
    enabled: boolean;
    storageKey: string;
  };
}
```

## Bonnes Pratiques

1. **Limitation** : Limiter la taille de l'historique pour éviter les problèmes de mémoire
2. **Filtrage** : Filtrer les actions non pertinentes
3. **Performance** : Optimiser la génération des différences
4. **Tests** : Tester les cas limites (limite atteinte, actions invalides)
5. **Documentation** : Documenter les actions qui affectent l'historique

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouvelles fonctionnalités
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant l'historique, consulter la documentation technique dans le dossier `docs/`. 
