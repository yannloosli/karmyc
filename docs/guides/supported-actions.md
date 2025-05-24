# Guide d'utilisation des SupportedActions

## Introduction

Les `SupportedActions` sont un système centralisé pour gérer les actions disponibles dans Karmyc. Ce système permet de :

- Définir clairement les actions supportées par chaque type d'élément
- Assurer la cohérence des actions à travers l'application
- Faciliter l'ajout de nouvelles actions
- Maintenir une documentation claire des actions disponibles

## Structure de base

### 1. Définition des actions

```typescript
// types.ts
export const LAYER_SUPPORTED_ACTIONS = {
    ADD: 'layer:add',
    REMOVE: 'layer:remove',
    UPDATE: 'layer:update',
    REORDER: 'layer:reorder',
    SET_ACTIVE: 'layer:set-active'
} as const;

export type LayerActionType = typeof LAYER_SUPPORTED_ACTIONS[keyof typeof LAYER_SUPPORTED_ACTIONS];

export interface LayerActionPayload {
    [LAYER_SUPPORTED_ACTIONS.ADD]: {
        type: string;
        spaceId: string;
    };
    [LAYER_SUPPORTED_ACTIONS.REMOVE]: {
        layerId: string;
        spaceId: string;
    };
    [LAYER_SUPPORTED_ACTIONS.UPDATE]: {
        layerId: string;
        spaceId: string;
        changes: Partial<LayerProps>;
    };
    [LAYER_SUPPORTED_ACTIONS.REORDER]: {
        spaceId: string;
        layers: LayerProps[];
    };
    [LAYER_SUPPORTED_ACTIONS.SET_ACTIVE]: {
        spaceId: string;
        layerId: string;
    };
}
```

### 2. Implémentation des handlers

```typescript
// actions.ts
export const registerLayerActions = () => {
    const spaceStore = useSpaceStore.getState();
    
    return {
        [LAYER_SUPPORTED_ACTIONS.ADD]: (params: LayerActionPayload[typeof LAYER_SUPPORTED_ACTIONS.ADD]) => {
            // Logique d'ajout
        },
        [LAYER_SUPPORTED_ACTIONS.REMOVE]: (params: LayerActionPayload[typeof LAYER_SUPPORTED_ACTIONS.REMOVE]) => {
            // Logique de suppression
        },
        // ... autres handlers
    };
};
```

### 3. Enregistrement des validateurs

```typescript
// registry.ts
export const registerLayerValidators = () => {
    return {
        [LAYER_SUPPORTED_ACTIONS.ADD]: validateLayerAdd,
        [LAYER_SUPPORTED_ACTIONS.REMOVE]: validateLayerRemove,
        // ... autres validateurs
    };
};
```

## Utilisation dans les composants

### 1. Dispatch d'actions

```typescript
// Dans un composant
actionRegistry.handleAction({
    type: LAYER_SUPPORTED_ACTIONS.UPDATE,
    payload: {
        spaceId,
        layerId: layer.id,
        changes: { visible: !layer.visible }
    }
});
```

### 2. Création d'un plugin d'actions

```typescript
// plugin.ts
export const layerActionPlugin: IActionPlugin = {
    id: "layer",
    priority: ActionPriority.NORMAL,
    actionTypes: Object.values(LAYER_SUPPORTED_ACTIONS),
    handler: (action: Action) => {
        const handler = handlers[action.type];
        if (handler) {
            handler(action.payload);
        }
    }
};
```

## Utilisation dans les plugins

### 1. Structure d'un plugin avec SupportedActions

```typescript
// plugin/index.ts
import { Plugin } from "@gamesberry/karmyc-core";
import { LAYER_SUPPORTED_ACTIONS } from "./types";
import { registerLayerActions } from "./actions";
import { registerLayerValidators } from "./registry";

export const layerPlugin: Plugin = {
    id: "layer",
    name: "Layer Plugin",
    version: "1.0.0",
    supportedActions: LAYER_SUPPORTED_ACTIONS,
    onRegister: () => {
        // Enregistrement des actions et validateurs
        const handlers = registerLayerActions();
        const validators = registerLayerValidators();
        
        // Enregistrement du plugin d'actions
        actionRegistry.registerPlugin({
            id: "layer",
            priority: ActionPriority.NORMAL,
            actionTypes: Object.values(LAYER_SUPPORTED_ACTIONS),
            handler: (action: Action) => {
                const handler = handlers[action.type];
                if (handler) {
                    handler(action.payload);
                }
            }
        });

        // Enregistrement des validateurs
        Object.entries(validators).forEach(([type, validator]) => {
            actionRegistry.registerValidator(type, validator);
        });
    },
    onUnregister: () => {
        // Nettoyage lors de la désactivation du plugin
        actionRegistry.unregisterPlugin("layer");
        Object.values(LAYER_SUPPORTED_ACTIONS).forEach(type => {
            actionRegistry.unregisterValidators(type);
        });
    }
};
```

