# Guide: Système de Drag & Drop des Zones

Ce guide explique comment utiliser le système de drag & drop des zones dans Karmyc Core.

## Prérequis

- Installer le package `@gamesberry/karmyc-core` dans votre projet
- Configurer le `KarmycProvider` dans votre application

## 1. Concepts de Base

Le système de drag & drop de Karmyc Core permet de :

- Déplacer des zones entre différentes parties de l'interface
- Réorganiser les zones dans une disposition empilée (stack)
- Créer de nouvelles zones par drag & drop
- Gérer les onglets avec drag & drop

## 2. Utilisation du Hook useAreaDragAndDrop

Le hook principal pour gérer le drag & drop des zones est `useAreaDragAndDrop` :

```tsx
import { useAreaDragAndDrop } from '@gamesberry/karmyc-core';

const MonComposant = () => {
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    areaToOpenTargetId,
    areaToOpenTargetViewport,
    calculatedPlacement
  } = useAreaDragAndDrop({
    type: 'mon-type-de-zone',
    id: 'mon-id',
    state: { /* état de la zone */ }
  });

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
    >
      Contenu de la zone
    </div>
  );
};
```

## 3. Composant AreaDragButton

Pour créer un bouton de drag & drop pour une zone :

```tsx
import { AreaDragButton } from '@gamesberry/karmyc-core';

const MaZone = ({ id, type, state }) => {
  return (
    <div className="ma-zone">
      <AreaDragButton
        id={id}
        type={type}
        state={state}
        style={{ /* styles personnalisés */ }}
      />
      Contenu de la zone
    </div>
  );
};
```

## 4. Gestion des Zones Empilées (Stack)

Les zones peuvent être organisées en piles (stacks) avec des onglets :

```tsx
import { AreaTabs } from '@gamesberry/karmyc-core';

const MaZoneEmpilee = ({ rowId, row, areas }) => {
  return (
    <div className="zone-empilee">
      <AreaTabs
        rowId={rowId}
        row={row}
        areas={areas}
      />
      {/* Contenu de la zone active */}
    </div>
  );
};
```

## 5. Zones de Dépôt (DropZone)

Le composant `DropZone` gère les zones où les éléments peuvent être déposés :

```tsx
import { DropZone } from '@gamesberry/karmyc-core';

const MaZoneDeDepot = ({ areaToOpen, dimensions, setAreaToOpenDimensions }) => {
  return (
    <DropZone
      areaToOpen={areaToOpen}
      dimensions={dimensions}
      setAreaToOpenDimensions={setAreaToOpenDimensions}
    />
  );
};
```

## 6. Types de Placement

Le système supporte différents types de placement pour les zones :

- `left` : Place la zone à gauche
- `right` : Place la zone à droite
- `top` : Place la zone en haut
- `bottom` : Place la zone en bas
- `replace` : Remplace la zone existante

## 7. Gestion de l'État

Le système utilise Zustand pour gérer l'état. Les principales actions sont :

```tsx
import { useKarmycStore } from '@gamesberry/karmyc-core';

const MonComposant = () => {
  const {
    setAreaToOpen,
    updateAreaToOpenPosition,
    finalizeAreaPlacement,
    cleanupTemporaryStates,
    updateLayout
  } = useKarmycStore(state => ({
    setAreaToOpen: state.setAreaToOpen,
    updateAreaToOpenPosition: state.updateAreaToOpenPosition,
    finalizeAreaPlacement: state.finalizeAreaPlacement,
    cleanupTemporaryStates: state.cleanupTemporaryStates,
    updateLayout: state.updateLayout
  }));

  // Utilisation des actions...
};
```

## 8. Bonnes Pratiques

1. **Performance** :
   - Utiliser `React.memo` pour les composants qui gèrent le drag & drop
   - Éviter les re-rendus inutiles pendant le drag & drop
   - Utiliser `requestAnimationFrame` pour les mises à jour de position

2. **Expérience Utilisateur** :
   - Fournir un retour visuel clair pendant le drag & drop
   - Utiliser des animations fluides pour les transitions
   - Gérer correctement les états de survol et de dépôt

3. **Accessibilité** :
   - Implémenter des alternatives au drag & drop pour l'accessibilité
   - Utiliser des attributs ARIA appropriés
   - Assurer que les actions sont possibles sans drag & drop

4. **Architecture** :
   - Séparer la logique de drag & drop de la logique métier
   - Utiliser des identifiants cohérents pour les zones
   - Gérer correctement les erreurs et les états invalides

## 9. Exemple Complet

Voici un exemple complet d'implémentation :

```tsx
import React from 'react';
import {
  useAreaDragAndDrop,
  AreaDragButton,
  AreaTabs,
  DropZone,
  useKarmycStore
} from '@gamesberry/karmyc-core';

const MaZoneAvecDragAndDrop = ({ id, type, state }) => {
  const {
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop
  } = useAreaDragAndDrop({
    type,
    id,
    state
  });

  return (
    <div className="ma-zone">
      <AreaDragButton
        id={id}
        type={type}
        state={state}
      />
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={handleDrop}
      >
        Contenu de la zone
      </div>
    </div>
  );
};
```

Ce guide couvre les aspects principaux du système de drag & drop de Karmyc Core. Pour plus de détails sur des fonctionnalités spécifiques, consultez la documentation de l'API. 
