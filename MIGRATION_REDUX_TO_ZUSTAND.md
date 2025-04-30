# Migration de Redux vers Zustand dans Karmyc Core

## Introduction

Ce document résume la migration **terminée** du système de gestion d'état de Karmyc Core, passant de Redux Toolkit à Zustand. L'objectif de simplification de l'architecture, d'amélioration des performances et de facilitation de la maintenance a été atteint.

## Inventaire des slices Redux existants

// Tous les slices Redux listés ci-dessous ont été migrés vers des stores Zustand ou supprimés.
```
const reduxSlices = [
  {
    nom: 'areaSlice',
    chemin: 'Supprimé',
    dépendances: ['historySlice', 'diffSlice'], // Dépendances Redux initiales
    // STATUT ZUSTAND: Migré vers 'areaStore.ts'.
    // Middlewares Zustand: devtools, persist, immer utilisés.
    actions: [
      // Actions Redux originales (statut final):
      'addArea',                  // Migré
      'removeArea',               // Migré
      'setActiveArea',            // Migré
      'updateArea',               // Migré
      'cleanState',               // Obsolète / Non migré
      'setFields',                // Obsolète / Remplacé par updateArea
      'setJoinAreasPreview',      // Remplacé par setJoinPreview
      'joinAreas',                // À FAIRE: Restaurer/Implémenter la logique de fusion (joinOrMoveArea)
      'convertAreaToRow',         // Remplacé par splitArea
      'insertAreaIntoRow',        // Remplacé par splitArea
      'setRowSizes',              // Migré
      'setAreaType',              // Remplacé par updateArea
      'setViewports',             // Non utilisé (viewports calculés)
      'setAreaToOpen',            // Migré
      'updateAreaToOpenPosition', // Migré
      'finalizeAreaPlacement',    // Placeholder (non implémenté)
      'clearAreaToOpen'           // Remplacé par `setAreaToOpen(null)` ou `cleanupTemporaryStates`
      // --- Actions Zustand ajoutées --- 
      // 'splitArea',
      // 'setJoinPreview',
      // 'getLastSplitResult',
      // 'joinOrMoveArea' (placeholder),
      // 'cleanupTemporaryStates'
    ],
    sélecteurs: [
      // Sélecteurs Redux originaux et leur statut Zustand:
      'selectAreaState',          // Remplacé par accès direct `useAreaStore()`
      'selectAllAreas',           // Remplacé par `getAllAreas()` ou `state.areas`
      'selectActiveAreaId',       // Remplacé par `state.activeAreaId`
      'selectActiveArea',         // Remplacé par `getActiveArea()`
      'selectAreaById'            // Remplacé par `getAreaById()`
      // --- Sélecteurs Zustand ajoutés ---
      // 'getActiveArea',
      // 'getAreaById',
      // 'getAllAreas',
      // 'getAreaErrors'
    ],
    stockagePersistant: true, // Géré via middleware `persist` Zustand avec `partialize`.
    complexité: 'Élevée' // Reste élevé avec la logique de layout
  },
  {
    nom: 'contextMenuSlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Migré vers 'contextMenuStore.ts'
    dépendances: [],
    actions: [
      'openContextMenu',           // Ouvre le menu contextuel
      'closeContextMenu',          // Ferme le menu contextuel
      'openCustomContextMenu',     // Ouvre un menu contextuel personnalisé
      'updateContextMenuPosition', // Met à jour la position du menu
      'updateContextMenuItems',    // Met à jour les éléments du menu
      'clearErrors'                // Efface les erreurs
    ],
    sélecteurs: [
      'selectContextMenuVisible',
      'selectContextMenuPosition',
      'selectContextMenuItems',
      'selectContextMenuTargetId',
      'selectContextMenuMetadata',
      'selectCustomContextMenu',
      'selectContextMenuErrors'
    ],
    stockagePersistant: false,
    complexité: 'Moyenne'
  },
  {
    nom: 'historySlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Fonctionnalité d'historique gérée différemment.
    // areaStore: Utilise zundo (middleware temporal) - mais hook non utilisé.
    // spaceStore: Utilise une gestion de diffs personnalisée.
    dépendances: ['diffSlice', 'areaSlice'],
    actions: [
      'addHistoryEntry', // Ajoute une entrée à l'historique 
      'undo',            // Annule la dernière action
      'redo',            // Rétablit la dernière action annulée
      'reset',           // Réinitialise l'historique
      'finishAction'     // Marque la fin d'une opération undo/redo
    ],
    sélecteurs: [
      'hasFutureEntriesForArea',
      'hasPastEntriesForArea'
    ],
    stockagePersistant: false,
    complexité: 'Élevée'
  },
  {
    nom: 'notificationSlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Migré vers 'notificationStore.ts'
    dépendances: [],
    actions: [
      'addNotification',      // Ajoute une notification
      'removeNotification',   // Supprime une notification
      'clearNotifications',   // Efface toutes les notifications
      'setMaxNotifications'   // Définit le nombre maximum de notifications
    ],
    sélecteurs: [
      'selectNotifications',
      'selectMaxNotifications'
    ],
    stockagePersistant: false,
    complexité: 'Simple'
  },
  {
    nom: 'diffSlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Supprimé, redondant avec la gestion d'historique de Zustand/personnalisée.
    dépendances: ['areaSlice'],
    actions: [
      'addDiff',           // Ajoute un diff
      'removeDiff',        // Supprime un diff
      'setActiveDiff',     // Définit le diff actif
      'clearDiffs',        // Efface tous les diffs
      'updateDiffConfig',  // Met à jour la configuration des diffs
      'applyDiff',         // Applique un diff
      'revertDiff',        // Annule un diff
      'clearErrors'        // Efface les erreurs
    ],
    sélecteurs: [
      'selectDiffState',
      'selectAllDiffs',
      'selectActiveDiffId',
      'selectDiffById',
      'selectActiveDiff',
      'selectDiffHistory',
      'selectDiffErrors'
    ],
    stockagePersistant: false,
    complexité: 'Élevée'
  },
  {
    nom: 'stateSlice', 
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Supprimé (non utilisé). La partie 'loading' est dans 'loadingStore.ts'.
    dépendances: [],
    actions: [
      'registerState',     // Enregistre un nouvel état
      'unregisterState',   // Supprime un état enregistré
      'setActiveState',    // Définit l'état actif
      'updateState',       // Met à jour un état
      'clearStates',       // Efface tous les états
      'updateStateConfig', // Met à jour la configuration des états
      'transitionState',   // Effectue une transition d'état
      'clearErrors',       // Efface les erreurs
      'setLoading',        // Définit l'état de chargement
      'clearLoading'       // Efface l'état de chargement
    ],
    sélecteurs: [
      'selectStateState',
      'selectAllStates',
      'selectActiveStateId',
      'selectStateConfig',
      'selectStateById',
      'selectActiveState',
      'selectStatesByType',
      'selectStateErrors',
      'selectStateLoading'
    ],
    stockagePersistant: true,
    complexité: 'Moyenne'
  },
  {
    nom: 'toolbarSlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Supprimé (non utilisé, approche différente dans Toolbar.tsx).
    dépendances: [],
    actions: [
      'registerToolbar',      // Enregistre une barre d'outils
      'unregisterToolbar',    // Supprime une barre d'outils
      'setActiveToolbar',     // Définit la barre d'outils active
      'setActiveTool',        // Définit l'outil actif
      'updateToolbarItems',   // Met à jour les éléments de la barre d'outils
      'updateToolbarConfig',  // Met à jour la configuration de la barre d'outils
      'clearErrors'           // Efface les erreurs
    ],
    sélecteurs: [
      'selectToolbarState',
      'selectAllToolbars',
      'selectActiveToolbarId',
      'selectActiveToolId',
      'selectToolbarById',
      'selectToolbarConfig',
      'selectActiveToolbar',
      'selectActiveToolbarConfig',
      'selectToolbarErrors'
    ],
    stockagePersistant: true,
    complexité: 'Moyenne'
  },
  {
    nom: 'spaceSlice',
    chemin: 'Supprimé',
    // STATUT ZUSTAND: Migré vers 'spaceStore.ts'
    dépendances: ['areaSlice'],
    actions: [
      'addSpace',                // Ajoute un nouvel espace
      'removeSpace',             // Supprime un espace existant
      'setActiveSpace',          // Définit l'espace actif
      'updateSpace',             // Met à jour un espace
      'updateSpaceSharedState'   // Met à jour l'état partagé d'un espace
    ],
    sélecteurs: [
      'selectAllSpaces',
      'selectActiveSpaceId',
      'selectActiveSpace',
      'selectSpaceById'
    ],
    stockagePersistant: true,
    complexité: 'Moyenne'
  }
]
);
```
**Note importante:** Le fichier `area.ts` (ancien slice simplifié) a également été supprimé.

