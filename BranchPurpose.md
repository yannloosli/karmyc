# Système de Layout Modulaire - Phase API

## Contexte du projet
Ce projet consiste en l'extraction d'un système de layout modulaire à partir d'une application existante. La première phase a impliqué l'analyse de l'application d'origine, la création de spécifications et la mise en place du nouveau store. Nous entrons maintenant dans une nouvelle phase axée sur le développement d'une API modulaire basée sur des hooks React.

## Objectifs de cette phase
L'objectif principal est de créer une API modulaire et flexible pour le système de layout, permettant une utilisation sans dépendre des composants placeholders en dur (Workspace, Timeline, etc.), tout en finalisant le système pour en faire un composant publiable.

## Tâches à accomplir

### 1. Développement de l'API modulaire

#### 1.1 Création des hooks d'enregistrement
- [x] Développer le hook `useRegisterAreaType` pour enregistrer des types de zones personnalisés
- [x] Développer le hook `useArea` pour gérer les instances de zones
- [x] Développer le hook `useContextMenu` pour la gestion des menus contextuels
- [x] Développer le hook `useAreaKeyboardShortcuts` pour la gestion des raccourcis clavier
- [ ] Développer le hook `useToolbar` pour la gestion de la barre d'outils
- [ ] Développer le hook `useComponentContextMenu` pour la gestion des menus contextuels spécifiques aux composants

#### 1.2 Composant principal KarmycProvider
- [x] Améliorer le composant `KarmycProvider` avec configuration flexible
- [x] Permettre l'initialisation avec des zones personnalisées
- [x] Intégrer la gestion des raccourcis clavier
- [x] Permettre l'extension avec des reducers personnalisés

#### 1.3 Point d'entrée principal
- [x] Mettre à jour le fichier index.ts exposant l'API publique
- [x] Regrouper les exports des hooks, types et composants principaux
- [x] Vérifier que toutes les fonctionnalités sont correctement exposées

### 2. Nettoyage et optimisation

#### 2.1 Suppression des placeholders en dur
- [x] Supprimer ou isoler les références à Workspace
- [x] Supprimer ou isoler les références à Timeline
- [x] Supprimer ou isoler les références à FlowEditor
- [x] Remplacer les composants en dur par un système d'enregistrement dynamique

#### 2.2 Refactorisation et optimisation
- [ ] Nettoyer les fichiers et fonctions inutiles
- [ ] Optimiser les sélecteurs Redux
- [ ] Éliminer les dépendances circulaires
- [ ] Vérifier les performances globales

### 3. Tests

#### 3.1 Tests unitaires
- [ ] Tester les hooks principaux
- [ ] Tester le composant KarmycProvider
- [ ] Tester les intégrations avec le store
- [ ] Tester la compatibilité entre les composants

#### 3.2 Tests d'intégration
- [ ] Tester l'enregistrement et l'utilisation de zones personnalisées
- [ ] Tester les menus contextuels avec différentes configurations
- [ ] Tester les raccourcis clavier
- [ ] Vérifier la compatibilité avec différentes configurations

### 4. Documentation

#### 4.1 Documentation technique
- [x] Documenter l'API de chaque hook
- [x] Créer des exemples d'utilisation complets
- [x] Documenter le KarmycProvider et ses options
- [x] Créer des guides d'intégration détaillés

#### 4.2 Exemples d'utilisation
- [x] Développer un exemple simple
- [ ] Développer un exemple avancé avec zones personnalisées
- [ ] Démontrer l'intégration avec d'autres bibliothèques
- [ ] Documenter les bonnes pratiques

### 5. Préparation pour la publication

#### 5.1 Configuration GitHub Actions
- [ ] Mettre en place des actions pour les tests automatisés
- [ ] Configurer la génération et le déploiement de la documentation
- [ ] Mettre en place un workflow de publication
- [ ] Configurer les checks de qualité du code

#### 5.2 Configuration NPM
- [ ] Préparer le package.json pour la publication
- [ ] Configurer les scripts de build
- [ ] Définir les fichiers à inclure/exclure
- [ ] Établir une stratégie de versionnement

## Architecture implémentée pour l'API

La zone API se compose de plusieurs hooks principaux pour manipuler différents aspects du système de zones:

