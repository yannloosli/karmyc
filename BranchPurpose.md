# Système de Layout Modulaire - Phase API

## Contexte du projet
Ce projet consiste en l'extraction d'un système de layout modulaire à partir d'une application existante. La première phase a impliqué l'analyse de l'application d'origine, la création de spécifications et la mise en place du nouveau store. Nous entrons maintenant dans une nouvelle phase axée sur le développement d'une API modulaire basée sur des hooks React.

## Objectifs de cette phase
L'objectif principal est de créer une API modulaire et flexible pour le système de layout, permettant une utilisation sans dépendre des composants placeholders en dur (Workspace, Timeline, etc.), tout en finalisant le système pour en faire un composant publiable.

## Tâches à accomplir

### 1. Développement de l'API modulaire

#### 1.1 Création des hooks d'enregistrement
- [ ] Développer le hook `useRegisterAreaType` pour enregistrer des types de zones personnalisés
- [ ] Développer le hook `useArea` pour gérer les instances de zones
- [ ] Développer le hook `useContextMenu` pour la gestion des menus contextuels
- [ ] Développer le hook `useAreaKeyboardShortcuts` pour la gestion des raccourcis clavier

#### 1.2 Composant principal CoreProvider
- [ ] Implémenter le composant `CoreProvider` avec configuration flexible
- [ ] Permettre l'initialisation avec des zones personnalisées
- [ ] Intégrer la gestion des raccourcis clavier
- [ ] Permettre l'extension avec des reducers personnalisés

#### 1.3 Point d'entrée principal
- [ ] Créer un fichier index.ts exposant l'API publique
- [ ] Regrouper les exports des hooks, types et composants principaux
- [ ] Vérifier que toutes les fonctionnalités sont correctement exposées

### 2. Nettoyage et optimisation

#### 2.1 Suppression des placeholders en dur
- [ ] Supprimer ou isoler les références à Workspace
- [ ] Supprimer ou isoler les références à Timeline
- [ ] Supprimer ou isoler les références à FlowEditor
- [ ] Remplacer les composants en dur par un système d'enregistrement dynamique

#### 2.2 Refactorisation et optimisation
- [ ] Nettoyer les fichiers et fonctions inutiles
- [ ] Optimiser les sélecteurs Redux
- [ ] Éliminer les dépendances circulaires
- [ ] Vérifier les performances globales

### 3. Tests

#### 3.1 Tests unitaires
- [ ] Tester les hooks principaux
- [ ] Tester le composant CoreProvider
- [ ] Tester les intégrations avec le store
- [ ] Tester la compatibilité entre les composants

#### 3.2 Tests d'intégration
- [ ] Tester l'enregistrement et l'utilisation de zones personnalisées
- [ ] Tester les menus contextuels avec différentes configurations
- [ ] Tester les raccourcis clavier
- [ ] Vérifier la compatibilité avec différentes configurations

### 4. Documentation

#### 4.1 Documentation technique
- [ ] Documenter l'API de chaque hook
- [ ] Créer des exemples d'utilisation
- [ ] Documenter le CoreProvider et ses options
- [ ] Créer des guides d'intégration

#### 4.2 Exemples d'utilisation
- [ ] Développer un exemple simple
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

## Architecture proposée pour l'API

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
    areas, 
    activeArea, 
    createArea, 
    deleteArea, 
    updateAreaState, 
    setActive,
    getAreaById
  };
}

// useContextMenu
function useContextMenu() {
  return { open, close };
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
```

### Composant principal

```typescript
// CoreProvider
const CoreProvider: React.FC<{
  children: React.ReactNode,
  initialAreas?: Array<{
    type: string,
    state?: any,
    position?: { x: number, y: number }
  }>,
  customReducers?: Record<string, any>
}>;
```

### Exemple d'utilisation

```tsx
import React from 'react';
import { 
  CoreProvider, 
  useRegisterAreaType, 
  useArea, 
  AreaRoot, 
  AreaComponentProps 
} from '@karmyc';

// Composant personnalisé pour une zone
const MyCustomArea: React.FC<AreaComponentProps<any>> = ({ 
  width, 
  height, 
  left, 
  top, 
  areaState, 
  areaId 
}) => {
  return (
    <div style={{ position: 'absolute', left, top, width, height, background: '#f0f0f0' }}>
      <h2>Mon Composant Personnalisé</h2>
      <p>Contenu personnalisé: {areaState.content}</p>
    </div>
  );
};

// Application principale
const App: React.FC = () => {
  // Enregistrement du type de zone
  useRegisterAreaType(
    'custom',
    MyCustomArea,
    { content: 'Initial content' },
    { displayName: 'Zone Personnalisée' }
  );
  
  // Utilisation du hook useArea
  const { createArea } = useArea();
  
  return (
    <div>
      <button onClick={() => createArea('custom', { content: 'Nouvelle zone' })}>
        Créer une zone
      </button>
      <AreaRoot />
    </div>
  );
};

// Intégration avec CoreProvider
const Root: React.FC = () => {
  return (
    <CoreProvider>
      <App />
    </CoreProvider>
  );
};
```

## Planning et prochaines étapes

1. **Semaine 1** : Création des hooks d'API et du CoreProvider
2. **Semaine 2** : Suppression des placeholders et nettoyage du code
3. **Semaine 3** : Mise en place des tests et optimisations
4. **Semaine 4** : Documentation et exemples d'utilisation
5. **Semaine 5** : Configuration pour la publication et finalisation

## Livrables attendus

1. [ ] API modulaire complète avec hooks et CoreProvider
2. [ ] Documentation complète de l'API
3. [ ] Tests unitaires et d'intégration
4. [ ] Exemples d'utilisation
5. [ ] Configuration pour la publication sur NPM

## Suivi et communication

Pour assurer un suivi efficace :

1. Mise à jour régulière de ce document
2. Création d'issues GitHub pour chaque fonctionnalité majeure
3. Pull requests avec descriptions détaillées
4. Documentation continue pendant le développement

## Documents associés

- Documentation de l'API : `docs/api.md`
- Guide d'utilisation : `docs/usage-guide.md`
- Exemples : `examples/`
- Tests : `tests/`