## Recensement des composants utilisant Redux

// Tous les composants listés ont été migrés pour utiliser les stores Zustand.
```typescript
// Analyse des composants utilisant Redux (Mise à jour YYYY-MM-DD basée sur la migration en cours)
const reduxComponents = [
  {
    composant: 'NotificationList',
    chemin: 'packages/core/src/components/NotificationList.tsx',
    slicesUtilisés: ['notificationSlice'], // À vérifier
    statutMigration: 'Migré (utilise useNotificationStore)',
    prioritéMigration: 'Moyenne'
  },
  {
    composant: 'CustomContextMenu',
    chemin: 'packages/core/src/components/context-menu/CustomContextMenu.tsx',
    slicesUtilisés: ['contextMenuSlice'], // À vérifier
    statutMigration: 'Migré (utilise useContextMenuStore)',
    prioritéMigration: 'Moyenne'
  },
  {
    composant: 'MenuBar',
    chemin: 'packages/core/src/components/area/components/MenuBar.tsx',
    slicesUtilisés: [], // Utilise dispatch directement (potentiellement pour actions non-area)
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'Moyenne' // Priorité peut dépendre des actions dispatchées
  },
  {
    composant: 'Area',
    chemin: 'packages/core/src/components/area/components/Area.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  },
  {
    composant: 'AreaRowSeparators',
    chemin: 'packages/core/src/components/area/components/AreaRowSeparators.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  },
  {
    composant: 'AreaToOpenPreview',
    chemin: 'packages/core/src/components/area/components/AreaToOpenPreview.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  },
   {
    composant: 'JoinAreaPreview', // Ajout du composant manquant
    chemin: 'packages/core/src/components/area/components/JoinAreaPreview.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  },
  {
    composant: 'AreaRoot',
    chemin: 'packages/core/src/components/area/components/AreaRoot.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  },
  {
    composant: 'NormalContextMenu',
    chemin: 'packages/core/src/components/context-menu/normal/NormalContextMenu.tsx',
    slicesUtilisés: ['contextMenuSlice'], // À vérifier
    statutMigration: 'Migré (utilise useContextMenuStore)',
    prioritéMigration: 'Moyenne'
  },
    {
    composant: 'KarmycInitializer',
    chemin: 'packages/core/src/providers/KarmycInitializer.tsx',
    slicesUtilisés: ['areaSlice'],
    statutMigration: 'Migré (utilise useAreaStore)',
    prioritéMigration: 'FAIT'
  }
  // ... (Note sur composants obsolètes - inchangée) ...
]
```

