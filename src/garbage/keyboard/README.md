# Karmyc Keyboard Plugin

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-plugins/keyboard.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-plugins/keyboard)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)

Plugin de gestion des raccourcis clavier pour Karmyc, permettant de définir et gérer des raccourcis clavier personnalisés dans l'éditeur.

## Fonctionnalités

- **Raccourcis Personnalisables** : Définition de raccourcis personnalisés
- **Contexte Sensible** : Raccourcis spécifiques au contexte
- **Combinaisons Multiples** : Support des combinaisons de touches
- **Conflits de Raccourcis** : Détection et résolution des conflits
- **Persistance** : Sauvegarde des configurations
- **Internationalisation** : Support des différentes dispositions de clavier

## Installation

```bash
# Installation du plugin
yarn add @gamesberry/karmyc-plugins/keyboard
```

## Utilisation

```tsx
import { KarmycProvider } from '@gamesberry/karmyc-core';
import { Editor } from '@gamesberry/karmyc-editor';

function App() {
  return (
    <KarmycProvider>
      <Editor 
        plugins={['keyboard']}
      />
    </KarmycProvider>
  );
}
```

## API

### Définition des Raccourcis

```tsx
import { useKeyboard } from '@gamesberry/karmyc-plugins/keyboard';

function MyComponent() {
  const { registerShortcut, unregisterShortcut } = useKeyboard();

  useEffect(() => {
    // Enregistrement d'un raccourci
    registerShortcut({
      key: 'Ctrl+S',
      action: () => {
        // Action de sauvegarde
      },
      description: 'Sauvegarder',
      context: 'editor'
    });

    return () => {
      // Nettoyage
      unregisterShortcut('Ctrl+S');
    };
  }, []);

  return (
    <div>
      {/* Interface utilisateur */}
    </div>
  );
}
```

### Types de Raccourcis

```tsx
interface Shortcut {
  key: string;           // Combinaison de touches
  action: () => void;    // Action à exécuter
  description: string;   // Description du raccourci
  context?: string;      // Contexte d'utilisation
  disabled?: boolean;    // État désactivé
  priority?: number;     // Priorité en cas de conflit
}

interface KeyboardState {
  shortcuts: Shortcut[];  // Liste des raccourcis
  activeContext: string;  // Contexte actif
  isEnabled: boolean;     // État d'activation
}
```

### Hooks

```tsx
const {
  registerShortcut,    // Enregistrer un raccourci
  unregisterShortcut,  // Supprimer un raccourci
  getShortcuts,        // Obtenir la liste des raccourcis
  setContext,          // Définir le contexte actif
  isShortcutActive,    // Vérifier si un raccourci est actif
  enableKeyboard,      // Activer/désactiver les raccourcis
  getActiveContext     // Obtenir le contexte actif
} = useKeyboard();
```

## Personnalisation

### Configuration des Raccourcis

```tsx
import { KeyboardProvider } from '@gamesberry/karmyc-plugins/keyboard';

function App() {
  return (
    <KeyboardProvider
      defaultContext="global"
      enableLogging={true}
      onShortcutTriggered={(shortcut) => {
        // Callback lors du déclenchement d'un raccourci
      }}
    >
      {/* Application */}
    </KeyboardProvider>
  );
}
```

### Gestion des Conflits

```tsx
import { useKeyboard } from '@gamesberry/karmyc-plugins/keyboard';

function MyComponent() {
  const { registerShortcut, resolveConflict } = useKeyboard();

  const handleConflict = (shortcut1, shortcut2) => {
    // Logique de résolution de conflit
    return shortcut1.priority > shortcut2.priority ? shortcut1 : shortcut2;
  };

  useEffect(() => {
    registerShortcut({
      key: 'Ctrl+S',
      action: handleSave,
      priority: 1
    });
  }, []);
}
```

## Développement

```bash
# Installation des dépendances
yarn install

# Build du plugin
yarn build

# Watch mode
yarn watch:keyboard

# Tests
yarn test:keyboard
```

## Documentation

Pour plus d'informations sur l'utilisation du plugin keyboard, consultez :

- [Guide des Plugins](../../../docs/guides/plugins.md)
- [API des Plugins](../../../docs/api/plugins.md)
- [Architecture](../../../docs/architecture/architecture.md)

## Contribution

Les contributions sont les bienvenues ! Consultez notre [Guide de Contribution](../../../CONTRIBUTING.md) pour plus de détails. 
