# Migration de Redux vers Zustand dans Karmyc Core

## Introduction

Ce document présente le plan de migration **en cours** du système de gestion d'état de Karmyc Core, passant de Redux Toolkit à Zustand. Cette initiative vise à simplifier l'architecture, améliorer les performances et faciliter la maintenance du code.

## Pourquoi migrer vers Zustand ?

### Avantages de Zustand par rapport à Redux

| Aspect | Redux Toolkit | Zustand | Avantage |
|--------|---------------|---------|----------|
| Taille | ~10.5KB | ~1.1KB | Zustand est ~10x plus léger |
| Configuration | Complexe (store, slices, reducers, actions) | Simple (hooks) | Moins de boilerplate avec Zustand |
| API | Verbeux | Minimaliste | Code plus concis avec Zustand |
| Réactivité | Re-rendus potentiellement plus fréquents | Re-rendus optimisés | Meilleures performances avec Zustand |
| Modularité | Store monolithique | Stores multiples | Architecture plus flexible avec Zustand |
| Intégration React | Nécessite Provider | Pas de Provider nécessaire | Mise en place simplifiée avec Zustand |

### Exemples concrets de simplification

**Avec Redux (actuel) :**

```typescript
// store/slices/areaSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const areaSlice = createSlice({
  name: 'area',
  initialState: {
    areas: {},
    activeAreaId: null,
  },
  reducers: {
    setActiveArea: (state, action: PayloadAction<string>) => {
      state.activeAreaId = action.payload;
    },
    updateArea: (state, action) => {
      state.areas[action.payload.id] = {
        ...state.areas[action.payload.id],
        ...action.payload
      };
    }
  }
});

export const { setActiveArea, updateArea } = areaSlice.actions;
export default areaSlice.reducer;

// Utilisation dans un composant
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { setActiveArea } from '../store/slices/areaSlice';

const AreaComponent = ({ id }) => {
  const dispatch = useDispatch();
  const area = useSelector((state: RootState) => state.areas.areas[id]);
  
  return (
    <div onClick={() => dispatch(setActiveArea(id))}>
      {area.name}
    </div>
  );
};
```

**Avec Zustand (objectif) :**

```typescript
// store/areaStore.ts
import { create } from 'zustand';

export const useAreaStore = create((set) => ({
  areas: {},
  activeAreaId: null,
  
  setActiveArea: (id) => set({ activeAreaId: id }),
  
  updateArea: (areaData) => set((state) => ({
    areas: {
      ...state.areas,
      [areaData.id]: {
        ...state.areas[areaData.id],
        ...areaData
      }
    }
  }))
}));

// Utilisation dans un composant
import { useAreaStore } from '../store/areaStore';

const AreaComponent = ({ id }) => {
  const area = useAreaStore((state) => state.areas[id]);
  const setActiveArea = useAreaStore((state) => state.setActiveArea);
  
  return (
    <div onClick={() => setActiveArea(id)}>
      {area.name}
    </div>
  );
};
```

## Inventaire des slices Redux existants

```typescript
// Liste complète des slices Redux à migrer (vérifiée par analyse approfondie du code source)
const reduxSlices = [
  {
    nom: 'areaSlice',
    chemin: 'packages/core/src/store/slices/areaSlice.ts',
    dépendances: ['historySlice', 'diffSlice'], // Dépendances Redux initiales
    // STATUT ZUSTAND: Store 'areaStore.ts' créé.
    // Middlewares Zustand: devtools, persist, immer utilisés.
    actions: [
      // Actions Redux originales et leur statut Zustand:
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
    chemin: 'packages/core/src/store/slices/contextMenuSlice.ts',
    // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/historySlice.ts',
     // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/notificationSlice.ts',
    // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/diffSlice.ts',
    // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/stateSlice.ts',
    // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/toolbarSlice.ts',
    // STATUT ZUSTAND: Non migré
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
    chemin: 'packages/core/src/store/slices/spaceSlice.ts',
    // STATUT ZUSTAND: Non migré (mais un useSpace existe potentiellement)
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
```