1. **useArea** - Hook principal pour la gestion des zones et l'interaction avec le store Redux
2. **useLayout** - Hook pour manipuler la disposition des zones
3. **useAreaRegistry** - Gestion des types de zones personnalisés 
4. **useToolbar** - Gestion des éléments de la barre d'outils
5. **useComponentContextMenu** - Gestion des menus contextuels spécifiques aux composants

### Hooks principaux

```typescript
// useRegisterAreaType
function useRegisterAreaType<T = any>(
  areaType: string,
  component: React.ComponentType<AreaComponentProps<T>>,
  initialState: T,
  options?: {
    displayName?: string;
    icon?: React.ComponentType;
    defaultSize?: { width: number, height: number },
    supportedActions?: string[]
  }
): void

// useArea
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

// useContextMenu
function useContextMenu() {
  return { 
    isVisible,  // État de visibilité du menu
    position,   // Position du menu
    open,       // Ouvre le menu
    close       // Ferme le menu
  };
}

// useAreaKeyboardShortcuts
function useAreaKeyboardShortcuts(
  areaType: string,
  shortcuts: Array<{
    key: string,
    modifierKeys?: string[],
    name: string,
    fn: (areaId: string, params: any) => void,
    history?: boolean
  }>
): void

// useToolbar
function useToolbar() {
  return {
    items: Array<ToolbarItem>,       // Items actuels de la toolbar
    registerItem: (item: ToolbarItem) => void,  // Enregistrer un nouvel item
    removeItem: (id: string) => void,          // Supprimer un item existant
    updateItem: (id: string, changes: Partial<ToolbarItem>) => void // Mettre à jour un item
  };
}

// useComponentContextMenu
function useComponentContextMenu(areaType: string) {
  return {
    registerAction: (action: ComponentContextMenuAction) => void,  // Enregistrer une action de menu
    registerSeparator: (id: string, position: number) => void,     // Ajouter un séparateur
    getActions: () => Array<ComponentContextMenuAction>,           // Récupérer les actions pour ce type
    unregisterAction: (id: string) => void                         // Supprimer une action
  };
}

// Type pour les actions de menu contextuel spécifiques aux composants
interface ComponentContextMenuAction {
  id: string;
  label: string;
  icon?: React.ComponentType;
  handler: (params: { areaId: string, position: { x: number, y: number }, data?: any }) => void;
  condition?: (areaId: string) => boolean;  // Condition pour afficher l'option
  order?: number;                           // Position dans le menu
}
```

### Composant principal

```typescript
// KarmycProvider
const KarmycProvider: React.FC<{
  children: React.ReactNode,
  options?: IKarmycOptions,
  customStore?: any
}>;

// Options disponibles
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

### Exemple d'utilisation

```tsx
import React, { useEffect } from 'react';
import { 
  KarmycProvider, 
  useRegisterAreaType, 
  useArea,
  useToolbar,
  useComponentContextMenu
} from '@karmyc/layout';

