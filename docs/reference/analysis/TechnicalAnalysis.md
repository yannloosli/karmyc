# Document Technique : Analyse de la Structure du Système de Mise en Page

## 1. Introduction

Ce document présente l'analyse détaillée de la structure actuelle du système de mise en page du système de layout. Cette analyse s'inscrit dans le cadre du projet de refactorisation visant à créer un système de mise en page central, modulaire et maintenable.

## 2. Vue d'ensemble de l'architecture

Le système de mise en page actuel est composé de plusieurs modules interconnectés qui gèrent différents aspects de l'interface utilisateur et de l'état de l'application. L'architecture est principalement basée sur Redux avec des extensions personnalisées pour la gestion de l'historique, des opérations complexes et des différences.

### 2.1 Composants principaux

Le système est actuellement réparti dans les dossiers suivants :

- `area` : Gestion des zones d'affichage
- `state` : Gestion de l'état global
- `contextMenu` : Menus contextuels
- `project` : Gestion des projets
- `diff` : Système de comparaison
- `toolbar` : Interface des barres d'outils
- `listener` : Système d'écoute d'événements
- `history` (sous-dossier de `state`) : Gestion de l'historique

### 2.2 Architecture de l'état

L'architecture de l'état est basée sur deux niveaux principaux :

1. **ApplicationState** : L'état complet de l'application, incluant l'historique des actions
2. **ActionState** : L'état actuel sans l'historique, utilisé pour les opérations courantes

Cette distinction permet une gestion fine de l'historique tout en maintenant des performances optimales pour les opérations courantes.

```mermaid
graph TD
    A[ApplicationState] --> B[ActionState]
    A --> C[Historique]
    B --> D[État des zones]
    B --> E[État des menus contextuels]
    B --> F[État des projets]
    B --> G[État des outils]
    C --> H[Liste des états précédents]
    C --> I[Index actuel]
    C --> J[Différences]
```

## 3. Analyse détaillée des composants

### 3.1 Système de gestion des zones (`area`)

#### 3.1.1 Structure et fonctionnalités

Le dossier `area` contient les éléments nécessaires pour gérer les différentes zones d'affichage de l'application :

- **Registre de zones** (`areaRegistry.tsx`) : Enregistre les différents types de zones disponibles (Timeline, Workspace, FlowEditor, History, Project) avec leurs composants React associés et leurs reducers spécifiques.
- **Opérations sur les zones** (`areaOperations.ts`) : Définit des opérations complexes comme le déplacement de zones, qui peuvent impliquer plusieurs actions atomiques.
- **Structure des zones** : Les zones sont organisées en lignes (`AreaRowLayout`) avec une orientation spécifique (horizontale ou verticale).

```mermaid
graph TD
    A[areaRegistry.tsx] --> B[Enregistrement des types de zones]
    A --> C[Enregistrement des composants]
    A --> D[Enregistrement des reducers]
    E[areaOperations.ts] --> F[Opérations complexes]
    E --> G[Manipulation des zones]
    H[Structure des zones] --> I[AreaRowLayout]
    I --> J[Orientation horizontale]
    I --> K[Orientation verticale]
```

#### 3.1.2 Types principaux

```typescript
// Types de zones disponibles
enum AreaType {
  Timeline,
  Workspace,
  FlowEditor,
  History,
  Project
}

// Structure d'une zone
interface Area {
  id: string;
  type: AreaType;
  state: AreaState<any>;
  size: number;
}

// Structure d'une ligne de zones
interface AreaRowLayout {
  id: string;
  orientation: AreaRowOrientation; // "horizontal" | "vertical"
  areas: Area[];
}
```

### 3.2 Système de gestion d'état (`state`)

#### 3.2.1 Structure et fonctionnalités

Le dossier `state` contient les éléments centraux pour la gestion de l'état global :

- **Store Redux** (`store.ts`) : Configure le store Redux central.
- **Reducers combinés** (`reducers.ts`) : Combine tous les reducers de l'application.
- **Opérations** (`operation.ts`) : Définit un système pour regrouper plusieurs actions et les soumettre ensemble.
- **Annulation/rétablissement** (`undoRedo.ts`) : Implémente les fonctionnalités d'annulation et de rétablissement.
- **Utilitaires d'état** (`stateUtils.ts`) : Fournit des fonctions utilitaires pour manipuler l'état.

```mermaid
graph TD
    A[store.ts] --> B[Configuration du store Redux]
    C[reducers.ts] --> D[Combinaison des reducers]
    E[operation.ts] --> F[Système d'opérations]
    G[undoRedo.ts] --> H[Annulation/rétablissement]
    I[stateUtils.ts] --> J[Utilitaires d'état]
    B --> K[Store central]
    D --> K
    F --> L[Opérations complexes]
    H --> M[Gestion de l'historique]
    J --> N[Manipulation de l'état]
```

#### 3.2.2 Système d'opérations

Le système d'opérations permet de regrouper plusieurs actions et de les soumettre ensemble, ce qui est essentiel pour maintenir la cohérence de l'état lors d'opérations complexes.

