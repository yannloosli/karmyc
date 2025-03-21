# Actions Core

Ce dossier contient le système d'actions modulaire qui permet d'enregistrer, valider et exécuter des actions dans l'éditeur d'animation.

## Structure

```
actions/
├── registry.ts           # Registre central des actions
├── types.ts             # Types et interfaces des actions
├── validation.ts        # Système de validation des actions
├── plugins/             # Plugins d'actions
│   ├── area/           # Actions liées aux zones
│   └── toolbar/        # Actions liées à la barre d'outils
└── validators/         # Validateurs d'actions
```

## Système d'Actions

### Registre d'Actions
Le registre central permet d'enregistrer et de gérer toutes les actions disponibles.

```typescript
import { actionRegistry } from './actions/registry';

// Enregistrement d'une action
actionRegistry.register({
  id: 'addArea',
  execute: (payload) => {
    // Logique d'exécution
  },
  validate: (payload) => {
    // Validation
  }
});
```

### Validation
Système de validation pour s'assurer que les actions sont exécutées avec des données valides.

```typescript
import { createActionValidator } from './actions/validation';

const areaValidator = createActionValidator({
  required: ['id', 'x', 'y', 'width', 'height'],
  types: {
    id: 'string',
    x: 'number',
    y: 'number',
    width: 'number',
    height: 'number'
  }
});
```

## Utilisation

```typescript
import { useActions } from '@core/hooks';
import { actionRegistry } from './actions/registry';

function MyComponent() {
  const { executeAction } = useActions();

  const handleAddArea = () => {
    executeAction('addArea', {
      id: 'area1',
      x: 0,
      y: 0,
      width: 100,
      height: 100
    });
  };
}
```

## Plugins

### Plugin Area
Actions spécifiques à la gestion des zones :
- Création de zones
- Modification de zones
- Suppression de zones
- Sélection de zones

### Plugin Toolbar
Actions pour la barre d'outils :
- Activation/désactivation d'outils
- Personnalisation de la barre
- Gestion des raccourcis

## Bonnes Pratiques

1. **Validation** : Toujours valider les données d'entrée
2. **Idempotence** : Les actions doivent être idempotentes
3. **Erreurs** : Gérer proprement les erreurs et les cas limites
4. **Tests** : Tester chaque action et ses cas d'utilisation
5. **Documentation** : Documenter les paramètres et les effets de bord

## Contribution

1. Créer une branche pour votre fonctionnalité
2. Ajouter des tests pour les nouvelles actions
3. Mettre à jour la documentation
4. Soumettre une pull request

## Questions ?

Pour toute question concernant les actions, consulter la documentation technique dans le dossier `docs/`. 
