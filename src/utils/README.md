# Utils Core

Ce dossier contient les fonctions utilitaires réutilisables dans tout le module core.

## Structure

```
utils/
├── history.ts           # Utilitaires pour l'historique
├── diff.ts             # Utilitaires pour les différences
├── validation.ts       # Utilitaires de validation
├── serialization.ts    # Utilitaires de sérialisation
├── performance.ts      # Utilitaires de performance
└── __tests__/         # Tests unitaires
```

## Fonctions Utilitaires

### Validation

```typescript
import { validateArea, validateProject } from './validation';

// Validation d'une zone
const isValidArea = validateArea({
  id: 'area1',
  x: 0,
  y: 0,
  width: 100,
  height: 100
});

// Validation d'un projet
const isValidProject = validateProject({
  id: 'project1',
  name: 'Mon Projet',
  areas: []
});
```

### Sérialisation

```typescript
import { serialize, deserialize } from './serialization';

// Sérialisation d'un état
const serializedState = serialize(state, {
  excludeKeys: ['timestamp'],
  compress: true
});

// Désérialisation d'un état
const state = deserialize(serializedState);
```

### Performance

```typescript
import { debounce, throttle } from './performance';

// Debounce d'une fonction
const debouncedUpdate = debounce((value) => {
  // Mise à jour coûteuse
}, 300);

// Throttle d'une fonction
const throttledScroll = throttle((event) => {
  // Gestion du scroll
}, 100);
```

## Utilisation

```typescript
import { validateArea, serialize, debounce } from '@core/utils';

function MyComponent() {
  // Validation
  const handleAreaUpdate = (area) => {
    if (validateArea(area)) {
      // Mise à jour valide
    }
  };

  // Sérialisation
  const handleSave = () => {
    const serialized = serialize(currentState);
    localStorage.setItem('state', serialized);
  };

  // Performance
  const debouncedSearch = debounce((query) => {
    // Recherche coûteuse
  }, 300);
}
```

## Bonnes Pratiques

1. **Performance** : Optimiser les fonctions utilitaires
2. **Tests** : Maintenir une couverture de tests élevée
3. **Documentation** : Documenter les paramètres et les cas d'utilisation
4. **Erreurs** : Gérer proprement les cas d'erreur
5. **Réutilisabilité** : Garder les fonctions génériques et réutilisables

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouvelles fonctions
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les utilitaires, consulter la documentation technique dans le dossier `docs/`. 