```typescript
// Interface d'une opération
interface Operation {
  add: (...actions: Action[]) => void;
  clear: () => void;
  addDiff: (fn: DiffFactoryFn) => void;
  performDiff: (fn: DiffFactoryFn) => void;
  submit: () => void;
  state: ActionState;
}
```

```mermaid
sequenceDiagram
    participant C as Composant
    participant O as Opération
    participant S as Store
    participant D as Système de différences
    
    C->>O: createOperation()
    C->>O: add(action1)
    C->>O: add(action2)
    C->>O: addDiff(diffFn)
    C->>O: submit()
    O->>S: dispatch(actions)
    O->>D: performDiff(diffFn)
    O->>O: clear()
```

#### 3.2.3 Système d'historique

Le sous-dossier `state/history` gère l'historique des actions :

- **Reducer basé sur les actions** (`actionBasedReducer.ts`) : Implémente un reducer qui conserve l'historique des actions.
- **Actions d'historique** (`historyActions.ts`) : Définit les actions pour manipuler l'historique.
- **Reducer d'historique** (`historyReducer.ts`) : Implémente un reducer générique pour gérer l'historique des états.

```typescript
// Structure de l'état avec historique
interface HistoryState<S> {
  type: "normal" | "selection";
  list: Array<{
    state: S;
    name: string;
    modifiedRelated: boolean;
    allowIndexShift: boolean;
    diffs: Diff[];
  }>;
  index: number;
  indexDirection: -1 | 1;
  action: null | {
    id: string;
    state: S;
  };
}
```

```mermaid
graph TD
    A[historyReducer.ts] --> B[Gestion de l'historique]
    C[actionBasedReducer.ts] --> D[Reducer basé sur les actions]
    E[historyActions.ts] --> F[Actions d'historique]
    B --> G[HistoryState]
    G --> H[Liste d'états]
    G --> I[Index actuel]
    G --> J[Direction de l'index]
    G --> K[Action en cours]
    H --> L[État]
    H --> M[Nom]
    H --> N[Différences]
```

### 3.3 Système de menu contextuel (`contextMenu`)

#### 3.3.1 Structure et fonctionnalités

Le dossier `contextMenu` gère les menus contextuels de l'application :

- **Reducer de menu contextuel** (`contextMenuReducer.ts`) : Gère l'état des menus contextuels (ouverture, fermeture, options).
- **Actions de menu contextuel** (`contextMenuActions.ts`) : Définit les actions pour manipuler les menus contextuels.
- **Composant de menu contextuel** (`CustomContextMenu.tsx`) : Implémente l'interface utilisateur des menus contextuels.
- **Types de menu contextuel** (`contextMenuTypes.ts`) : Définit les types utilisés dans le système de menu contextuel.

```mermaid
graph TD
    A[contextMenuReducer.ts] --> B[Gestion de l'état des menus]
    C[contextMenuActions.ts] --> D[Actions pour les menus]
    E[CustomContextMenu.tsx] --> F[Interface utilisateur]
    G[contextMenuTypes.ts] --> H[Types pour les menus]
    B --> I[ContextMenuState]
    D --> J[openContextMenu]
    D --> K[closeContextMenu]
    D --> L[openCustomContextMenu]
    F --> M[Rendu des menus]
    H --> N[ContextMenuOption]
```

#### 3.3.2 Types principaux

```typescript
// Option d'action dans un menu contextuel
interface ContextMenuActionOption {
  label: string;
  onSelect: () => void;
  default?: boolean;
  icon?: React.ComponentType;
}

// Option de liste dans un menu contextuel
interface ContextMenuListOption {
  label: string;
  options: ContextMenuOption[];
  default?: boolean;
  icon?: React.ComponentType;
}

// État du menu contextuel
interface ContextMenuState {
  name: string;
  isOpen: boolean;
  options: ContextMenuOption[];
  position: Vec2;
  close: (() => void) | null;
  customContextMenu: null | OpenCustomContextMenuOptions;
}
```

### 3.4 Système de gestion de projet (`project`)

#### 3.4.1 Structure et fonctionnalités

Le dossier `project` gère les projets et les compositions :

- **Reducer de projet** (`projectReducer.ts`) : Gère l'état des projets (compositions, glisser-déposer).
- **Composants de projet** (`Project.tsx`, `ProjectComp.tsx`) : Implémentent l'interface utilisateur pour la gestion des projets.
- **Menu contextuel de projet** (`projectContextMenu.ts`) : Définit les options de menu contextuel spécifiques aux projets.

```mermaid
graph TD
    A[projectReducer.ts] --> B[Gestion de l'état des projets]
    C[Project.tsx] --> D[Composant principal]
    E[ProjectComp.tsx] --> F[Composant de composition]
    G[projectContextMenu.ts] --> H[Menu contextuel]
    B --> I[ProjectState]
    I --> J[compositions]
    I --> K[dragComp]
    I --> L[playback]
    D --> M[Affichage des compositions]
    F --> N[Gestion d'une composition]
    H --> O[Options de menu]
```

