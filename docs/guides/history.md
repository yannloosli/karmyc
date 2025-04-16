# Système d'Historique (Undo/Redo)

Ce guide explique le fonctionnement du système d'historique dans Karmyc, qui permet d'annuler (undo) et de rétablir (redo) des actions.

## Vue d'ensemble

Le système d'historique de Karmyc utilise une architecture basée sur des plugins pour enregistrer les actions importantes et permettre leur annulation ou leur rétablissement. Il est composé de plusieurs composants :

1. **Plugin d'historique** : Capture les actions spécifiées pour l'historique
2. **Middleware d'historique** : Intercepte les actions et génère des différences (diffs)
3. **Slice d'historique** : Gère l'état de l'historique (passé, futur, actions en cours)
4. **Hooks React** : Fournit une API simple pour utiliser l'historique dans les composants

## Configuration rapide

```tsx
import React from 'react';
import { useKarmyc, KarmycProvider, historyPlugin } from '@gamesberry/karmyc-core';

function App() {
  // Activer l'historique via le système de plugins
  const config = useKarmyc({
    plugins: [historyPlugin],
    enableLogging: process.env.NODE_ENV === 'development'
  });
  
  return (
    <KarmycProvider options={config}>
      <YourApplication />
      <HistoryControls /> {/* Composant optionnel de contrôle de l'historique */}
    </KarmycProvider>
  );
}
```

## Utilisation du hook useHistory

Karmyc fournit un hook `useHistory` pour interagir facilement avec le système d'historique dans vos composants :

```tsx
import React from 'react';
import { useHistory } from '@gamesberry/karmyc-core';

function HistoryControls() {
  const { canUndo, canRedo, undo, redo, historyLength } = useHistory();
  
  return (
    <div className="history-controls">
      <button 
        onClick={undo} 
        disabled={!canUndo}
      >
        Annuler
      </button>
      
      <button 
        onClick={redo} 
        disabled={!canRedo}
      >
        Rétablir
      </button>
      
      <div className="history-info">
        Actions dans l'historique : {historyLength}
      </div>
    </div>
  );
}
```

## Actions enregistrées dans l'historique

Par défaut, le plugin d'historique enregistre les actions suivantes :

- `area/addArea` : Ajout d'une zone
- `area/removeArea` : Suppression d'une zone
- `area/updateArea` : Mise à jour d'une zone
- `area/moveArea` : Déplacement d'une zone
- `area/resizeArea` : Redimensionnement d'une zone
- `composition/update` : Mise à jour d'une composition
- `composition/addElement` : Ajout d'un élément
- `composition/removeElement` : Suppression d'un élément
- `composition/updateElement` : Mise à jour d'un élément
- `project/update` : Mise à jour d'un projet

## Personnalisation du système d'historique

### Ignorer certaines actions

Vous pouvez modifier la liste des actions à enregistrer dans l'historique en créant votre propre plugin :

```typescript
import { historyPlugin } from '@gamesberry/karmyc-core';

// Créer un plugin d'historique personnalisé
const customHistoryPlugin = {
  ...historyPlugin,
  actionTypes: [
    'area/addArea',
    'area/removeArea',
    // Votre liste personnalisée d'actions
  ]
};

// Utiliser ce plugin personnalisé
const config = useKarmyc({
  plugins: [customHistoryPlugin]
});
```

### Limiter la taille de l'historique

Vous pouvez configurer la limite de l'historique :

```typescript
const config = useKarmyc({
  plugins: [historyPlugin],
  historyOptions: {
    limit: 50 // Maximum 50 actions dans l'historique
  }
});
```

### Accès aux métadonnées des actions

Vous pouvez accéder aux métadonnées des actions enregistrées dans l'historique :

```typescript
function HistoryList() {
  const { actions } = useHistory();
  
  return (
    <div className="history-list">
      <h3>Historique des actions</h3>
      <ul>
        {actions.map(action => (
          <li key={action.id}>
            {action.type} - {new Date(action.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Détails techniques

### Structure des entrées d'historique

Chaque entrée dans l'historique contient les informations suivantes :

```typescript
interface HistoryEntry {
  id: string;        // Identifiant unique
  type: string;      // Type d'action
  timestamp: number; // Horodatage
  payload: any;      // Données de l'action
  prevState: any;    // État avant l'action
  nextState: any;    // État après l'action
  description: string; // Description lisible
}
```

### Architecture interne

Le système d'historique utilise le modèle Redux pour gérer l'état de l'historique :

1. Le **middleware d'historique** intercepte toutes les actions
2. Pour les actions d'historique, il génère des différences (diffs) entre l'état avant et après
3. Le **slice d'historique** stocke les entrées d'historique avec l'état précédent et suivant
4. Le **hook useHistory** fournit une API pour interagir avec l'historique

## Bonnes pratiques

1. **Actions atomiques** : Concevez vos actions pour être atomiques et réversibles
2. **Descriptions claires** : Utilisez des descriptions claires pour les actions
3. **Limiter la taille** : Limitez la taille de l'historique pour éviter les problèmes de performance
4. **Optimisation des diffs** : Utilisez des outils comme Immer pour générer des diffs efficaces

## Exemple complet

Voici un exemple complet d'utilisation du système d'historique :

```tsx
import React, { useState } from 'react';
import { useHistory, useDispatch } from '@gamesberry/karmyc-core';

// Composant de contrôle de l'historique
function HistoryControls() {
  const { canUndo, canRedo, undo, redo, actions } = useHistory();
  const [showHistory, setShowHistory] = useState(false);
  
  return (
    <div className="history-panel">
      <div className="history-buttons">
        <button onClick={undo} disabled={!canUndo}>Annuler</button>
        <button onClick={redo} disabled={!canRedo}>Rétablir</button>
        <button onClick={() => setShowHistory(!showHistory)}>
          {showHistory ? 'Masquer l\'historique' : 'Afficher l\'historique'}
        </button>
      </div>
      
      {showHistory && (
        <div className="history-list">
          <h4>Historique des actions</h4>
          <ul>
            {actions.map(action => (
              <li key={action.id} className="history-item">
                <span className="history-type">{action.type}</span>
                <span className="history-time">
                  {new Date(action.timestamp).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default HistoryControls;
``` 
