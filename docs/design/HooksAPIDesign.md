# Conception de l'API de Hooks

## 1. Introduction

Ce document présente la conception détaillée de l'API de hooks pour le core layout system de l'éditeur d'animation. Ces hooks fourniront une interface simple et intuitive pour interagir avec le système, permettant aux développeurs d'enregistrer des types de zones, des actions, des menus contextuels et d'initialiser le système avec une configuration personnalisée.

## 2. Vue d'ensemble

L'API de hooks sera organisée en plusieurs catégories :

1. **Hooks d'enregistrement** : Pour enregistrer des composants, des réducteurs et des raccourcis clavier pour les zones
2. **Hooks d'actions** : Pour enregistrer et gérer des actions
3. **Hooks de menu contextuel** : Pour créer et gérer des menus contextuels
4. **Hooks d'initialisation** : Pour initialiser le système avec une configuration personnalisée
5. **Hooks d'accès aux données** : Pour accéder aux données du store de manière optimisée

## 3. Hooks d'enregistrement des types de zones

### 3.1 `useRegisterAreaType`

Ce hook permet d'enregistrer un nouveau type de zone avec son composant, son réducteur d'état et ses raccourcis clavier.

```typescript
// src/core/hooks/useRegisterAreaType.ts
import { useEffect } from 'react';
import { areaRegistry } from '../area/registry';
import { TAreaComponent, TAreaReducer, TAreaKeyboardShortcuts } from '../types/area';

/**
 * Hook pour enregistrer un type de zone
 * @param areaType - Type de zone à enregistrer
 * @param component - Composant React pour ce type de zone
 * @param reducer - Réducteur d'état pour ce type de zone
 * @param keyboardShortcuts - Raccourcis clavier pour ce type de zone (optionnel)
 * @param options - Options supplémentaires (optionnel)
 */
export function useRegisterAreaType<T extends string, S>(
  areaType: T,
  component: TAreaComponent<S>,
  reducer: TAreaReducer<S>,
  keyboardShortcuts?: TAreaKeyboardShortcuts,
  options?: {
    reactKey?: keyof S;
    displayName?: string;
    icon?: React.ComponentType;
  }
): void {
  useEffect(() => {
    // Enregistrer le composant
    areaRegistry.registerComponent(areaType, component);
    
    // Enregistrer le réducteur
    areaRegistry.registerReducer(areaType, reducer);
    
    // Enregistrer les raccourcis clavier si fournis
    if (keyboardShortcuts) {
      areaRegistry.registerKeyboardShortcuts(areaType, keyboardShortcuts);
    }
    
    // Enregistrer les options supplémentaires
    if (options) {
      if (options.reactKey) {
        areaRegistry.registerReactKey(areaType, options.reactKey);
      }
      
      if (options.displayName) {
        areaRegistry.registerDisplayName(areaType, options.displayName);
      }
      
      if (options.icon) {
        areaRegistry.registerIcon(areaType, options.icon);
      }
    }
    
    // Nettoyer lors du démontage du composant
    return () => {
      areaRegistry.unregisterAreaType(areaType);
    };
  }, [areaType, component, reducer, keyboardShortcuts, options]);
}
```

### 3.2 `useAreaTypes`

Ce hook permet d'accéder à la liste des types de zones enregistrés.

```typescript
// src/core/hooks/useAreaTypes.ts
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { areaRegistry } from '../area/registry';
import { selectAreaTypes } from '../store/selectors/area';

/**
 * Hook pour accéder à la liste des types de zones enregistrés
 * @param filter - Fonction de filtrage optionnelle
 * @returns Liste des types de zones enregistrés
 */
export function useAreaTypes<T extends string>(filter?: (areaType: T) => boolean): T[] {
  // Récupérer la liste des types de zones depuis le store
  const areaTypes = useSelector(selectAreaTypes);
  
  // Filtrer si nécessaire
  return useMemo(() => {
    if (filter) {
      return areaTypes.filter(filter) as T[];
    }
    return areaTypes as T[];
  }, [areaTypes, filter]);
}
```

## 4. Hooks d'enregistrement des actions

### 4.1 `useRegisterAction`

Ce hook permet d'enregistrer une action avec son handler.

```typescript
// src/core/hooks/useRegisterAction.ts
import { useEffect } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { actionRegistry } from '../actions/registry';
import { TActionHandler } from '../types/actions';
import { ActionPriority } from '../actions/priorities';

/**
 * Hook pour enregistrer une action
 * @param actionId - Identifiant unique de l'action
 * @param actionTypes - Types d'actions à gérer (null pour tous les types)
 * @param handler - Fonction de gestion de l'action
 * @param priority - Priorité de l'action (par défaut NORMAL)
 */
export function useRegisterAction<T extends AnyAction = AnyAction>(
  actionId: string,
  actionTypes: string[] | null,
  handler: TActionHandler<T>,
  priority: number = ActionPriority.NORMAL
): void {
  useEffect(() => {
    actionRegistry.registerPlugin({
      id: actionId,
      priority,
      actionTypes,
      handler
    });
    
    // Nettoyer lors du démontage du composant
    return () => {
      actionRegistry.unregisterPlugin(actionId);
    };
  }, [actionId, actionTypes, handler, priority]);
}
```