// Composant personnalisé pour une zone
const MyCustomArea = ({ id, state, width, height }) => {
  const { registerAction } = useComponentContextMenu('custom-area');
  
  useEffect(() => {
    // Enregistrement des actions du menu contextuel spécifiques à ce composant
    registerAction({
      id: 'custom.edit-content',
      label: 'Modifier le contenu',
      handler: ({ areaId }) => {
        // Action spécifique au composant
        console.log('Edition du contenu de', areaId);
      },
      order: 10
    });
    
    return () => {
      // Le nettoyage des actions de menu est géré automatiquement
    };
  }, [registerAction]);
  
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
  
  // Utiliser le hook useToolbar
  const { registerItem } = useToolbar();
  
  // Enregistrer un item de toolbar
  React.useEffect(() => {
    registerItem({
      id: 'create-custom',
      label: 'Nouvelle zone',
      icon: 'PlusCircle',
      action: () => createArea('custom', { content: 'Nouvelle zone créée depuis la toolbar' })
    });
  }, []);
  
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

## Planning et prochaines étapes

1. **Semaine 1** (Terminé) : Création des hooks d'API et amélioration du KarmycProvider
2. **Semaine 2** (Terminé) : Suppression des placeholders et nettoyage du code
3. **Semaine 3** (En cours) : Mise en place des tests et optimisations
4. **Semaine 4** : Documentation complète et exemples d'utilisation avancés
5. **Semaine 5** : Configuration pour la publication et finalisation

## Livrables attendus

1. [x] API modulaire complète avec hooks et KarmycProvider amélioré
2. [x] Documentation complète de l'API
3. [ ] Tests unitaires et d'intégration
4. [ ] Exemples d'utilisation avancés
5. [ ] Configuration pour la publication sur NPM

## État actuel du projet - Phase 2 

### Résumé des avancées
1. Implémentation complétée des hooks d'API pour la gestion des zones
2. Système rendu indépendant des composants placeholders en dur (Workspace, Timeline, FlowEditor)
3. Système d'enregistrement dynamique mis en place pour les types de zones
4. Documentation complète des hooks et composants principaux
5. Guide détaillé pour la création de zones personnalisées
6. Correction du système de conversion entre types de zones (au lieu de créer une nouvelle zone)
7. Implémentation des raccourcis clavier fonctionnels (Ctrl+S, Ctrl+R) avec interception du comportement par défaut du navigateur
8. Gestion correcte des états initiaux pour les différents types de zones

### Problèmes résolus
1. Correction des erreurs de linter dans useRegisterAreaType.ts
2. Implémentation de l'initialisation des zones personnalisées dans KarmycInitializer
3. Remplacement de l'enum AreaType par un objet extensible pour faciliter l'ajout de types personnalisés
4. Résolution des problèmes d'états manquants/undefined dans les composants de zones (text-note, color-picker, image-viewer)
5. Résolution du problème d'interception des raccourcis clavier du navigateur
6. Correction du fonctionnement des actions du menu contextuel pour modifier le type des zones existantes

### Problèmes restants
1. Finalisation de l'API de la toolbar et son intégration avec les zones personnalisées
2. Développement complet de l'API du menu contextuel pour les composants
3. Meilleures stratégies de gestion d'erreurs pour les hooks

## Priorités pour la suite

1. Finaliser l'implémentation de useArea avec la gestion complète de l'état
2. Compléter l'implémentation de useToolbar avec la capacité d'ajouter des boutons personnalisés
3. Développer l'API useComponentContextMenu pour les menus contextuels au niveau des composants
4. Implémenter des tests unitaires pour les hooks principaux
5. Optimiser les sélecteurs Redux pour de meilleures performances

<!-- 
COMMENTAIRES POUR LA PROCHAINE SESSION:

1. Raccourcis clavier: Les raccourcis clavier fonctionnent désormais, mais l'implémentation pourrait être plus propre en utilisant le système de raccourcis existant au lieu d'une interception directe dans main.tsx. Une refactorisation pourrait être envisagée pour mieux intégrer avec keyboardShortcutRegistry.

2. Gestion des erreurs: Nous avons amélioré la robustesse des composants face aux états undefined, mais il faudrait prévoir une stratégie de migration des états existants en localStorage vers le nouveau format pour éviter les erreurs lors de mises à jour.

3. Performance: Vérifier si l'utilisation de Redux dans les raccourcis clavier provoque des re-renders inutiles.

4. Tests à écrire: 
   - Test de conversion entre différents types de zones
   - Test des raccourcis clavier avec simulation d'événements
   - Test de validation des états lors de la conversion

5. Toolbar: 
   - Implémenter l'API complète pour useToolbar
   - Permettre l'ajout de sections dans la toolbar
   - Gérer la visibilité conditionnelle des boutons en fonction du type de zone active
   - Intégrer les icônes personnalisées pour les boutons de toolbar

6. Menu contextuel des composants:
   - Développer l'API complète de useComponentContextMenu
   - Intégrer la détection du composant survolé lors du clic droit
   - Permettre la personnalisation des handlers en fonction du contexte du composant
   - Gérer les sous-menus et groupes d'actions
   - S'assurer que les menus contextuels ne s'affichent que pour les composants concernés
-->

## Suivi et communication

Pour assurer un suivi efficace :

1. Mise à jour régulière de ce document
2. Création d'issues GitHub pour chaque fonctionnalité majeure
3. Pull requests avec descriptions détaillées
4. Documentation continue pendant le développement

## Documents associés

- Documentation de l'API : `src/README.md`
- Types : `src/types/index.ts`
- Hooks principaux : `src/hooks/index.ts`
- Provider principal : `src/providers/KarmycProvider.tsx`
- Guide pour les zones personnalisées : `docs/guides/custom-areas.md`

### Hooks à créer

- [x] useArea (implémenté)
- [x] useAreaRegistry (implémenté)
- [x] useLayout (implémenté)
- [ ] useToolbar (à implémenter)
- [ ] useComponentContextMenu (à implémenter)