### 2. Intégration avec le système de plugins

```typescript
// plugin/registry.ts
import { PluginRegistry } from "@gamesberry/karmyc-core";
import { layerPlugin } from "./index";

// Enregistrement du plugin
PluginRegistry.register(layerPlugin);
```

### 3. Utilisation dans les composants du plugin

```typescript
// plugin/components/LayerComponent.tsx
import { useAction } from "@gamesberry/karmyc-core";
import { LAYER_SUPPORTED_ACTIONS } from "../types";

export const LayerComponent: React.FC = () => {
    const handleAction = useAction();

    const handleUpdate = () => {
        handleAction({
            type: LAYER_SUPPORTED_ACTIONS.UPDATE,
            payload: {
                spaceId: "current-space",
                layerId: "layer-1",
                changes: { visible: true }
            }
        });
    };

    return (
        <button onClick={handleUpdate}>
            Mettre à jour le calque
        </button>
    );
};
```

## Bonnes pratiques

1. **Nommage des actions**
   - Utiliser un préfixe unique pour chaque type d'élément (ex: `layer:`, `area:`, etc.)
   - Utiliser des verbes clairs pour décrire l'action
   - Suivre le format `type:action`

2. **Typage**
   - Définir des types stricts pour les payloads
   - Utiliser des constantes pour les types d'actions
   - Éviter les types `any`

3. **Validation**
   - Implémenter des validateurs pour chaque action
   - Vérifier les permissions et les conditions préalables
   - Retourner des messages d'erreur clairs

4. **Gestion des erreurs**
   - Utiliser try/catch dans les handlers
   - Logger les erreurs de manière appropriée
   - Fournir des messages d'erreur utiles

5. **Organisation des plugins**
   - Séparer clairement les responsabilités (actions, validateurs, composants)
   - Documenter les actions supportées
   - Gérer proprement le cycle de vie du plugin

## Exemple complet

Voici un exemple complet d'implémentation d'un système d'actions pour les calques :

```typescript
// 1. Définition des types
export const LAYER_SUPPORTED_ACTIONS = {
    ADD: 'layer:add',
    REMOVE: 'layer:remove',
    UPDATE: 'layer:update',
    REORDER: 'layer:reorder',
    SET_ACTIVE: 'layer:set-active'
} as const;

// 2. Implémentation des handlers
export const registerLayerActions = () => {
    const spaceStore = useSpaceStore.getState();
    
    return {
        [LAYER_SUPPORTED_ACTIONS.ADD]: (params) => {
            const { type, spaceId } = params;
            const activeSpace = spaceStore.getActiveSpace();
            const layers = Array.isArray(activeSpace?.sharedState?.layers) 
                ? activeSpace.sharedState.layers 
                : [];
            
            const newLayer = {
                id: `layer-${Date.now()}`,
                type,
                name: type,
                // ... autres propriétés
            };

            spaceStore.updateSpaceGenericSharedState({
                spaceId,
                changes: { layers: [...layers, newLayer] }
            });
        },
        // ... autres handlers
    };
};

// 3. Validation
const validateLayerAdd = (action: Action): IActionValidationResult => {
    const { type, spaceId } = action.payload;
    if (!type || !spaceId) {
        return {
            valid: false,
            message: "Type et spaceId requis pour l'ajout d'un calque"
        };
    }
    return { valid: true };
};

// 4. Plugin
export const layerActionPlugin: IActionPlugin = {
    id: "layer",
    priority: ActionPriority.NORMAL,
    actionTypes: Object.values(LAYER_SUPPORTED_ACTIONS),
    handler: (action: Action) => {
        const handler = handlers[action.type];
        if (handler) {
            handler(action.payload);
        }
    }
};
```

## Conclusion

Le système de `SupportedActions` offre une approche structurée et typée pour gérer les actions dans Karmyc. En suivant ce guide, vous pouvez :

- Créer des actions bien définies et typées
- Implémenter des validateurs robustes
- Maintenir une base de code cohérente
- Faciliter l'ajout de nouvelles fonctionnalités
- Intégrer proprement les actions dans vos plugins

N'hésitez pas à consulter les exemples existants dans le code source pour plus d'inspiration. 