### 4.2 `useRegisterActionValidator`

Ce hook permet d'enregistrer un validateur pour un type d'action spécifique.

```typescript
// src/core/hooks/useRegisterActionValidator.ts
import { useEffect } from 'react';
import { AnyAction } from '@reduxjs/toolkit';
import { actionRegistry } from '../actions/registry';
import { TActionValidator } from '../types/actions';

/**
 * Hook pour enregistrer un validateur d'action
 * @param actionType - Type d'action à valider
 * @param validator - Fonction de validation
 */
export function useRegisterActionValidator<T extends AnyAction = AnyAction>(
  actionType: string,
  validator: TActionValidator<T>
): void {
  useEffect(() => {
    actionRegistry.registerValidator(actionType, validator as TActionValidator);
    
    // Nettoyer lors du démontage du composant
    return () => {
      actionRegistry.unregisterValidators(actionType);
    };
  }, [actionType, validator]);
}
```

## 5. Hooks pour les menus contextuels

### 5.1 `useContextMenu`

Ce hook permet de créer et gérer un menu contextuel.

```typescript
// src/core/hooks/useContextMenu.ts
import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { contextMenuActions } from '../store/slices/contextMenu';
import { IContextMenuOption } from '../types/contextMenu';

/**
 * Hook pour créer et gérer un menu contextuel
 * @returns Fonctions pour ouvrir et fermer un menu contextuel
 */
export function useContextMenu() {
  const dispatch = useDispatch();
  
  const openContextMenu = useCallback(
    (name: string, options: IContextMenuOption[], position: Vec2) => {
      const close = () => dispatch(contextMenuActions.closeContextMenu());
      dispatch(contextMenuActions.openContextMenu(name, options, position, close));
      return close;
    },
    [dispatch]
  );
  
  const openCustomContextMenu = useCallback(
    <P extends IContextMenuBaseProps>(options: {
      component: React.ComponentType<P>;
      props: Omit<P, 'updateRect'>;
      position: Vec2;
      alignPosition?: 'top-left' | 'bottom-left' | 'center';
      closeMenuBuffer?: number;
    }) => {
      const close = () => dispatch(contextMenuActions.closeContextMenu());
      dispatch(
        contextMenuActions.openCustomContextMenu({
          ...options,
          close
        })
      );
      return close;
    },
    [dispatch]
  );
  
  const closeContextMenu = useCallback(() => {
    dispatch(contextMenuActions.closeContextMenu());
  }, [dispatch]);
  
  return {
    openContextMenu,
    openCustomContextMenu,
    closeContextMenu
  };
}
```

### 5.2 `useRegisterContextMenuAction`

Ce hook permet d'enregistrer une action de menu contextuel.

```typescript
// src/core/hooks/useRegisterContextMenuAction.ts
import { useEffect } from 'react';
import { contextMenuRegistry } from '../contextMenu/registry';
import { IContextMenuAction } from '../types/contextMenu';

/**
 * Hook pour enregistrer une action de menu contextuel
 * @param menuType - Type de menu contextuel
 * @param action - Action à enregistrer
 */
export function useRegisterContextMenuAction(
  menuType: string,
  action: IContextMenuAction
): void {
  useEffect(() => {
    contextMenuRegistry.registerAction(menuType, action);
    
    // Nettoyer lors du démontage du composant
    return () => {
      contextMenuRegistry.unregisterAction(menuType, action.id);
    };
  }, [menuType, action]);
}
```

## 6. Hook d'initialisation

### 6.1 `useLayoutCore`

Ce hook principal permet d'initialiser le système de mise en page avec une configuration personnalisée.

```typescript
// src/core/hooks/useLayoutCore.ts
import { useEffect } from 'react';
import { coreRegistry } from '../registry';
import { ICoreConfig } from '../types/core';

/**
 * Hook principal pour initialiser le système de mise en page
 * @param config - Configuration du système
 */
export function useLayoutCore(config: ICoreConfig): void {
  useEffect(() => {
    // Initialiser le système avec la configuration fournie
    coreRegistry.initialize(config);
    
    // Nettoyer lors du démontage du composant
    return () => {
      coreRegistry.cleanup();
    };
  }, [config]);
}
```

### 6.2 `useLayoutCoreProvider`

Ce hook crée un provider React pour le système de mise en page.

```typescript
// src/core/hooks/useLayoutCoreProvider.ts
import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../store/rootReducer';
import { actionsMiddleware } from '../store/middleware/actions';
import { historyMiddleware } from '../store/middleware/history';
import { persistenceMiddleware } from '../store/middleware/persistence';
import { ICoreConfig } from '../types/core';

/**
 * Hook pour créer un provider React pour le système de mise en page
 * @param config - Configuration du système
 * @returns Provider React
 */
export function useLayoutCoreProvider(config: ICoreConfig) {
  // Créer le store Redux
  const store = useMemo(() => {
    return configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: true
        }).concat(actionsMiddleware, historyMiddleware, persistenceMiddleware),
      preloadedState: config.initialState
    });
  }, [config.initialState]);
  
  // Créer le provider
  const LayoutCoreProvider = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  }, [store]);
  
  return LayoutCoreProvider;
}
```

