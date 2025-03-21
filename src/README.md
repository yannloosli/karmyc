# Système de Layout Modulaire - Documentation

## Introduction

Ce module fournit un système de layout modulaire et flexible basé sur des zones (areas) qui peuvent être personnalisées et agencées librement. Il utilise React et Redux pour gérer l'état et les interactions.

## Architecture

Le système est organisé selon les principes suivants:

- **API modulaire**: Une série de hooks React pour interagir avec le système
- **Store centralisé**: Un store Redux pour gérer l'état global
- **Registres**: Des registres pour les composants et les raccourcis clavier
- **Providers**: Des providers React pour initialiser et configurer le système

## API Principale

### Hooks

Le système expose les hooks principaux suivants:

#### `useRegisterAreaType`

```typescript
function useRegisterAreaType<T = any>(
  areaType: string,
  component: React.ComponentType<AreaComponentProps<T>>,
  initialState: T,
  options?: {
    displayName?: string;
    icon?: React.ComponentType;
    defaultSize?: { width: number, height: number };
    supportedActions?: string[];
  }
): void
```

Ce hook permet d'enregistrer un nouveau type de zone avec son composant, son état initial et ses options.

#### `useArea`

```typescript
function useArea() {
  return { 
    areas,            // Toutes les zones
    activeArea,       // Zone active
    createArea,       // Crée une nouvelle zone
    deleteArea,       // Supprime une zone
    updateAreaState,  // Met à jour l'état d'une zone
    setActive,        // Définit la zone active
    getAreaById       // Récupère une zone par son id
  };
}
```

Ce hook permet de manipuler les zones (création, suppression, mise à jour, etc.).

#### `useContextMenu`

```typescript
function useContextMenu() {
  return { 
    isVisible,  // État de visibilité du menu
    position,   // Position du menu
    open,       // Ouvre le menu
    close       // Ferme le menu
  };
}
```

Ce hook permet de gérer les menus contextuels.

#### `useAreaKeyboardShortcuts`

```typescript
function useAreaKeyboardShortcuts(
  areaType: string,
  shortcuts: KeyboardShortcut[]
): void
```

Ce hook permet d'enregistrer des raccourcis clavier pour un type de zone.

### Composant KarmycProvider

```tsx
const KarmycProvider: React.FC<{
  children: React.ReactNode;
  options?: IKarmycOptions;
  customStore?: any;
}>
```

Ce composant est le point d'entrée principal du système. Il initialise le store, les registres et fournit le contexte nécessaire pour les hooks.

Les options disponibles sont:

```typescript
interface IKarmycOptions {
  enableLogging?: boolean;
  plugins?: IActionPlugin[];
  validators?: Array<{
    actionType: string;
    validator: (action: any) => { valid: boolean; message?: string };
  }>;
  initialAreas?: Array<{
    type: string;
    state?: any;
    position?: { x: number; y: number };
  }>;
  customReducers?: Record<string, any>;
  keyboardShortcutsEnabled?: boolean;
}
```

## Exemple d'utilisation

```tsx
import React from 'react';
import { 
  KarmycProvider, 
  useRegisterAreaType, 
  useArea
} from '@karmyc/layout';

// Composant personnalisé pour une zone
const MyCustomArea = ({ id, state, width, height }) => {
  return (
    <div style={{ width, height, background: '#f0f0f0' }}>
      <h2>Ma zone personnalisée</h2>
      <p>Contenu: {state.content}</p>
    </div>
  );
};

// Application principale
const App = () => {
  // Enregistrer un type de zone personnalisé
  useRegisterAreaType(
    'custom',
    MyCustomArea,
    { content: 'Contenu initial' },
    { displayName: 'Zone Personnalisée' }
  );
  
  // Utiliser le hook useArea
  const { createArea } = useArea();
  
  return (
    <div>
      <button onClick={() => createArea('custom', { content: 'Nouvelle zone' })}>
        Créer une zone
      </button>
    </div>
  );
};

// Intégration avec KarmycProvider
const Root = () => {
  return (
    <KarmycProvider options={{ enableLogging: true }}>
      <App />
    </KarmycProvider>
  );
};
```

## Prochaines étapes

- Implémentation complète de la gestion des areas personnalisées
- Suppression des références en dur aux composants spécifiques
- Optimisation des performances
- Tests unitaires et d'intégration
