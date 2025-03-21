# Hooks

Ce dossier contient les hooks React personnalisés qui permettent d'interagir avec le store Redux et les fonctionnalités du système de layout.

## Structure

```
hooks/
├── useArea.ts                    # Hook pour la gestion des zones
├── useActions.ts                 # Hook pour l'accès aux actions
├── useHistory.ts                 # Hook pour l'historique (undo/redo)
├── useContextMenu.ts             # Hook pour les menus contextuels
├── usePerformance.ts             # Hook pour l'optimisation des performances
├── useInitialize.ts              # Hook pour l'initialisation
├── useUndoable.ts                # Hook pour les actions annulables
├── useRegisterAction.ts          # Hook pour l'enregistrement d'actions
├── useRegisterAreaType.ts        # Hook pour l'enregistrement de types de zones
├── useRegisterContextMenuAction.ts # Hook pour l'enregistrement d'actions de menu
└── useRegisterActionValidator.ts  # Hook pour la validation des actions
```

## Hooks Principaux

### useArea
Hook pour gérer les zones interactives. Fournit des fonctions pour manipuler les zones et accéder à leur état.

```tsx
const { areas, activeArea, addNewArea, deleteArea } = useArea();
```

### useActions
Hook pour accéder et exécuter les actions enregistrées.

```tsx
const { executeAction, registerAction } = useActions();
```

## Utilisation

```tsx
import { useArea, useActions } from '@/hooks';

function MyComponent() {
  const { areas, addNewArea } = useArea();
  const { executeAction } = useActions();

  // Utilisation des hooks...
}
```

## Bonnes Pratiques

1. **Performance** : Utiliser useMemo et useCallback pour les fonctions et valeurs dérivées
2. **Dépendances** : Déclarer toutes les dépendances dans les tableaux de dépendances
3. **Tests** : Tester les hooks avec @testing-library/react-hooks
4. **Documentation** : Documenter les paramètres et les valeurs de retour
5. **Erreurs** : Gérer les cas d'erreur et les états de chargement

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouveaux hooks
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les hooks, consulter la documentation technique dans le dossier `docs/`. 