## État final de la migration

### Structure Zustand

1. **Structure de dossiers**: Les stores Zustand se trouvent dans `packages/core/src/stores/`. Chaque store principal (`areaStore`, `spaceStore`, etc.) a son propre fichier.
2. **Stores implémentés**: `areaStore`, `spaceStore`, `contextMenuStore`, `notificationStore`, `loadingStore`.

### Fonctionnalités spécifiques

1. **Système d'historique (undo/redo)**:
   - `areaStore`: Utilise un middleware Zustand (`immer` + `temporal`/`zundo`), mais le hook d'accès (`useHistory`) a été supprimé car non utilisé. La fonctionnalité n'est donc pas active.
   - `spaceStore`: Implémente un système d'historique personnalisé basé sur des diffs pour son `sharedState`.
2. **Persistance des données**:
   - Gérée via le middleware `persist` de Zustand.
   - `areaStore` et `spaceStore` sont configurés pour persister une partie de leur état dans `localStorage`.
3. **Système de plugins et middleware Redux**: Les middlewares Redux (`diffMiddleware`, `stateMiddleware`, `areaCleanupMiddleware`) ont été supprimés. Les fonctionnalités équivalentes (si nécessaires) devraient être implémentées via des middlewares Zustand ou directement dans les actions/logiques des stores.

