# Documentation du Système de Layout Modulaire

Bienvenue dans la documentation du système de layout modulaire, un outil puissant pour créer des interfaces utilisateur flexibles avec des zones redimensionnables et personnalisables.

## Table des matières

### Guides

- [Guide de démarrage](./guides/getting-started.md) - Configuration initiale du système
- [Création de zones personnalisées](./guides/custom-areas.md) - Création de zones avancées
- [Utilisation des menus contextuels](./guides/context-menus.md) - Configuration des menus contextuels
- [Configuration des raccourcis clavier](./guides/keyboard-shortcuts.md) - Ajout de raccourcis clavier
- [Optimisation des performances](./guides/optimizations.md) - Amélioration des performances

### API

- [Composants](./api/components.md) - Documentation des composants principaux
- [Hooks](./api/hooks.md) - Documentation des hooks React
- [Intégration React](./api/integration.md) - Guide d'intégration avec React

### Architecture

- [Store Redux](./architecture/store.md) - Structure du store global
- [Système d'actions](./architecture/actions.md) - Architecture du système d'actions
- [Transitions d'état](./architecture/state-transitions.md) - Gestion des transitions d'état

## Vue d'ensemble

Le système de layout modulaire permet de créer des interfaces divisées en zones redimensionnables et personnalisables. Il a été conçu pour être :

- **Flexible** : Créez n'importe quel type de zone avec votre propre logique de rendu
- **Performant** : Rendu optimisé et état géré efficacement
- **Maintenable** : Architecture modulaire et extensible
- **Robuste** : Système d'historique (undo/redo) intégré

## Principales fonctionnalités

- **Zones redimensionnables** : Créez des zones que l'utilisateur peut redimensionner
- **Menus contextuels** : Configurez des menus contextuels pour les zones
- **Raccourcis clavier** : Définissez des raccourcis clavier spécifiques à chaque type de zone
- **Gestion d'état** : Stockez l'état de chaque zone et synchronisez-le
- **Historique** : Annulez et rétablissez les modifications
- **Événements** : Communication entre les zones via un système d'événements

## Installation

```bash
npm install @karmyc
# ou
yarn add @karmyc
```

## Exemple simple

```tsx
import React from 'react';
import { 
  KarmycProvider, 
  AreaRoot, 
  useRegisterAreaType, 
  useArea,
  AreaComponentProps 
} from '@karmyc';

// Définir un composant pour une zone
const MyCustomArea: React.FC<AreaComponentProps<{ content: string }>> = ({
  width, height, left, top, areaState
}) => (
  <div style={{ position: 'absolute', left, top, width, height, background: '#f0f0f0', padding: '16px' }}>
    <h2>Zone personnalisée</h2>
    <p>{areaState.content}</p>
  </div>
);

// Composant d'application
function App() {
  // Enregistrer le type de zone
  useRegisterAreaType('custom', MyCustomArea, { content: 'Contenu initial' });
  
  // Utiliser le hook pour créer des zones
  const { createArea } = useArea();
  
  return (
    <div>
      <button onClick={() => createArea('custom', { content: 'Nouvelle zone' })}>
        Créer une zone
      </button>
      <AreaRoot />
    </div>
  );
}

// Point d'entrée principal
export default function Root() {
  return (
    <KarmycProvider>
      <App />
    </KarmycProvider>
  );
}
```

## Prochaines étapes

1. Consultez le [guide de démarrage](./guides/getting-started.md) pour configurer le système
2. Explorez les [hooks d'API](./api/hooks.md) pour comprendre les fonctionnalités disponibles
3. Apprenez à [créer des zones personnalisées](./guides/custom-areas.md) avancées 
