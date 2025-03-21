# Création de zones personnalisées avancées

Ce guide explique comment créer des zones personnalisées avec des fonctionnalités avancées pour le système de layout.

## Prérequis

Avant de commencer, assurez-vous d'avoir lu le [guide de démarrage](./getting-started.md) et d'avoir configuré correctement le système de layout dans votre application.

## Structure avancée d'une zone personnalisée

### Interface complète des props

```typescript
interface AreaComponentProps<T = any> {
  // Propriétés de base
  areaId: string;
  type: string;
  areaState: T;
  
  // Propriétés de position/taille
  width: number;
  height: number;
  left: number;
  top: number;
  
  // Propriétés d'état
  isActive: boolean;
  isResizing: boolean;
  isDragging: boolean;
  
  // Fonctions de mise à jour
  updateState: (changes: Partial<T>) => void;
  
  // Éléments optionnels
  viewport?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}
```

## Exemple de zone personnalisée avancée

### 1. Création d'un composant avec état interne

```tsx
// src/components/AdvancedArea.tsx
import React, { useState, useEffect } from 'react';
import { AreaComponentProps, useContextMenu } from '@karmyc';

interface AdvancedAreaState {
  title: string;
  content: string;
  backgroundColor: string;
}

export const AdvancedArea: React.FC<AreaComponentProps<AdvancedAreaState>> = ({
  width,
  height,
  left,
  top,
  areaState,
  areaId,
  isActive,
  updateState,
}) => {
  // État local pour l'édition du titre
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(areaState.title);
  
  // Accès au menu contextuel
  const { open: openContextMenu } = useContextMenu();
  
  // Synchroniser l'état local avec l'état de la zone
  useEffect(() => {
    setTitleInput(areaState.title);
  }, [areaState.title]);
  
  // Gestionnaire pour la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      updateState({ title: titleInput });
      setIsEditingTitle(false);
    }
  };
  
  // Gestionnaire de menu contextuel
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    
    openContextMenu(
      { x: e.clientX, y: e.clientY },
      [
        {
          id: 'change-color',
          label: 'Changer la couleur',
          submenu: [
            {
              id: 'color-red',
              label: 'Rouge',
              action: () => updateState({ backgroundColor: '#ffcccc' }),
            },
            {
              id: 'color-green',
              label: 'Vert',
              action: () => updateState({ backgroundColor: '#ccffcc' }),
            },
            {
              id: 'color-blue',
              label: 'Bleu',
              action: () => updateState({ backgroundColor: '#ccccff' }),
            },
          ],
        },
        {
          id: 'edit-title',
          label: 'Modifier le titre',
          action: () => setIsEditingTitle(true),
        },
      ]
    );
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        backgroundColor: areaState.backgroundColor || '#f0f0f0',
        padding: '16px',
        borderRadius: '4px',
        boxShadow: isActive 
          ? '0 0 0 2px #0066ff, 0 2px 4px rgba(0,0,0,0.1)' 
          : '0 2px 4px rgba(0,0,0,0.1)',
        transition: 'background-color 0.3s, box-shadow 0.3s',
      }}
      onContextMenu={handleContextMenu}
    >
      <div className="area-header">
        {isEditingTitle ? (
          <input
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              updateState({ title: titleInput });
              setIsEditingTitle(false);
            }}
            autoFocus
          />
        ) : (
          <h2 onDoubleClick={() => setIsEditingTitle(true)}>
            {areaState.title}
          </h2>
        )}
      </div>
      
      <div className="area-content">
        <p>{areaState.content}</p>
      </div>
      
      <div className="area-footer">
        <small>ID: {areaId}</small>
      </div>
    </div>
  );
};
```

### 2. Enregistrement du type de zone avancée

```tsx
// src/components/AdvancedAreaRegistration.tsx
import React from 'react';
import { useRegisterAreaType } from '@karmyc';
import { AdvancedArea } from './AdvancedArea';

export const AdvancedAreaRegistration: React.FC = () => {
  useRegisterAreaType(
    'advanced',
    AdvancedArea,
    {
      title: 'Zone avancée',
      content: 'Contenu de la zone avancée',
      backgroundColor: '#f0f0f0',
    },
    {
      displayName: 'Zone avancée',
      defaultSize: { width: 400, height: 300 },
    }
  );
  
  return null;
};
```

## Ajout de raccourcis clavier à une zone

### 1. Définition des raccourcis