### Composants et Nettoyage Redux

1. **Composants**: Tous les composants identifiés comme utilisant Redux ont été mis à jour pour utiliser les hooks et stores Zustand correspondants.
2. **Nettoyage**: Tous les slices Redux, le store Redux principal (`store/index.ts`), les middlewares Redux non utilisés, et les dépendances associées (`@reduxjs/toolkit`, `react-redux`, `redux-persist`, `redux-undo`) ont été supprimés du package `core`.

## Tests

*(Cette section peut nécessiter une mise à jour basée sur l'état réel des tests)*
1. **Tests unitaires**: Des tests pour `areaStore` existent. Des tests supplémentaires pour les autres stores et utilitaires sont recommandés.
2. **Tests fonctionnels/intégration**: À renforcer pour couvrir les interactions entre les stores Zustand et les flux utilisateurs complets.
3. **Tests de performance**: À réaliser pour comparer les performances avant/après si pertinent.

## Exemples d'implémentation détaillés

### Store des zones (areaStore.ts)

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface AreaState {
  // Définition des types...
}

export const useAreaStore = create<AreaState>()(
  devtools(
    persist(
      immer((set, get) => ({
        // État initial
        areas: {},
        activeAreaId: null,
        
        // Actions
        setActiveArea: (id) => set({ activeAreaId: id }),
        
        updateArea: (areaData) => set((state) => {
          state.areas[areaData.id] = {
            ...state.areas[areaData.id],
            ...areaData
          };
        }),
        
        // Autres actions...
        
        // Sélecteurs complexes
        getActiveArea: () => {
          const state = get();
          return state.activeAreaId ? state.areas[state.activeAreaId] : null;
        }
      })),
      { name: 'area-storage' }
    )
  )
);
```

### Système d'historique (historyStore.ts)

```typescript
// Note: Ce store n'a pas été implémenté. 
// L'historique pour areaStore utilisait temporal/zundo (maintenant inactif).
// L'historique pour spaceStore est implémenté différemment dans spaceStore.ts.
// Exemple de l'approche envisagée initialement (basée sur diffs, similaire à spaceStore) :
```typescript
// import { create } from 'zustand';
// import { devtools } from 'zustand/middleware';
// import { useAreaStore } from './areaStore';
// import { generateDiff, applyDiff } from '../utils/diffUtils';
 
interface HistoryEntry {
  actionType: string;
  timestamp: number;
  diffs: any[];
}

interface HistoryState {
  past: HistoryEntry[];
  future: HistoryEntry[];
  isPerformingAction: boolean;
  
  // Actions
  addHistoryEntry: (entry: Omit<HistoryEntry, 'timestamp'>) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

export const useHistoryStore = create<HistoryState>()(
  devtools((set, get) => ({
    past: [],
    future: [],
    isPerformingAction: false,
    
    addHistoryEntry: (entry) => set((state) => ({
      past: [...state.past, { ...entry, timestamp: Date.now() }],
      future: [],
    })),
    
    undo: () => {
      const { past, future } = get();
      if (past.length === 0) return;
      
      set({ isPerformingAction: true });
      
      const lastAction = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      
      // Appliquer l'inversion du diff
      const areaStore = useAreaStore.getState();
      // Code pour appliquer l'inversion...
      
      set({
        past: newPast,
        future: [lastAction, ...future],
        isPerformingAction: false,
      });
    },
    
    redo: () => {
      // Logique pour redo...
    },
    
    canUndo: () => get().past.length > 0,
    canRedo: () => get().future.length > 0,
  }))
);
```

## Stratégie de tests détaillée

// Section obsolète (plan initial)

## Stratégie de déploiement progressif

// Section obsolète (plan initial)

## Dépendances externes à Redux

// Les dépendances Redux (`@reduxjs/toolkit`, `react-redux`, `redux-persist`, `redux-undo`) ont été supprimées du package `core`.

## Stratégie pour les middlewares

// Le système de middleware Redux a été supprimé. Les middlewares Zustand (`devtools`, `persist`, `immer`, `performance`) sont utilisés directement lors de la création des stores Zustand.
```typescript
// Middleware pour la journalisation des actions
const logMiddleware = (config) => (set, get, api) => config(
  (args) => {
    console.log('État précédent:', get());
    console.log('Action:', args);
    set(args);
    console.log('Nouvel état:', get());
  },
  get,
  api
);
```

## Timeline du projet

| Étape | Activités | Délai avec IA | Délai standard |
|-------|-----------|---------------|----------------|
| 1 | Préparation et implémentation des stores de base | 1-2 jours | 1 semaine |
| 2 | Migration du système d'historique et middlewares | 1-2 jours | 1-2 semaines |
| 3 | Migration des composants | 1-2 jours | 1-2 semaines |
| 4 | Tests, corrections et optimisations | 2-3 jours | 1-2 semaines |
| 5 | Documentation et finalisation | 1 jour | 1 semaine |
| **Total** | | **6-10 jours** | **5-8 semaines** |

## Conclusion

La migration de Redux vers Zustand est **terminée**. L'ensemble du code Redux (slices, store, middlewares, dépendances) a été retiré du package `core`. L'état de l'application est maintenant géré par un ensemble de stores Zustand modulaires.

**Points restants / Améliorations possibles :**
*   **Activer l'historique (Undo/Redo)**: Décider si la fonctionnalité est souhaitée pour `areaStore` et, si oui, réintroduire et connecter `useHistory` (ou une approche similaire) à l'interface.
*   **Tests**: Compléter la couverture de tests unitaires et d'intégration pour les stores Zustand.
*   **Documentation**: Mettre à jour la documentation générale pour refléter l'utilisation de Zustand.

## Approche assistée par IA

// Section obsolète (description de l'approche)

## Workflow de migration avec IA

// Section obsolète (plan initial)

## Risques et mitigations

// Section obsolète (plan initial)

## Références

- [Documentation Zustand](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Comparaison Redux vs Zustand](https://docs.pmnd.rs/zustand/getting-started/comparison)
- [Middleware Zustand](https://docs.pmnd.rs/zustand/guides/middlewares)
- [Immer avec Zustand](https://docs.pmnd.rs/zustand/guides/updating-state#with-immer)
- [Persistance avec Zustand](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)

## Auteur

Yann Loosli (yann@gamesberry.fr)

## Licence

MIT 

// ## Mise à jour de la documentation
// La documentation technique générale devrait être mise à jour pour refléter l'utilisation de Zustand.

### Matrice de migration des plugins

// Section obsolète (plus de plugins Redux)

### Approche pour les sélecteurs optimisés

// Les sélecteurs Redux optimisés avec `createSelector` (Reselect) ont été remplacés par des sélecteurs directs ou memoïsés dans les stores/hooks Zustand.
```typescript
// Avant avec Redux Toolkit (`createSelector`)
export const selectActiveArea = createSelector(
  [selectAllAreas, selectActiveAreaId],
  (areas, activeId) => activeId ? areas[activeId] : null
);
```

## Tests des cas d'utilisation spécifiques

// Section obsolète (plan initial)
