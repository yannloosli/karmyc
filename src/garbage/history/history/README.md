# Karmyc History Plugin

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-plugins/history.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-plugins/history)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)

Plugin de gestion de l'historique pour Karmyc, permettant de gérer les actions d'annulation et de rétablissement dans l'éditeur.

## Fonctionnalités

- **Annulation/Rétablissement** : Gestion des actions undo/redo
- **Historique Illimité** : Pas de limite sur le nombre d'actions
- **Groupement d'Actions** : Regroupement d'actions connexes
- **Points de Sauvegarde** : Création de points de sauvegarde
- **Filtrage** : Filtrage des types d'actions à suivre
- **Persistance** : Sauvegarde de l'historique

## Installation

```bash
# Installation du plugin
yarn add @gamesberry/karmyc-plugins/history
```

## Utilisation

```tsx
import { KarmycProvider } from '@gamesberry/karmyc-core';
import { Editor } from '@gamesberry/karmyc-editor';

function App() {
  return (
    <KarmycProvider>
      <Editor 
        plugins={['history']}
      />
    </KarmycProvider>
  );
}
```

## API

### Gestion de l'Historique

```tsx
import { useHistory } from '@gamesberry/karmyc-plugins/history';

function MyComponent() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    pushAction,
    clearHistory
  } = useHistory();

  // Ajout d'une action à l'historique
  const handleAction = () => {
    pushAction({
      type: 'MODIFY_ELEMENT',
      data: {
        elementId: '123',
        changes: { /* ... */ }
      },
      undo: () => {
        // Action d'annulation
      },
      redo: () => {
        // Action de rétablissement
      }
    });
  };

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

### Types d'Actions

```tsx
interface HistoryAction {
  type: string;           // Type d'action
  data: any;             // Données de l'action
  undo: () => void;      // Fonction d'annulation
  redo: () => void;      // Fonction de rétablissement
  group?: string;        // Groupe d'actions
  timestamp?: number;    // Horodatage
}

interface HistoryState {
  past: HistoryAction[];  // Actions passées
  present: HistoryAction; // Action actuelle
  future: HistoryAction[]; // Actions futures
}
```

### Hooks

```tsx
const {
  undo,              // Annuler la dernière action
  redo,              // Rétablir la dernière action annulée
  canUndo,           // Vérifier si on peut annuler
  canRedo,           // Vérifier si on peut rétablir
  pushAction,        // Ajouter une action
  clearHistory,      // Effacer l'historique
  getHistory,        // Obtenir l'historique
  createCheckpoint,  // Créer un point de sauvegarde
  revertToCheckpoint // Revenir à un point de sauvegarde
} = useHistory();
```

## Personnalisation

### Configuration de l'Historique

```tsx
import { HistoryProvider } from '@gamesberry/karmyc-plugins/history';

function App() {
  return (
    <HistoryProvider
      maxHistory={1000}           // Nombre maximum d'actions
      filterActions={['MODIFY']}  // Types d'actions à suivre
      autoSave={true}            // Sauvegarde automatique
      onHistoryChange={(state) => {
        // Callback lors d'un changement
      }}
    >
      {/* Application */}
    </HistoryProvider>
  );
}
```

### Groupement d'Actions

```tsx
import { useHistory } from '@gamesberry/karmyc-plugins/history';

function MyComponent() {
  const { pushAction, startGroup, endGroup } = useHistory();

  const handleComplexAction = () => {
    startGroup('COMPLEX_ACTION');

    // Actions multiples...
    pushAction({ /* ... */ });
    pushAction({ /* ... */ });
    pushAction({ /* ... */ });

    endGroup();
  };
}
```

## Développement

```bash
# Installation des dépendances
yarn install

# Build du plugin
yarn build

# Watch mode
yarn watch:history

# Tests
yarn test:history
```

## Documentation

Pour plus d'informations sur l'utilisation du plugin history, consultez :

- [Guide des Plugins](../../../docs/guides/plugins.md)
- [API des Plugins](../../../docs/api/plugins.md)
- [Architecture](../../../docs/architecture/architecture.md)

## Contribution

Les contributions sont les bienvenues ! Consultez notre [Guide de Contribution](../../../CONTRIBUTING.md) pour plus de détails. 