**Note importante:** Le fichier `area.ts` présent dans le dossier des slices est un slice simplifié qui semble être utilisé pour des cas spécifiques ou des tests. Il n'est pas intégré dans le store principal et n'est donc pas inclus dans cet inventaire.

## Recensement des composants utilisant Redux

```typescript
// Analyse des composants utilisant Redux (Mise à jour YYYY-MM-DD basée sur la migration en cours)
const reduxComponents = [
  {
    composant: 'NotificationList',
    chemin: 'packages/core/src/components/NotificationList.tsx',
    slicesUtilisés: ['notificationSlice'], // À vérifier
    statutMigration: 'Non migré',
    prioritéMigration: 'Moyenne'
  },
  {
    composant: 'CustomContextMenu',
    chemin: 'packages/core/src/components/context-menu/CustomContextMenu.tsx',
    slicesUtilisés: ['contextMenuSlice'], // À vérifier
    statutMigration: 'Non migré',
    prioritéMigration: 'Moyenne'
  },
  {
    composant: 'MenuBar',
    chemin: 'packages/core/src/components/area/components/MenuBar.tsx',
    slicesUtilisés: [], // Utilise dispatch directement (potentiellement pour actions non-area)
    statutMigration: 'Non migré',
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
    statutMigration: 'Non migré',
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

## Plan de migration

### Phase 1 : Préparation

1. **Création d'une branche dédiée** : `feature/zustand-migration` - **FAIT**
2. **Installation de Zustand** : `yarn add zustand` - **FAIT**
3. **Audit du code actuel** : Identifier tous les slices Redux et leurs dépendances - **FAIT** (Voir inventaire ci-dessus)

### Phase 2 : Implémentation des stores Zustand

1. **Créer la structure de base** - **FAIT** (`src/stores/`)
2. **Implémenter les stores Zustand équivalents aux slices Redux**
   - `areaStore.ts`: **EN COURS** (Logique de base + layout/split migrés. **Priorité : Restaurer la logique de fusion (join)**. Finalize en attente).
   - Autres stores (`contextMenu`, `history`, `notification`, etc.) : **À FAIRE**.
3. **Créer des hooks personnalisés pour abstraire l'accès aux stores** - **PARTIEL** (Fait implicitement via `useAreaStore`, à généraliser si besoin).

### Phase 3 : Migration des fonctionnalités spéciales

1. **Système d'historique (undo/redo)** - **À FAIRE**
   - Implémenter un middleware Zustand pour l'historique (ou lib externe)
   - Recréer la logique de diff et d'application des changements
2. **Persistance des données** - **PARTIELLEMENT FAIT** (Middleware `persist` configuré pour `areaStore`. À vérifier/configurer pour les autres stores persistants).
3. **Système de plugins et middleware** - **À FAIRE**

### Phase 4 : Migration des composants

1. **Approche systématique** - **EN COURS**
   - Composants liés à `areaStore`: `Area`, `AreaRoot`, `AreaRowSeparators`, `AreaToOpenPreview`, `JoinAreaPreview`, `KarmycInitializer` - **FAIT**.
   - Autres composants listés : **À FAIRE**.
2. **Mettre à jour le Provider principal** - **À FAIRE** (Supprimer `<Provider store={store}>`).

### Phase 5 : Tests et validation

1. **Tests unitaires** - **À FAIRE** (Les tests pour `areaStore` ont été adaptés).
2. **Tests fonctionnels** - **EN COURS** (Tests manuels effectués pendant la migration).
3. **Tests de performance** - **À FAIRE**.

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
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { useAreaStore } from './areaStore';
import { generateDiff, applyDiff } from '../utils/diffUtils';

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

```typescript
// Plan de tests complet
const testingStrategy = {
  testsUnitaires: {
    stores: [
      {
        store: 'areaStore',
        tests: [
          'initialState est correct',
          'setActiveArea modifie correctement activeAreaId',
          'updateArea fusionne correctement les données',
          'createArea ajoute correctement une nouvelle zone',
          'deleteArea supprime correctement une zone'
        ],
        couvertureVisée: '95%'
      },
      // Détails pour chaque store...
    ],
    utilsTests: [
      'generateDiff produit un diff correct',
      'applyDiff applique correctement les changements',
      'middleware de persistance sauvegarde correctement l'état'
    ]
  },
  testsIntégration: [
    'Interaction entre areaStore et historyStore lors d'une modification',
    'Synchronisation du contexte menu avec les actions disponibles',
    'Persistance et restauration de l'état complet',
    'Propagation des notifications sur les actions utilisateur'
  ],
  testsPerformance: [
    {
      scénario: 'Manipulation d'une large zone',
      métriques: ['temps de rendu', 'utilisation mémoire', 'réactivité UI'],
      objectifs: 'Amélioration de 30% vs Redux'
    },
    {
      scénario: 'Historique volumineux',
      métriques: ['temps d'undo/redo', 'empreinte mémoire'],
      objectifs: 'Amélioration de 40% vs Redux'
    }
  ],
  outilsDeTest: {
    unitaires: 'Jest avec React Testing Library',
    performance: 'Lighthouse et mesures personnalisées',
    couverture: 'Istanbul/nyc'
  }
}
```

## Stratégie de déploiement progressif

```typescript
// Plan de déploiement progressif
const deploymentStrategy = {
  phases: [
    {
      nom: 'Phase Alpha',
      composants: ['NotificationCenter', 'ContextMenu'],
      durée: '3 jours',
      critèresAcceptation: [
        'Fonctionnalités identiques à Redux',
        'Pas de régression UI/UX',
        'Tests verts à 100%'
      ]
    },
    {
      nom: 'Phase Beta',
      composants: ['MainLayout', 'uiStateStore'],
      durée: '3 jours',
      critèresAcceptation: [
        'Intégration réussie avec composants Alpha',
        'Performance équivalente ou supérieure',
        'Validation par équipe UX'
      ]
    },
    {
      nom: 'Phase Critique',
      composants: ['AreaExplorer', 'AreaEditor', 'historyStore'],
      durée: '5 jours',
      critèresAcceptation: [
        'Système d'historique 100% fonctionnel',
        'Performances supérieures de 25%+',
        'Test utilisateurs internes positifs'
      ]
    },
    {
      nom: 'Phase Release',
      action: 'Suppression complète de Redux',
      durée: '2 jours',
      critèresAcceptation: [
        'Aucune référence à Redux dans le code',
        'Bundle size réduit',
        'Documentation à jour'
      ]
    }
  ],
  rollbackStrategy: {
    critèresDéclenchement: [
      'Bugs critiques non résolus sous 4h',
      'Performance dégradée de plus de 10%',
      'Feedback utilisateur négatif'
    ],
    procédure: [
      'Tag git du dernier état stable',
      'Scripts de restauration automatisés',
      'Communication d'incident'
    ]
  }
}
```

## Dépendances externes à Redux

```typescript
// Inventaire des dépendances externes liées à Redux (Mise à jour YYYY-MM-DD)
const externalDependencies = [
  {
    bibliothèque: 'redux-persist',
    utilisation: 'Persistance de l'état Redux',
    statutMigration: 'Remplacé par le middleware `persist` de Zustand pour `areaStore`. À vérifier pour les autres stores.',
    complexité: 'Faible',
    codeAffecté: ['src/store/index.ts', 'src/stores/areaStore.ts']
  },
  {
    bibliothèque: 'redux-undo',
    utilisation: 'Fonctionnalité undo/redo',
    statutMigration: 'Non migré. Stratégie : middleware Zustand personnalisé ou lib externe (ex: zundo).',
    complexité: 'Élevée',
    codeAffecté: ['src/store/slices/historySlice.ts']
  },
]
```

## Stratégie pour les middlewares

Pour remplacer le système de middleware Redux, nous pouvons créer un système personnalisé avec Zustand :

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

// Middleware pour le système de plugins
const pluginMiddleware = (plugins) => (config) => (set, get, api) => config(
  (args) => {
    // Exécuter les plugins avant l'action
    plugins.forEach(plugin => {
      if (plugin.beforeAction) plugin.beforeAction(args, get());
    });
    
    // Appliquer les changements
    set(args);
    
    // Exécuter les plugins après l'action
    plugins.forEach(plugin => {
      if (plugin.afterAction) plugin.afterAction(args, get());
    });
  },
  get,
  api
);

// Utilisation des middlewares
export const useStore = create(
  logMiddleware(
    pluginMiddleware([/* plugins */])(
      (set, get) => ({
        // État et actions...
      })
    )
  )
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

## Approche assistée par IA

Cette migration sera réalisée en utilisant une IA comme principal agent de transformation. Cette approche présente plusieurs avantages :

### Avantages de la migration par IA

1. **Rapidité d'exécution** : L'IA peut analyser et transformer le code à une vitesse bien supérieure à celle d'un développeur humain, réduisant les délais de semaines à quelques jours.

2. **Cohérence** : L'IA applique systématiquement les mêmes patterns de transformation à travers toute la base de code, assurant une cohérence parfaite.

3. **Réduction des erreurs manuelles** : Les erreurs typiques de copier-coller ou d'oubli sont évitées grâce à l'approche systématique de l'IA.

4. **Gestion de la complexité** : L'IA peut traiter des structures de données complexes et des interdépendances difficiles à appréhender manuellement.

### Processus de migration assistée

1. **Analyse automatisée** : L'IA analysera d'abord la structure complète du code Redux existant, identifiant tous les slices, reducers, actions et leurs interdépendances.

2. **Génération de code** : Pour chaque slice Redux, l'IA générera automatiquement un store Zustand équivalent avec toutes les actions et sélecteurs nécessaires.

3. **Transformation des composants** : L'IA identifiera tous les composants utilisant Redux et les transformera pour utiliser les nouveaux stores Zustand.

4. **Validation et tests** : Des tests automatisés seront générés par l'IA pour valider que le comportement après migration est identique à celui d'avant.

### Supervision humaine

Bien que l'IA effectue l'essentiel du travail, une supervision humaine reste nécessaire pour :

- Valider les approches architecturales proposées
- Réviser les cas complexes ou ambigus
- Tester manuellement les fonctionnalités critiques
- Prendre les décisions finales sur l'intégration et le déploiement

### Outils et techniques d'IA utilisés

- **Analyse statique de code** : Pour comprendre la structure et les dépendances
- **Modèles de transformation** : Pour convertir systématiquement les patterns Redux vers Zustand
- **Génération de tests** : Pour vérifier la préservation du comportement
- **Vérification de cohérence** : Pour s'assurer que toutes les fonctionnalités sont correctement migrées

## Workflow de migration avec IA

Pour mettre en œuvre cette migration avec l'aide d'une IA, voici le workflow détaillé à suivre :

### Étape 1 : Préparation

1. **Création du dépôt de travail**
   - Créer une branche à partir de `main` : `git checkout -b feature/zustand-migration`
   - Installer Zustand : `yarn add zustand`
   - Installer immer pour Zustand si nécessaire : `yarn add immer`

2. **Analyse préliminaire par l'IA**
   - Fournir à l'IA l'accès au codebase
   - L'IA va réaliser un inventaire complet des :
     - Slices Redux et leur structure
     - Actions et reducers
     - Sélecteurs complexes
     - Utilisations de middleware
     - Composants utilisant Redux

3. **Validation du plan de migration**
   - L'IA génère un rapport d'analyse
   - Le développeur révise et approuve le plan
   - Définition des priorités pour les modules à migrer

### Étape 2 : Implémentation des stores

1. **Génération automatisée des stores**
   - L'IA crée la structure de dossier `src/stores/`
   - Pour chaque slice Redux, l'IA génère un store Zustand équivalent
   - L'IA implémente les middlewares nécessaires (persist, devtools, immer)

2. **Revue itérative**
   - Le développeur examine chaque store généré
   - L'IA applique les corrections et ajustements demandés
   - Validation des types et de la structure

### Étape 3 : Migration des fonctionnalités spéciales

1. **Système d'historique**
   - L'IA analyse le système d'historique Redux actuel
   - Création d'un middleware Zustand personnalisé pour l'historique
   - Tests de fonctionnalité pour vérifier la parité

2. **Migration des plugins et middleware**
   - L'IA adapte le système de plugins pour Zustand
   - Création des abstractions nécessaires pour maintenir l'API

### Étape 4 : Migration des composants

1. **Approche progressive**
   - L'IA identifie les dépendances entre composants
   - Migration en commençant par les composants de bas niveau
   - Remplacement progressif de `useSelector`/`useDispatch` par les hooks Zustand

2. **Vérifications automatiques**
   - L'IA génère des tests pour chaque composant migré
   - Vérification de la parité fonctionnelle
   - Analyse des performances pour confirmer les améliorations

### Étape 5 : Tests et validation

1. **Couverture de test**
   - L'IA identifie les scénarios critiques à tester
   - Génération de tests supplémentaires si nécessaire
   - Exécution de la suite de tests complète

2. **Analyse des performances**
   - Benchmarking automatisé avant/après
   - Identification des goulots d'étranglement éventuels
   - Optimisations ciblées si nécessaire

### Étape 6 : Finalisation

1. **Documentation**
   - L'IA génère la documentation des nouveaux stores et de leur utilisation
   - Mise à jour des exemples de code

2. **Pull Request et review**
   - Préparation de la PR
   - Revue finale du code
   - Fusion dans la branche principale

Ce workflow tire pleinement parti des capacités de l'IA pour accélérer considérablement le processus de migration, tout en maintenant un niveau élevé de qualité et de cohérence.

## Risques et mitigations

Bien que l'utilisation d'une IA pour la migration présente de nombreux avantages, certains risques doivent être pris en compte et atténués :

### Risques identifiés

1. **Compréhension incomplète des subtilités du code**
   - **Risque** : L'IA pourrait ne pas saisir certaines particularités ou intentions dans le code existant.
   - **Mitigation** : Révision humaine systématique des transformations proposées, particulièrement pour les parties critiques du code.

2. **Cas d'utilisation spécifiques de Redux non standard**
   - **Risque** : Des utilisations personnalisées ou avancées de Redux pourraient être mal interprétées.
   - **Mitigation** : Identifier en amont les patterns atypiques et fournir des directives spécifiques à l'IA pour ces cas.

3. **Intégrations tierces avec Redux**
   - **Risque** : Certaines bibliothèques tierces pourraient dépendre de Redux d'une manière qui rend la migration difficile.
   - **Mitigation** : Inventaire préalable des dépendances externes et plan d'adaptation spécifique pour chacune.

4. **Effets de bord non anticipés**
   - **Risque** : Des comportements subtils pourraient changer après la migration.
   - **Mitigation** : Tests de régression extensifs et période de validation étendue.

5. **Modèle mental de l'équipe**
   - **Risque** : L'équipe de développement pourrait avoir besoin de temps pour s'adapter au nouveau paradigme.
   - **Mitigation** : Documentation détaillée et sessions de formation sur Zustand et les nouveaux patterns.

### Stratégie de rollback

En cas de problèmes majeurs identifiés après la migration, une stratégie de rollback est prévue :

1. **Version taggée pré-migration** : Une version du code sera taggée avant toute modification.
2. **Phase de coexistence** : Possibilité de maintenir temporairement certains modules sous Redux pendant que d'autres sont migrés.
3. **Revert automatisé** : Scripts préparés pour revenir rapidement à la version Redux si nécessaire.

### Plan de tests renforcé

Pour garantir la qualité post-migration :

1. **Tests unitaires étendus** : Couverture accrue des tests unitaires, notamment sur les modules critiques.
2. **Tests d'intégration** : Vérification des interactions entre les modules migrés.
3. **Tests de performance** : Benchmarks avant/après pour quantifier les améliorations.
4. **Tests utilisateurs** : Phase de beta testing interne avant déploiement complet.

La combinaison d'une approche guidée par l'IA avec une supervision humaine rigoureuse permet de maximiser les bénéfices de la migration tout en minimisant les risques potentiels.

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

## Mise à jour de la documentation

La migration vers Zustand nécessite une mise à jour complète de la documentation pour refléter les nouveaux paradigmes et patterns d'utilisation. Cette étape est essentielle pour assurer une adoption fluide et maintenir la cohérence du codebase à long terme.

### Stratégie de mise à jour documentaire

1. **Inventaire de la documentation existante**
   - Identifier tous les documents techniques mentionnant Redux
   - Cataloguer les exemples de code à mettre à jour
   - Lister les diagrammes d'architecture à refaire

2. **Création de nouveaux guides et références**
   - Guide de migration pour les développeurs existants
   - Documentation de référence des stores Zustand
   - Exemples concrets d'utilisation dans divers contextes

3. **Mise à jour des documents d'architecture**
   - Mettre à jour les diagrammes de flux de données
   - Réviser les documents de conception système
   - Actualiser les guides de contribution

4. **Documentation du processus de migration lui-même**
   - Documenter les leçons apprises
   - Créer un historique des défis rencontrés et solutions apportées
   - Établir une liste des optimisations réalisées

### Matrice de migration des plugins

Pour assurer la complétion de la migration, voici une matrice détaillée couvrant tous les plugins existants et leur stratégie de migration vers Zustand :

| Plugin Redux | Fonction principale | Équivalent Zustand | Stratégie de migration |
|--------------|---------------------|-------------------|------------------------|
| `historyPlugin` | Gestion undo/redo | Middleware personnalisé | utiliser @https://github.com/charkour/zundo  |
| `loggingPlugin` | Journalisation des actions | Middleware personnalisé | Implémenter un middleware qui intercepte les mutations d'état |
| `analyticsPlugin` | Suivi d'utilisation | Middleware d'observateur | Utiliser un middleware qui observe les changements d'état |
| `performancePlugin` | Mesures de performance | Middleware avec timestamps | Créer un middleware qui mesure le temps d'exécution des mutations |
| `validationPlugin` | Validation des données | Middleware de validation | Implémenter un système de validation avant modification d'état |

### Approche pour les sélecteurs optimisés

Les sélecteurs optimisés avec `createSelector` de Reselect devront être migrés vers une approche équivalente avec Zustand :

```typescript
// Avant avec Redux Toolkit (`createSelector`)
export const selectActiveArea = createSelector(
  [selectAllAreas, selectActiveAreaId],
  (areas, activeId) => activeId ? areas[activeId] : null
);

// Après avec Zustand
export const useActiveArea = () => useAreaStore(
  (state) => state.activeAreaId ? state.areas[state.activeAreaId] : null,
  shallow // Utiliser shallow (ou autre comparateur) pour une comparaison optimisée
);
```

## Tests des cas d'utilisation spécifiques

Pour assurer que la migration préserve toutes les fonctionnalités spécifiques, une stratégie de tests dédiée est nécessaire.

### Identification des cas critiques à tester

1. **Système d'historique (undo/redo)**
   - Tests unitaires pour la création et application des diffs
   - Tests d'intégration pour les séquences undo/redo multiples
   - Tests de performance sur des historiques volumineux

2. **Validation de données**
   - Tests unitaires pour chaque règle de validation
   - Tests des cas limites et d'erreur
   - Tests d'intégration avec les composants utilisateurs

3. **Persistance**
   - Tests de sauvegarde/restauration de l'état
   - Tests de migration de données entre versions
   - Tests de gestion des erreurs de stockage

4. **Interaction entre stores**
   - Tests d'interactions entre différents stores Zustand
   - Tests de cohérence lors d'actions affectant plusieurs domaines
   - Tests de performance pour les opérations cross-store

### Stratégie d'automatisation des tests

Pour faciliter le processus, une approche d'automatisation sera mise en place :

```typescript
// Helper pour tester les stores Zustand
const testStore = (store, initialState, actions, expectedState) => {
  // Initialiser le store avec l'état initial
  const storeInstance = store.setState(initialState);
  
  // Exécuter séquentiellement les actions
  actions.forEach(action => {
    action(storeInstance);
  });
  
  // Vérifier que l'état final correspond à l'état attendu
  expect(storeInstance.getState()).toEqual(expectedState);
};

// Exemple d'utilisation
test('area store should handle active area change', () => {
  testStore(
    useAreaStore,
    { areas: { a1: { name: 'Test' } }, activeAreaId: null },
    [store => store.getState().setActiveArea('a1')],
    { areas: { a1: { name: 'Test' } }, activeAreaId: 'a1' }
  );
});
```

Cette approche permettra de tester systématiquement tous les stores et leurs interactions de manière cohérente. 
