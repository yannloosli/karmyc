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

## Composant Area Restructuré

Le composant Area est maintenant restructuré avec quatre sous-composants principaux pour offrir une expérience utilisateur plus riche et une organisation spatiale optimisée.

### Structure Générale

```
+-------------------------------------------------+
|                   MENU BAR                      |
+-------------------------------------------------+
|                                                 |
|    +---+                                +---+   |
|    |NW |                                |NE |   |
|    +---+                                +---+   |
|                                                 |
|                    +-----+                      |
|         +---+      |     |      +---+          |
|         | N |      |TOOL |      | S |          |
|         +---+      |BAR  |      +---+          |
|                    +-----+                      |
|                                                 |
|    +---+                                +---+   |
|    |SW |                                |SE |   |
|    +---+                                +---+   |
|                                                 |
+-------------------------------------------------+
|                  STATUS BAR                     |
+-------------------------------------------------+
```

### Composants Principaux

1. **MenuBar** - Barre horizontale en haut, largeur complète
   - Permet d'afficher des menus, options et commandes globales
   - Configurable par type de zone via `useMenuBar`

2. **ContentArea** - Zone principale 
   - Affiche le contenu principal de la zone
   - Utilise le composant enregistré via `useRegisterAreaType`

3. **StatusBar** - Barre horizontale en bas, largeur complète
   - Affiche les informations d'état, messages et indicateurs
   - Configurable par type de zone via `useStatusBar`

4. **Toolbar** - Superposée à la ContentArea
   - Zone centrale verticale pour les actions principales
   - Six emplacements (slots) additionnels pour des composants auxiliaires:
     * NW (Nord-Ouest)
     * N (Nord)
     * NE (Nord-Est)
     * SW (Sud-Ouest)
     * S (Sud)
     * SE (Sud-Est)
   - Configurable via `useToolbar`

### Hooks Associés

#### useMenuBar

Hook pour gérer les composants de la barre de menu supérieure.

```typescript
function useMenuBar(areaType: string) {
  return {
    // Enregistre un composant dans la barre de menu
    // Retourne un identifiant unique pour le composant
    registerComponent: (
      component: React.ComponentType<MenuBarComponentProps>, 
      options?: {
        order?: number;        // Ordre d'affichage (plus petit = plus à gauche)
        width?: number | 'auto'; // Largeur du composant ('auto' ou pixels)
        displayName?: string;   // Nom d'affichage pour débogage
      }
    ) => string,
    
    // Supprime un composant enregistré
    unregisterComponent: (componentId: string) => void,
    
    // Récupère tous les composants enregistrés pour ce type de zone
    getComponents: () => Array<{
      id: string;
      Component: React.ComponentType<MenuBarComponentProps>;
      order: number;
      width: number | 'auto';
      displayName?: string;
    }>
  };
}

// Types pour les props des composants de barre de menu
interface MenuBarComponentProps {
  areaId: string;           // ID de la zone associée
  areaState: any;           // État actuel de la zone
  areaType: string;         // Type de la zone
  width?: number | 'auto';  // Largeur allouée
}
```

#### useStatusBar

Hook pour gérer les composants de la barre d'état inférieure.

```typescript
function useStatusBar(areaType: string) {
  return {
    // Enregistre un composant dans la barre d'état
    // Retourne un identifiant unique pour le composant
    registerComponent: (
      component: React.ComponentType<StatusBarComponentProps>, 
      options?: {
        order?: number;         // Ordre d'affichage (plus petit = plus à gauche)
        width?: number | 'auto'; // Largeur du composant ('auto' ou pixels)
        displayName?: string;    // Nom d'affichage pour débogage
        alignment?: 'left' | 'center' | 'right'; // Alignement dans la barre
      }
    ) => string,
    
    // Supprime un composant enregistré
    unregisterComponent: (componentId: string) => void,
    
    // Récupère tous les composants enregistrés pour ce type de zone
    getComponents: () => Array<{
      id: string;
      Component: React.ComponentType<StatusBarComponentProps>;
      order: number;
      width: number | 'auto';
      alignment: 'left' | 'center' | 'right';
      displayName?: string;
    }>
  };
}

// Types pour les props des composants de barre d'état
interface StatusBarComponentProps {
  areaId: string;           // ID de la zone associée
  areaState: any;           // État actuel de la zone
  areaType: string;         // Type de la zone
  width?: number | 'auto';  // Largeur allouée
}
```