#### 3.4.2 Types principaux

```typescript
// État du projet
interface ProjectState {
  compositions: string[];
  dragComp: null | {
    compositionId: string;
    position: Vec2;
  };
  playback: null | {
    compositionId: number;
    frameIndex: number;
  };
}
```

### 3.5 Système de différences (`diff`)

#### 3.5.1 Structure et fonctionnalités

Le dossier `diff` gère les différences pour l'historique et les mises à jour visuelles :

- **Fabrique de différences** (`diffFactory.ts`) : Crée des objets de différence pour divers types de changements.
- **Types de différences** (`diffs.ts`) : Définit les différents types de différences possibles.
- **Filtrage et ajustement** : Contient des utilitaires pour filtrer et ajuster les différences.

```mermaid
graph TD
    A[diffFactory.ts] --> B[Création de différences]
    C[diffs.ts] --> D[Types de différences]
    E[filterIncomingTopLevelDiff.ts] --> F[Filtrage des différences]
    G[adjustDiffsToChildComposition.ts] --> H[Ajustement des différences]
    B --> I[DiffFactoryFn]
    D --> J[DiffType]
    D --> K[Diff]
    F --> L[Filtrage]
    H --> M[Ajustement]
```

#### 3.5.2 Types principaux

```typescript
// Types de différences
enum DiffType {
  Layer,
  ModifyCompositionView,
  ModifyCompositionDimensions,
  AddLayer,
  RemoveLayer,
  ResizeAreas,
  FrameIndex,
  // ... autres types
}

// Structure d'une différence
interface Diff {
  type: DiffType;
  // ... autres propriétés spécifiques au type
}

// Fonction de création de différence
type DiffFactoryFn = (factory: typeof diffFactory) => Diff | Diff[];
```

### 3.6 Système de barre d'outils (`toolbar`)

#### 3.6.1 Structure et fonctionnalités

Le dossier `toolbar` gère les barres d'outils de l'application :

- **Reducer d'outils** (`toolReducer.ts`) : Gère l'état des outils sélectionnés.
- **Actions d'outils** (`toolActions.ts`) : Définit les actions pour manipuler les outils.
- **Composant de barre d'outils** (`Toolbar.tsx`) : Implémente l'interface utilisateur des barres d'outils.

```mermaid
graph TD
    A[toolReducer.ts] --> B[Gestion de l'état des outils]
    C[toolActions.ts] --> D[Actions pour les outils]
    E[Toolbar.tsx] --> F[Interface utilisateur]
    B --> G[ToolState]
    G --> H[selected]
    G --> I[selectedInGroup]
    G --> J[openGroupIndex]
    D --> K[setTool]
    D --> L[setOpenGroupIndex]
    F --> M[Affichage des outils]
```

#### 3.6.2 Types principaux

```typescript
// État des outils
interface ToolState {
  selected: Tool;
  selectedInGroup: Array<Tool>;
  openGroupIndex: number;
}
```

### 3.7 Système d'écoute d'événements (`listener`)

#### 3.7.1 Structure et fonctionnalités

Le dossier `listener` gère les événements et les actions :

- **Demande d'action** (`requestAction.ts`) : Implémente un système sophistiqué pour demander et exécuter des actions.
- **Écoute de clavier** (`keyboard.ts`) : Gère les événements clavier.
- **Écoute de différences** (`diffListener.ts`) : Gère la propagation des différences aux abonnés.
- **Enregistrement d'écouteurs** (`registerListener.ts`) : Fournit un système pour enregistrer des écouteurs d'événements.

```mermaid
graph TD
    A[requestAction.ts] --> B[Système de demande d'actions]
    C[keyboard.ts] --> D[Gestion des événements clavier]
    E[diffListener.ts] --> F[Propagation des différences]
    G[registerListener.ts] --> H[Enregistrement d'écouteurs]
    B --> I[RequestActionParams]
    B --> J[performRequestedAction]
    D --> K[isKeyDown]
    D --> L[isKeyCodeOf]
    F --> M[sendDiffsToSubscribers]
    H --> N[addListener]
```

#### 3.7.2 Types principaux

```typescript
// Paramètres pour les demandes d'action
interface RequestActionParams {
  dispatch: (action: Action | Action[], ...otherActions: Action[]) => void;
  dispatchToAreaState: (areaId: string, action: Action) => void;
  cancelAction: () => void;
  submitAction: (name?: string, options?: Partial<SubmitOptions>) => void;
  addListener: typeof addListener;
  removeListener: typeof removeListener;
  execOnComplete: (callback: () => void) => void;
  done: () => boolean;
  addDiff: (fn: DiffFactoryFn, options?: { perform: boolean }) => void;
  performDiff: (fn: DiffFactoryFn) => void;
  addReverseDiff: (fn: DiffFactoryFn) => void;
}
```

## 4. Analyse du flux de données

### 4.1 Vue d'ensemble du flux de données

Le flux de données dans l'application suit principalement le modèle Redux avec quelques extensions personnalisées pour gérer des fonctionnalités spécifiques comme l'historique, les opérations complexes et les différences visuelles.