```tsx
// src/components/AdvancedAreaShortcuts.tsx
import React from 'react';
import { useAreaKeyboardShortcuts } from '@karmyc';

export const AdvancedAreaShortcuts: React.FC = () => {
  useAreaKeyboardShortcuts('advanced', [
    {
      key: 'Delete',
      name: 'Supprimer la zone',
      fn: (areaId, params) => {
        params.deleteArea(areaId);
      },
    },
    {
      key: 'C',
      modifierKeys: ['Control'],
      name: 'Copier la zone',
      fn: (areaId, params) => {
        const area = params.getAreaById(areaId);
        if (area) {
          params.createArea('advanced', { ...area.state });
        }
      },
    },
    {
      key: 'E',
      name: 'Modifier le titre',
      fn: (areaId, params) => {
        const area = params.getAreaById(areaId);
        if (area) {
          // Cette fonction sera traitée par le composant lui-même
          params.triggerAreaEvent(areaId, 'edit-title');
        }
      },
    },
  ]);
  
  return null;
};
```

### 2. Intégration des raccourcis

```tsx
// src/components/AreaTypeRegistration.tsx
import React from 'react';
import { AdvancedAreaRegistration } from './AdvancedAreaRegistration';
import { AdvancedAreaShortcuts } from './AdvancedAreaShortcuts';

export const AreaTypeRegistration: React.FC = () => {
  return (
    <>
      <AdvancedAreaRegistration />
      <AdvancedAreaShortcuts />
    </>
  );
};
```

## Communication entre zones

### 1. Utilisation des événements

```tsx
// src/components/CommunicatingAreas.tsx
import React from 'react';
import { AreaComponentProps, useArea } from '@karmyc';

// Zone émettrice
export const SenderArea: React.FC<AreaComponentProps<any>> = ({
  areaId,
  width,
  height,
  left,
  top,
}) => {
  const { areas, triggerAreaEvent } = useArea();
  
  const sendMessage = (message: string) => {
    // Trouver toutes les zones receveuses
    const receiverAreas = areas.filter(area => area.type === 'receiver');
    
    // Envoyer le message à chaque zone receveuse
    receiverAreas.forEach(area => {
      triggerAreaEvent(area.id, 'receive-message', { message, fromAreaId: areaId });
    });
  };
  
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        padding: '16px',
        backgroundColor: '#e6f7ff',
      }}
    >
      <h2>Zone émettrice</h2>
      <div>
        <input
          type="text"
          placeholder="Message"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              sendMessage(e.currentTarget.value);
              e.currentTarget.value = '';
            }
          }}
        />
        <button onClick={(e) => sendMessage((e.currentTarget.previousSibling as HTMLInputElement).value)}>
          Envoyer
        </button>
      </div>
    </div>
  );
};

// Zone receveuse
interface ReceiverState {
  messages: Array<{ id: number; text: string; fromAreaId: string }>;
}

export const ReceiverArea: React.FC<AreaComponentProps<ReceiverState>> = ({
  areaId,
  width,
  height,
  left,
  top,
  areaState,
  updateState,
}) => {
  // Gestionnaire d'événements de réception de messages
  React.useEffect(() => {
    const handleReceiveMessage = (data: { message: string; fromAreaId: string }) => {
      updateState({
        messages: [
          ...areaState.messages,
          {
            id: Date.now(),
            text: data.message,
            fromAreaId: data.fromAreaId,
          },
        ],
      });
    };
    
    // Enregistrer le gestionnaire d'événements
    const { registerAreaEvent, unregisterAreaEvent } = useArea();
    registerAreaEvent(areaId, 'receive-message', handleReceiveMessage);
    
    return () => {
      unregisterAreaEvent(areaId, 'receive-message');
    };
  }, [areaId, areaState.messages, updateState]);
  
  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        width,
        height,
        padding: '16px',
        backgroundColor: '#fff0f6',
        overflowY: 'auto',
      }}
    >
      <h2>Zone receveuse</h2>
      <div className="messages">
        {areaState.messages.length === 0 ? (
          <p>Aucun message reçu</p>
        ) : (
          <ul>
            {areaState.messages.map(msg => (
              <li key={msg.id}>
                <strong>De {msg.fromAreaId}:</strong> {msg.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
```

## Bonnes pratiques

1. **Séparation des responsabilités** : Séparez la logique de rendu de la logique métier.
2. **Optimisation des performances** : Utilisez React.memo et useCallback pour éviter les rendus inutiles.
3. **Gestion de l'état** : Préférez l'état global pour les données partagées et l'état local pour l'UI.
4. **Types TypeScript** : Définissez des interfaces précises pour l'état de vos zones.
5. **Styles** : Utilisez des classes CSS plutôt que des styles inline pour les composants complexes.
6. **Événements** : Documentez clairement les événements personnalisés utilisés dans vos zones. 