#### useToolbar

Hook pour gérer les composants de la barre d'outils centrale et les emplacements auxiliaires.

```typescript
function useToolbar(areaType: string) {
  return {
    // Enregistre un composant dans la barre d'outils centrale
    // Retourne un identifiant unique pour le composant
    registerComponent: (
      component: React.ComponentType<ToolbarComponentProps>, 
      options?: {
        order?: number;      // Ordre d'affichage (plus petit = plus haut)
        height?: number;     // Hauteur du composant en pixels
        displayName?: string; // Nom d'affichage pour débogage
      }
    ) => string,
    
    // Enregistre un composant dans un emplacement spécifique
    // Retourne un identifiant unique pour le composant
    registerSlotComponent: (
      slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se', 
      component: React.ComponentType<ToolbarSlotComponentProps>,
      options?: {
        displayName?: string; // Nom d'affichage pour débogage
      }
    ) => string,
    
    // Supprime un composant enregistré (toolbar ou slot)
    unregisterComponent: (componentId: string) => void,
    
    // Récupère tous les composants de la barre d'outils centrale
    getComponents: () => Array<{
      id: string;
      Component: React.ComponentType<ToolbarComponentProps>;
      order: number;
      height?: number;
      displayName?: string;
    }>,
    
    // Récupère tous les composants des emplacements
    getSlotComponents: () => Record<
      'nw' | 'n' | 'ne' | 'sw' | 's' | 'se', 
      {
        id: string;
        Component: React.ComponentType<ToolbarSlotComponentProps>;
        displayName?: string;
      } | null
    >
  };
}

// Types pour les props des composants de la barre d'outils centrale
interface ToolbarComponentProps {
  areaId: string;     // ID de la zone associée
  areaState: any;     // État actuel de la zone
  areaType: string;   // Type de la zone
  height?: number;    // Hauteur allouée
}

// Types pour les props des composants d'emplacement
interface ToolbarSlotComponentProps {
  areaId: string;     // ID de la zone associée
  areaState: any;     // État actuel de la zone
  areaType: string;   // Type de la zone
  slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se';  // Emplacement où le composant est rendu
}
```

### Exemple d'Utilisation

```tsx
// Enregistrement d'un type de zone avec tous les composants associés
const MyCustomComponent = ({ id, state, ...props }) => {
  // Utiliser les hooks pour enregistrer les composants
  const { registerComponent: registerMenuComponent } = useMenuBar('my-area-type');
  const { registerComponent: registerStatusComponent } = useStatusBar('my-area-type');
  const { 
    registerComponent: registerToolbarComponent,
    registerSlotComponent
  } = useToolbar('my-area-type');
  
  useEffect(() => {
    // Enregistrer les composants pour la barre de menu
    const menuId = registerMenuComponent(
      ({ areaId, areaState }) => (
        <div>Menu pour {areaId}</div>
      ),
      { order: 10, width: 'auto' }
    );
    
    // Enregistrer les composants pour la barre d'état
    const statusId = registerStatusComponent(
      ({ areaId, areaState }) => (
        <div>Status: {areaState.status || 'Prêt'}</div>
      ),
      { order: 10, alignment: 'left', width: 'auto' }
    );
    
    // Enregistrer les composants pour la barre d'outils
    const toolbarId = registerToolbarComponent(
      ({ areaId, areaState }) => (
        <button onClick={() => console.log('Action pour', areaId)}>
          Action
        </button>
      ),
      { order: 10 }
    );
    
    // Enregistrer un composant pour le slot Nord-Est
    const neSlotId = registerSlotComponent(
      'ne',
      ({ areaId, areaState }) => (
        <div>Options</div>
      )
    );
    
    // Nettoyage lors du démontage
    return () => {
      // Désinscrire tous les composants
    };
  }, []);
  
  // Rendu du contenu principal
  return (
    <div>
      <h2>Mon contenu principal</h2>
      <p>État: {JSON.stringify(state)}</p>
    </div>
  );
};

// Enregistrement du type de zone
useRegisterAreaType(
  'my-area-type',
  MyCustomComponent,
  { status: 'Initialisé' }, // État initial
  { displayName: 'Ma Zone Personnalisée' }
);
```