```mermaid
graph TD
    U[Utilisateur] -->|Interaction| C[Composants UI]
    C -->|requestAction| L[Système d'écoute]
    L -->|createOperation| O[Opération]
    O -->|add actions| O
    O -->|addDiff| O
    O -->|submit| S[Store Redux]
    S -->|dispatch| R[Reducers]
    R -->|update| S
    S -->|state changes| C
    O -->|performDiff| D[Système de différences]
    D -->|visual updates| C
```

### 4.2 Points d'entrée et de sortie des données

#### 4.2.1 Points d'entrée

1. **Interactions utilisateur** : Les interactions utilisateur (clics, glisser-déposer, raccourcis clavier) sont capturées par les composants React et déclenchent des actions via le système `requestAction`.

2. **Système d'écoute d'événements** : Le module `listener` capture les événements DOM et les transforme en actions Redux via `requestAction.ts`.

3. **Opérations complexes** : Les opérations complexes sont initiées via `createOperation` qui permet de regrouper plusieurs actions et différences.

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant C as Composant UI
    participant L as Listener
    participant R as requestAction
    
    U->>C: Interaction (clic, glisser-déposer)
    C->>R: requestAction(options, callback)
    R->>L: addListener(event, handler)
    L-->>R: événement déclenché
    R->>C: callback avec params
```

#### 4.2.2 Points de sortie

1. **Rendu des composants** : Les changements d'état sont reflétés dans l'interface utilisateur via le système de rendu de React.

2. **Système de différences** : Les différences visuelles sont propagées aux composants via le système `diffListener`.

3. **Persistance** : L'état est persisté via le système `saveState`.

```mermaid
sequenceDiagram
    participant S as Store
    participant C as Composants
    participant D as Système de différences
    participant P as Persistance
    
    S->>C: Mise à jour de l'état via connectActionState
    S->>D: Propagation des différences
    D->>C: Mise à jour visuelle
    S->>P: Sauvegarde de l'état
```

### 4.3 Modèles d'état (State Patterns)

#### 4.3.1 Structure à deux niveaux

L'application utilise une structure d'état à deux niveaux :

1. **ApplicationState** : L'état global de l'application, incluant l'historique.
2. **ActionState** : L'état actuel sans l'historique, utilisé pour les opérations courantes.

```mermaid
classDiagram
    class ApplicationState {
        area: ActionBasedState~AreaReducerState~
        compositionState: HistoryState~CompositionState~
        contextMenu: ActionBasedState~ContextMenuState~
        project: HistoryState~ProjectState~
        tool: ActionBasedState~ToolState~
        ...autres états
    }
    
    class ActionState {
        area: AreaReducerState
        compositionState: CompositionState
        contextMenu: ContextMenuState
        project: ProjectState
        tool: ToolState
        ...autres états
    }
    
    ApplicationState --> ActionState : contient
```

#### 4.3.2 Gestion de l'historique

L'historique est géré via deux types d'états :

1. **ActionBasedState** : État basé sur les actions, sans historique complet.
2. **HistoryState** : État avec historique complet, permettant l'annulation/rétablissement.

```mermaid
classDiagram
    class HistoryState~S~ {
        type: "normal" | "selection"
        list: Array~StateEntry~
        index: number
        indexDirection: -1 | 1
        action: null | ActionEntry
    }
    
    class StateEntry {
        state: S
        name: string
        modifiedRelated: boolean
        allowIndexShift: boolean
        diffs: Diff[]
    }
    
    class ActionBasedState~S~ {
        state: S
        actions: Action[]
    }
    
    HistoryState --> StateEntry : contient
```

### 4.4 Flux de données pour les zones (Areas)

Le module `area` est central dans l'architecture et illustre bien le flux de données de l'application.

#### 4.4.1 Structure des zones

```mermaid
classDiagram
    class AreaReducerState {
        _id: number
        rootId: string
        joinPreview: JoinPreview | null
        layout: Map~string, AreaLayout | AreaRowLayout~
        areas: Map~string, Area~
        areaToOpen: AreaToOpen | null
    }
    
    class Area {
        id: string
        type: AreaType
        state: AreaState~any~
        size: number
    }
    
    class AreaRowLayout {
        id: string
        type: "area_row"
        orientation: "horizontal" | "vertical"
        areas: Array~AreaItem~
    }
    
    class AreaItem {
        id: string
        size: number
    }
    
    class AreaLayout {
        id: string
        type: "area"
    }
    
    AreaReducerState --> Area : contient
    AreaReducerState --> AreaRowLayout : contient
    AreaReducerState --> AreaLayout : contient
    AreaRowLayout --> AreaItem : contient
```

#### 4.4.2 Flux de données pour les opérations sur les zones

```mermaid
sequenceDiagram
    participant C as Composant UI
    participant O as areaOperations
    participant A as areaActions
    participant R as areaReducer
    participant D as diffFactory
    
    C->>O: dragArea(op, area, targetId, placement)
    O->>A: setFields({areaToOpen: null})
    O->>A: wrapAreaInRow(targetId, orientation)
    O->>A: insertAreaIntoRow(newRowId, area, index)
    O->>A: setRowSizes(newRowId, [1, 1])
    O->>D: addDiff(diff.resizeAreas())
    A->>R: reducer traite les actions
    R-->>C: nouvel état
    D-->>C: mise à jour visuelle