## 7. Hooks d'accès aux données

### 7.1 `useAreaState`

Ce hook permet d'accéder à l'état d'une zone spécifique.

```typescript
// src/core/hooks/useAreaState.ts
import { useSelector } from 'react-redux';
import { selectAreaState } from '../store/selectors/area';

/**
 * Hook pour accéder à l'état d'une zone
 * @param areaId - Identifiant de la zone
 * @returns État de la zone
 */
export function useAreaState<T = any>(areaId: string): T {
  return useSelector((state) => selectAreaState<T>(state, areaId));
}
```

### 7.2 `useAreaLayout`

Ce hook permet d'accéder à la disposition des zones.

```typescript
// src/core/hooks/useAreaLayout.ts
import { useSelector } from 'react-redux';
import { selectAreaLayout } from '../store/selectors/area';
import { IAreaLayout } from '../types/area';

/**
 * Hook pour accéder à la disposition des zones
 * @returns Disposition des zones
 */
export function useAreaLayout(): IAreaLayout {
  return useSelector(selectAreaLayout);
}
```

## 8. Exemples d'utilisation

### 8.1 Enregistrement d'un type de zone

```tsx
import { useRegisterAreaType } from '@core/hooks/useRegisterAreaType';
import { TimelineComponent } from './TimelineComponent';
import { timelineReducer } from './timelineReducer';
import { timelineKeyboardShortcuts } from './timelineKeyboardShortcuts';
import { TimelineIcon } from './TimelineIcon';

function TimelineRegistration() {
  useRegisterAreaType(
    'timeline',
    TimelineComponent,
    timelineReducer,
    timelineKeyboardShortcuts,
    {
      displayName: 'Timeline',
      icon: TimelineIcon,
      reactKey: 'compositionId'
    }
  );
  
  return null;
}
```

### 8.2 Enregistrement d'une action

```tsx
import { useRegisterAction } from '@core/hooks/useRegisterAction';
import { ActionPriority } from '@core/actions/priorities';

function ActionRegistration() {
  useRegisterAction(
    'timeline-zoom',
    ['timeline/ZOOM_IN', 'timeline/ZOOM_OUT'],
    (action) => {
      console.log('Timeline zoom action:', action);
      // Logique de gestion du zoom
    },
    ActionPriority.HIGH
  );
  
  return null;
}
```

### 8.3 Utilisation d'un menu contextuel

```tsx
import { useContextMenu } from '@core/hooks/useContextMenu';

function ContextMenuExample() {
  const { openContextMenu, closeContextMenu } = useContextMenu();
  
  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    const position = { x: e.clientX, y: e.clientY };
    const options = [
      {
        id: 'copy',
        label: 'Copier',
        onClick: () => {
          console.log('Copier');
          closeContextMenu();
        }
      },
      {
        id: 'paste',
        label: 'Coller',
        onClick: () => {
          console.log('Coller');
          closeContextMenu();
        }
      }
    ];
    
    openContextMenu('edit-menu', options, position);
  };
  
  return (
    <div onContextMenu={handleRightClick} style={{ width: 200, height: 200, background: '#eee' }}>
      Cliquez avec le bouton droit pour ouvrir le menu contextuel
    </div>
  );
}
```

### 8.4 Initialisation du système

```tsx
import { useLayoutCore, useLayoutCoreProvider } from '@core/hooks';

function App() {
  // Créer le provider
  const LayoutCoreProvider = useLayoutCoreProvider({
    initialState: {
      // État initial
    },
    enablePersistence: true,
    persistenceKey: 'animation-editor'
  });
  
  return (
    <LayoutCoreProvider>
      <CoreInitializer />
      <MainApplication />
    </LayoutCoreProvider>
  );
}

function CoreInitializer() {
  // Initialiser le système
  useLayoutCore({
    defaultAreaTypes: ['timeline', 'workspace', 'properties'],
    defaultLayout: {
      // Configuration de la disposition par défaut
    },
    enableHistory: true,
    maxHistorySize: 50
  });
  
  return null;
}
```

## 9. Considérations de performance

Pour optimiser les performances, les hooks suivront ces principes :

1. Utilisation de `useMemo` et `useCallback` pour éviter les recréations inutiles de fonctions et d'objets
2. Utilisation de sélecteurs mémorisés pour les accès au store Redux
3. Utilisation de `shallowEqual` pour les comparaisons d'objets dans `useSelector`
4. Minimisation des rendus inutiles en utilisant des dépendances précises dans les hooks d'effet

## 10. Prochaines étapes

1. Implémenter les hooks décrits dans ce document
2. Créer des tests unitaires pour chaque hook
3. Documenter l'API publique avec des exemples d'utilisation
4. Intégrer les hooks avec le reste du système 
