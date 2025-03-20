# Core Module

Le module Core est le cœur de l'éditeur d'animation. Il fournit une architecture modulaire et extensible pour la gestion des zones, des projets, des actions et de l'état global.

## Structure

```
core/
├── actions/           # Système d'actions modulaire
├── components/        # Composants React réutilisables
├── constants/         # Constantes et configurations
├── history/          # Gestion de l'historique (undo/redo)
├── hooks/            # Hooks React personnalisés
├── providers/        # Providers React pour le contexte
├── store/            # Store Redux et gestion d'état
├── types/            # Types TypeScript
└── utils/            # Fonctions utilitaires
```

## Installation

```bash
npm install @core
# ou
yarn add @core
```

## Utilisation de Base

```typescript
import { CoreProvider, useArea, useProject } from '@core';

function App() {
  return (
    <CoreProvider>
      <MyEditor />
    </CoreProvider>
  );
}

function MyEditor() {
  const { areas, addArea } = useArea();
  const { currentProject } = useProject();

  return (
    <div>
      {/* Interface de l'éditeur */}
    </div>
  );
}
```

## Fonctionnalités Principales

### 1. Gestion des Zones
- Création et manipulation de zones interactives
- Gestion des dimensions et positions
- Système de grille et d'alignement

### 2. Gestion des Projets
- Création et sauvegarde de projets
- Import/Export de projets
- Gestion des métadonnées

### 3. Système d'Actions
- Actions modulaires et extensibles
- Validation des actions
- Historique des actions (undo/redo)

### 4. État Global
- Store Redux optimisé
- Sélecteurs performants
- Persistance des données

## Documentation

### API
- [API des Composants](components/README.md)
- [API des Hooks](hooks/README.md)
- [API du Store](store/README.md)
- [API des Actions](actions/README.md)
- [API des Types](types/README.md)
- [API des Utils](utils/README.md)
- [API des Constants](constants/README.md)
- [API de l'Historique](history/README.md)
- [API des Providers](providers/README.md)

## Bonnes Pratiques

1. **Architecture**
   - Utiliser les hooks fournis pour l'accès aux données
   - Respecter la séparation des préoccupations
   - Suivre les patterns de conception établis

2. **Performance**
   - Utiliser les sélecteurs optimisés
   - Éviter les re-rendus inutiles
   - Optimiser les opérations coûteuses

3. **Maintenance**
   - Documenter les modifications
   - Maintenir les tests à jour
   - Suivre les conventions de code

## Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité
3. Ajouter des tests
4. Mettre à jour la documentation
5. Soumettre une pull request

## Support

- [Documentation Technique](docs/)
- [Changelog](CHANGELOG.md)

## Licence

MIT 

## Raccourcis clavier

Le système de raccourcis clavier a été entièrement migré de l'ancien module `area` vers le nouveau système `core`. L'implémentation comprend:

### Structure

- **keyboardShortcutRegistry.ts**: Un registre permettant d'enregistrer, récupérer et supprimer des raccourcis clavier par type de zone.
- **keyboard.ts**: Utilitaires pour la gestion des touches, incluant des fonctions pour détecter les touches enfoncées et trouver le meilleur raccourci correspondant.
- **useAreaKeyboardShortcuts.ts**: Un hook personnalisé qui permet aux zones d'utiliser des raccourcis clavier.
- **useMouseInRect.ts**: Un hook utilitaire qui vérifie si la souris est à l'intérieur d'un rectangle donné.
- **registerDefaultKeyboardShortcuts.ts**: Une fonction qui enregistre les raccourcis clavier par défaut pour chaque type de zone.

### Utilisation

Pour utiliser les raccourcis clavier dans une zone:

```typescript
// Dans un composant Area
import { useAreaKeyboardShortcuts } from "~/core/hooks/useAreaKeyboardShortcuts";

function MyAreaComponent({ id, type, viewport }) {
  // Utiliser les raccourcis clavier
  useAreaKeyboardShortcuts(id, type, viewport);
  
  // Reste du composant...
}
```

Pour ajouter un nouveau raccourci clavier:

```typescript
// Dans un fichier d'initialisation
import { keyboardShortcutRegistry } from "~/core/store/registries/keyboardShortcutRegistry";
import { AreaType } from "~/core/constants";

// Enregistrer un raccourci clavier
keyboardShortcutRegistry.registerShortcuts(AreaType.MyCustomArea, [
  {
    key: "Delete",
    name: "Delete Item",
    fn: (areaId, params) => {
      // Logique de suppression...
      params.submitAction("Delete Item");
    },
    history: true,
  },
  // Autres raccourcis...
]);
```

### Améliorations par rapport à l'ancien système

1. **Registre moderne**: Utilisation d'une API plus propre et extensible pour l'enregistrement des raccourcis.
2. **Intégration complète**: Fonctionne parfaitement avec le nouveau store Redux.
3. **Historique amélioré**: Meilleure gestion des opérations undo/redo.
4. **Detection précise**: Détection plus précise du focus grâce aux observateurs de redimensionnement.
5. **Typesafe**: Utilisation complète de TypeScript pour une meilleure sécurité des types. 
