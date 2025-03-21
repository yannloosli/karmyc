# Guide de démarrage rapide

Ce guide vous aidera à intégrer Karmyc dans votre application React.

## Installation

```bash
npm install @karmyc
# ou
yarn add @karmyc
```

## Configuration de base

### 1. Envelopper votre application avec KarmycProvider

La première étape consiste à envelopper votre application avec le composant `KarmycProvider` :

```tsx
// src/App.tsx
import React from 'react';
import { KarmycProvider } from '@karmyc';

function App() {
  return (
    <KarmycProvider>
      <YourApplication />
    </KarmycProvider>
  );
}

export default App;
```

### 2. Créer et gérer des zones

Utilisez le hook `useArea` pour créer et gérer des zones dans votre application :

```tsx
// src/components/Editor.tsx
import React from 'react';
import { useArea, AreaRoot, Area } from '@karmyc';

function Editor() {
  const { areas, addArea, removeArea } = useArea();

  return (
    <div className="editor">
      <div className="toolbar">
        <button onClick={() => addArea({ type: 'timeline' })}>
          Ajouter Timeline
        </button>
        <button onClick={() => addArea({ type: 'properties' })}>
          Ajouter Properties Panel
        </button>
      </div>
      
      <AreaRoot>
        {areas.map(area => (
          <Area 
            key={area.id} 
            {...area} 
            onClose={() => removeArea(area.id)} 
          />
        ))}
      </AreaRoot>
    </div>
  );
}

export default Editor;
```

### 3. Enregistrer des types de zones personnalisés

Créez et enregistrez vos propres types de zones avec le hook `useRegisterAreaType` :

```tsx
// src/components/AreaTypeRegistration.tsx
import React from 'react';
import { useRegisterAreaType } from '@karmyc';
import TimelineArea from './areas/TimelineArea';
import PropertiesArea from './areas/PropertiesArea';

function AreaTypeRegistration() {
  useRegisterAreaType({
    id: 'timeline',
    name: 'Timeline',
    component: TimelineArea,
    defaultProps: {
      height: 200,
      width: 800,
    },
  });

  useRegisterAreaType({
    id: 'properties',
    name: 'Properties',
    component: PropertiesArea,
    defaultProps: {
      height: 400,
      width: 300,
    },
  });

  return null;
}

export default AreaTypeRegistration;
```

### 4. Intégrer les composants d'enregistrement dans votre application

```tsx
// src/App.tsx
import React from 'react';
import { KarmycProvider } from '@karmyc';
import Editor from './components/Editor';
import AreaTypeRegistration from './components/AreaTypeRegistration';

function App() {
  return (
    <KarmycProvider>
      <AreaTypeRegistration />
      <Editor />
    </KarmycProvider>
  );
}

export default App;
```

## Fonctionnalités avancées

### Personnalisation du thème

Vous pouvez personnaliser le thème de Karmyc en passant une configuration au provider :

```tsx
<KarmycProvider 
  config={{
    theme: 'dark', // 'light', 'dark', ou 'system'
  }}
>
  {/* Votre application */}
</KarmycProvider>
```

### Utilisation des raccourcis clavier

Configurez des raccourcis clavier pour vos zones :

```tsx
import { useRegisterAreaType, keyboardShortcutRegistry } from '@karmyc';

// Enregistrer le type de zone
useRegisterAreaType({
  id: 'timeline',
  // ...
});

// Enregistrer des raccourcis clavier
keyboardShortcutRegistry.registerShortcuts('timeline', [
  {
    key: 'Delete',
    name: 'Supprimer l\'élément sélectionné',
    fn: (areaId, params) => {
      // Logique de suppression
      params.submitAction('Supprimer élément');
    },
    history: true,
  },
  // Autres raccourcis...
]);
```

## Étapes suivantes

- [API des Composants](../api/components.md)
- [API des Hooks](../api/hooks.md)
- [Guide des zones personnalisées](./custom-areas.md)