```

### 4.5 Flux de données pour les actions et opérations

Le système d'actions et d'opérations est au cœur du flux de données de l'application.

#### 4.5.1 Cycle de vie d'une action

```mermaid
sequenceDiagram
    participant C as Composant
    participant R as requestAction
    participant O as Operation
    participant S as Store
    participant H as Historique
    participant D as Diff
    
    C->>R: requestAction(options, callback)
    R->>O: createOperation(params)
    R->>C: callback(params)
    C->>O: add(action1, action2, ...)
    C->>O: addDiff(diffFn)
    C->>O: submit()
    O->>S: dispatch(actions)
    S->>H: mise à jour de l'historique si nécessaire
    O->>D: performDiff(diffFn)
    S-->>C: nouvel état
    D-->>C: mise à jour visuelle
```

#### 4.5.2 Flux pour les opérations complexes

```mermaid
flowchart TD
    A[Composant UI] -->|requestAction| B[Système d'écoute]
    B -->|createOperation| C[Opération]
    C -->|add| D[Actions atomiques]
    C -->|addDiff| E[Différences]
    C -->|submit| F[Store Redux]
    F -->|dispatch| G[Reducers]
    G -->|update| H[ApplicationState]
    H -->|getActionState| I[ActionState]
    I -->|connectActionState| A
    C -->|performDiff| J[Système de différences]
    J -->|sendDiffsToSubscribers| A
```

### 4.6 Flux de données pour le système de différences

Le système de différences permet de propager efficacement les changements visuels sans passer par le cycle complet de Redux.

```mermaid
sequenceDiagram
    participant O as Operation
    participant F as diffFactory
    participant D as diffListener
    participant C as Composants abonnés
    
    O->>F: factory.layer(layerId)
    F-->>O: Diff object
    O->>D: performDiff(diffFn)
    D->>D: sendDiffsToSubscribers(diffs)
    D->>C: callback(diff)
    C->>C: Mise à jour visuelle
```

### 4.7 Analyse des modèles de communication

#### 4.7.1 Communication directe vs indirecte

L'application utilise principalement deux modèles de communication :

1. **Communication via Redux** : Pour les changements d'état qui doivent être persistés et inclus dans l'historique.
2. **Communication via le système de différences** : Pour les mises à jour visuelles rapides qui ne nécessitent pas de persistance.

```mermaid
graph TD
    A[Composant source] -->|Redux| B[Store]
    B -->|State| C[Composant cible]
    A -->|Diff| D[diffListener]
    D -->|Callback| C
```

#### 4.7.2 Modèle Publish-Subscribe

Le système `diffListener` implémente un modèle publish-subscribe où les composants peuvent s'abonner à des types spécifiques de différences.

```mermaid
classDiagram
    class DiffSubscriber {
        id: string
        callback: function
        types: DiffType[]
    }
    
    class DiffListener {
        subscribers: DiffSubscriber[]
        addSubscriber(callback, types): string
        removeSubscriber(id): void
        sendDiffsToSubscribers(diffs): void
    }
    
    DiffListener --> DiffSubscriber : gère
```

## 5. Points forts et limitations de l'architecture actuelle

### 5.1 Points forts

1. **Architecture modulaire** : Le système est divisé en modules distincts avec des responsabilités claires.
2. **Système d'historique avancé** : Le système d'historique permet une gestion fine des actions et des états.
3. **Opérations complexes** : Le système d'opérations permet de regrouper plusieurs actions et de maintenir la cohérence de l'état.
4. **Système de différences** : Le système de différences permet de propager efficacement les changements visuels.

### 5.2 Limitations et défis

1. **Complexité** : L'architecture actuelle est complexe et peut être difficile à comprendre et à maintenir.
2. **Couplage** : Certains modules sont fortement couplés, ce qui peut rendre la refactorisation plus difficile.
3. **Dépendances circulaires** : Il existe des dépendances circulaires potentielles entre certains modules.
4. **Duplication** : Certaines fonctionnalités peuvent être dupliquées dans différents modules.

```mermaid
quadrantChart
    title Points forts vs Complexité
    x-axis Faible complexité --> Forte complexité
    y-axis Faible valeur --> Forte valeur
    quadrant-1 À simplifier
    quadrant-2 À conserver et améliorer
    quadrant-3 À reconsidérer
    quadrant-4 À optimiser
    "Système d'historique": [0.8, 0.9]
    "Système d'opérations": [0.7, 0.8]
    "Système de différences": [0.6, 0.7]
    "Architecture modulaire": [0.5, 0.8]
    "Gestion des zones": [0.6, 0.6]
    "Menus contextuels": [0.4, 0.5]
    "Gestion des projets": [0.5, 0.6]
    "Système d'écoute d'événements": [0.7, 0.7]
```

## 6. Proposition d'architecture future

### 6.1 Structure du dossier 'core'

```mermaid
graph TD
    A[core] --> B[store]
    A --> C[components]
    A --> D[hooks]
    A --> E[utils]
    A --> F[types]
    B --> G[slices]
    B --> H[middleware]
    C --> I[area]
    C --> J[contextMenu]
    D --> K[useArea]
    D --> L[useContextMenu]
    D --> M[useOperation]
    E --> N[areaUtils]
    E --> O[diffUtils]
    F --> P[areaTypes]
    F --> Q[storeTypes]
```

### 6.2 Flux de données proposé

```mermaid
sequenceDiagram
    participant U as Utilisateur
    participant C as Composant UI
    participant H as Hooks
    participant S as Store
    participant M as Middleware
    
    U->>C: Interaction
    C->>H: useOperation()
    H->>S: dispatch(action)
    S->>M: Middleware (historique, diff)
    M->>S: Mise à jour de l'état
    S-->>C: Mise à jour via useSelector
```

## 7. Conclusion et recommandations

L'analyse de la structure actuelle du système de mise en page révèle une architecture sophistiquée mais complexe. La refactorisation devra préserver les points forts tout en simplifiant l'architecture et en réduisant le couplage entre les modules.

### 7.1 Recommandations pour la refactorisation

1. **Centraliser la gestion de l'état** : Créer un store Redux central avec des slices bien définis pour chaque domaine fonctionnel.
2. **Simplifier le système d'historique** : Utiliser redux-undo pour la gestion de l'historique tout en préservant les fonctionnalités avancées actuelles.
3. **Réduire le couplage** : Définir des interfaces claires entre les modules et minimiser les dépendances.
4. **Standardiser les patterns** : Adopter des patterns cohérents pour la gestion de l'état, les actions et les reducers.
5. **Documenter l'architecture** : Créer une documentation claire et détaillée de l'architecture pour faciliter la maintenance future.

### 7.2 Plan de migration

```mermaid
gantt
    title Plan de migration
    dateFormat  YYYY-MM-DD
    section Analyse
    Analyse de la structure actuelle      :done, a1, 2024-04-10, 7d
    Analyse du flux de données            :active, a2, after a1, 7d
    Analyse des performances              :a3, after a2, 7d
    section Conception
    Structure du dossier 'core'           :c1, after a3, 7d
    Conception du store Redux             :c2, after c1, 7d
    Système d'actions modulaire           :c3, after c2, 7d
    API de hooks                          :c4, after c3, 7d
    section Implémentation
    Refactorisation de la structure       :i1, after c4, 14d
    Implémentation du store Redux         :i2, after i1, 14d
    Système d'actions                     :i3, after i2, 14d
    Hooks et API publique                 :i4, after i3, 14d
    section Tests
    Tests unitaires                       :t1, after i4, 14d
    Documentation finale                  :t2, after t1, 14d
    Exemples d'utilisation                :t3, after t2, 7d
```

### 7.3 Prochaines étapes

La prochaine étape selon la feuille de route est l'analyse du flux de données (phase 1.2), qui comprendra :

1. Cartographier le flux de données entre les composants
2. Identifier les points d'entrée et de sortie des données
3. Documenter les modèles d'état actuels (state patterns)
4. Analyser comment les actions sont actuellement gérées
5. Créer des diagrammes de flux de données

Cette analyse permettra de mieux comprendre les interactions entre les composants et de concevoir une architecture plus cohérente et maintenable.

## 4. Conception de la structure du dossier 'core'

### 4.1 Structure proposée pour un composant bundlisable

Pour permettre la distribution du composant 'core' via npm et assurer sa compatibilité avec différents systèmes de bundling, nous proposons la structure suivante :

```
src/
└── core/
    ├── index.ts                 # Point d'entrée principal (exports publics)
    ├── types/                   # Types et interfaces partagés
    │   ├── index.ts             # Export des types publics
    │   ├── internal.ts          # Types internes (non exportés)
    │   ├── area.ts              # Types liés aux zones
    │   ├── store.ts             # Types liés au store
    │   └── ...
    ├── store/                   # Gestion de l'état global
    │   ├── index.ts             # Export public du store
    │   ├── slices/              # Slices Redux pour chaque domaine
    │   │   ├── area.ts
    │   │   ├── contextMenu.ts
    │   │   ├── project.ts
    │   │   └── ...
    │   ├── middleware/          # Middleware Redux personnalisés
    │   ├── enhancers/           # Enhancers Redux
    │   └── serialization/       # Logique de sérialisation/désérialisation
    ├── hooks/                   # Hooks React pour l'API publique
    │   ├── index.ts             # Export des hooks publics
    │   ├── useArea.ts           # Hook pour la gestion des zones
    │   ├── useContextMenu.ts    # Hook pour les menus contextuels
    │   ├── useProject.ts        # Hook pour la gestion des projets
    │   └── ...
    ├── actions/                 # Système d'actions modulaire
    │   ├── index.ts             # Export des actions publiques
    │   ├── registry.ts          # Registre central des actions
    │   ├── types.ts             # Types d'actions
    │   ├── validation.ts        # Validation des actions
    │   └── plugins/             # Système de plugins pour les actions
    ├── components/              # Composants React réutilisables
    │   ├── index.ts             # Export des composants publics
    │   ├── Area.tsx             # Composant de zone
    │   ├── ContextMenu.tsx      # Composant de menu contextuel
    │   └── ...
    ├── utils/                   # Fonctions utilitaires
    │   ├── index.ts             # Export des utilitaires publics
    │   ├── history.ts           # Utilitaires pour l'historique
    │   ├── diff.ts              # Utilitaires pour les différences
    │   └── ...
    ├── providers/               # Providers React pour le contexte
    │   ├── index.ts             # Export des providers
    │   ├── CoreProvider.tsx     # Provider principal
    │   └── ...
    └── constants/               # Constantes partagées
        ├── index.ts             # Export des constantes publiques
        └── ...
```

### 4.2 Justification des choix architecturaux

#### 4.2.1 Structure orientée bundling

Cette structure est conçue pour faciliter le bundling et la distribution via npm :

1. **Point d'entrée unique** : Le fichier `index.ts` à la racine du dossier 'core' sert de point d'entrée unique, ce qui simplifie l'importation pour les utilisateurs.

2. **Exports explicites** : Chaque sous-dossier contient son propre fichier `index.ts` qui exporte uniquement les éléments destinés à être publics, permettant un contrôle précis sur l'API exposée.

3. **Séparation claire entre API publique et implémentation interne** : Les types, fonctions et composants sont clairement séparés entre ceux qui font partie de l'API publique et ceux qui sont internes.

4. **Structure modulaire** : Chaque fonctionnalité est isolée dans son propre sous-dossier, ce qui facilite le tree-shaking lors du bundling.

#### 4.2.2 Organisation des fonctionnalités

La structure proposée organise les fonctionnalités de manière logique :

1. **Store** : Centralise toute la logique de gestion d'état avec Redux-Toolkit, organisée en slices pour chaque domaine fonctionnel.

2. **Hooks** : Fournit une API React moderne basée sur les hooks, facilitant l'intégration dans les applications React.

3. **Actions** : Implémente un système d'actions modulaire avec un registre central et un mécanisme de plugins.

4. **Components** : Contient les composants React réutilisables qui forment l'interface utilisateur du système de mise en page.

5. **Providers** : Fournit les providers React nécessaires pour injecter le contexte et les fonctionnalités dans l'arbre de composants.

#### 4.2.3 Avantages pour la distribution npm

Cette structure présente plusieurs avantages pour la distribution via npm :

1. **Tree-shaking efficace** : Les bundlers modernes (webpack, rollup, esbuild) pourront éliminer efficacement le code non utilisé grâce à la structure modulaire et aux exports explicites.

2. **Compatibilité avec les différents formats de modules** : La structure permet de générer facilement des builds pour différents formats (ESM, CommonJS, UMD).

3. **Types TypeScript intégrés** : L'organisation des types facilite la génération de déclarations TypeScript (.d.ts) pour une meilleure expérience développeur.

4. **Versionnement sémantique** : La séparation claire entre API publique et implémentation interne facilite le respect du versionnement sémantique.

5. **Documentation automatique** : La structure facilite la génération de documentation automatique (par exemple avec TypeDoc).

### 4.3 Configuration du bundling

Pour rendre le composant 'core' bundlisable et distribuable via npm, nous recommandons la configuration suivante :

#### 4.3.1 Configuration de Rollup

Rollup est particulièrement adapté pour les bibliothèques en raison de son excellent support du tree-shaking. Voici une configuration de base pour bundler le composant 'core' :

```javascript
// rollup.config.js
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';
import dts from 'rollup-plugin-dts';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';

const packageJson = require('./package.json');

export default [
  // Configuration pour le code JavaScript
  {
    input: 'src/index.ts',
    output: [
      {
        file: packageJson.main,
        format: 'cjs',
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve(),
      commonjs(),
      typescript({ tsconfig: './tsconfig.json' }),
      terser(),
    ],
    external: ['react', 'react-dom', '@reduxjs/toolkit', 'redux'],
  },
  // Configuration pour les fichiers de déclaration TypeScript
  {
    input: 'dist/esm/types/karmyc/index.d.ts',
    output: [{ file: 'dist/index.d.ts', format: 'esm' }],
    plugins: [dts()],
  },
];
```

#### 4.3.2 Configuration du package.json

Le fichier `package.json` doit être configuré pour prendre en charge différents environnements et systèmes de modules :

```json
{
  "name": "karmyc-layout",
  "version": "0.1.0",
  "description": "Core layout system for layout system",
  "main": "dist/cjs/index.js",
  "module": "dist/esm/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist"
  ],
  "sideEffects": false,
  "scripts": {
    "build": "rollup -c",
    "lint": "eslint src/core --ext .ts,.tsx",
    "test": "jest"
  },
  "peerDependencies": {
    "react": "^16.12.0",
    "react-dom": "^16.12.0",
    "@reduxjs/toolkit": "^1.9.0",
    "redux": "^4.2.0"
  },
  "devDependencies": {
    // Dépendances de développement nécessaires
  }
}
```

#### 4.3.3 Configuration de TypeScript

Le fichier `tsconfig.json` doit être configuré pour générer des déclarations de types et prendre en charge les différents formats de modules :

```json
{
  "compilerOptions": {
    "target": "es2018",
    "module": "esnext",
    "lib": ["dom", "esnext"],
    "importHelpers": true,
    "declaration": true,
    "sourceMap": true,
    "rootDir": "./src",
    "outDir": "./dist/esm",
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "node",
    "jsx": "react",
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/core"],
  "exclude": ["node_modules", "dist", "**/*.test.ts", "**/*.test.tsx"]
}
```

### 4.4 Conventions de nommage et bonnes pratiques

Pour assurer la cohérence et la maintenabilité du code, nous recommandons les conventions suivantes :

#### 4.4.1 Conventions de nommage

- **Fichiers** : 
  - Utiliser le PascalCase pour les composants React (ex: `AreaComponent.tsx`)
  - Utiliser le camelCase pour les hooks, utilitaires et autres fichiers (ex: `useArea.ts`, `areaUtils.ts`)
  - Utiliser le kebab-case pour les fichiers de configuration (ex: `rollup-config.js`)

- **Exports** :
  - Utiliser des exports nommés pour la plupart des fonctionnalités
  - Réserver les exports par défaut pour les composants React principaux
  - Préfixer les hooks avec `use` (ex: `useArea`, `useContextMenu`)
  - Préfixer les types avec `T` et les interfaces avec `I` (ex: `TAreaProps`, `IAreaConfig`)

- **Constantes** :
  - Utiliser le SNAKE_CASE pour les constantes (ex: `DEFAULT_AREA_WIDTH`)

#### 4.4.2 Documentation du code

- Documenter toutes les fonctions, classes et interfaces publiques avec des commentaires JSDoc
- Inclure des exemples d'utilisation dans la documentation des hooks et composants principaux
- Documenter les paramètres génériques et les types de retour

#### 4.4.3 Tests

- Créer des tests unitaires pour chaque fonctionnalité
- Organiser les tests en miroir de la structure du code source
- Utiliser des snapshots pour les tests de composants UI
- Tester les cas limites et les cas d'erreur

### 4.5 Interfaces publiques vs. privées

Pour distinguer clairement les interfaces publiques des interfaces privées :

#### 4.5.1 Interfaces publiques

Les interfaces publiques constituent l'API que les utilisateurs de la bibliothèque utiliseront :

- Hooks React (ex: `useArea`, `useContextMenu`)
- Composants React (ex: `AreaComponent`, `ContextMenuComponent`)
- Types et interfaces nécessaires pour utiliser l'API (ex: `AreaProps`, `ContextMenuConfig`)
- Fonctions utilitaires destinées à être utilisées par les consommateurs

Ces interfaces doivent être :
- Stables et suivre le versionnement sémantique
- Bien documentées avec des exemples d'utilisation
- Exportées explicitement depuis les fichiers `index.ts`

#### 4.5.2 Interfaces privées

Les interfaces privées sont utilisées en interne et ne doivent pas être utilisées directement par les consommateurs :

- Implémentations internes des hooks et composants
- Types et interfaces utilisés uniquement en interne
- Fonctions utilitaires internes
- Logique de gestion d'état interne

Ces interfaces doivent être :
- Non exportées depuis les fichiers `index.ts`
- Potentiellement préfixées avec `_` pour indiquer leur nature privée
- Documentées pour les développeurs de la bibliothèque, mais pas nécessairement pour les utilisateurs

### 4.6 Stratégie d'exportation

Pour contrôler précisément ce qui est exposé aux utilisateurs de la bibliothèque, nous recommandons la stratégie d'exportation suivante :

#### 4.6.1 Fichier index.ts principal

Le fichier `src/index.ts` est le point d'entrée principal et ne doit exporter que l'API publique :

```typescript
// src/index.ts

// Exporter les hooks publics
export * from './hooks';

// Exporter les composants publics
export * from './components';

// Exporter les types publics
export * from './types';

// Exporter les constantes publiques
export * from './constants';

// Exporter le provider principal
export { CoreProvider } from './providers';

// Exporter la fonction d'initialisation
export { initCore } from './init';
```

#### 4.6.2 Fichiers index.ts des sous-dossiers

Chaque sous-dossier doit avoir son propre fichier `index.ts` qui n'exporte que les éléments destinés à être publics :

```typescript
// src/hooks/index.ts

// Exporter les hooks publics
export { useArea } from './useArea';
export { useContextMenu } from './useContextMenu';
export { useProject } from './useProject';
// Ne pas exporter les hooks internes comme _useAreaInternal
```

Cette approche permet un contrôle précis sur l'API publique et facilite le tree-shaking.
