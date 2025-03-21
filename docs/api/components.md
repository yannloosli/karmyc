# API des Composants

Cette documentation détaille les composants React disponibles dans l'API publique de Karmyc.

## KarmycProvider

`KarmycProvider` est le composant principal qui doit envelopper toute application utilisant le système de layout.

### Interface

```typescript
interface KarmycProviderProps {
  /**
   * Contenu de l'application
   */
  children: React.ReactNode;
  
  /**
   * Configuration optionnelle du système de layout
   */
  config?: {
    theme?: 'light' | 'dark' | 'system';
    plugins?: string[];
    defaultAreas?: string[];
    initialState?: any;
  };
}
```

### Exemple

```tsx
import { KarmycProvider } from '@karmyc';

function App() {
  return (
    <KarmycProvider
      config={{
        theme: 'dark',
        plugins: ['timeline', 'properties'],
        defaultAreas: ['timeline', 'workspace']
      }}
    >
      <MyEditor />
    </KarmycProvider>
  );
}
```

## Area

Le composant `Area` permet d'afficher et de gérer une zone interactive dans l'éditeur.

### Interface

```typescript
interface AreaProps {
  /**
   * Identifiant unique de la zone
   */
  id: string;
  
  /**
   * Type de zone (utilisé pour déterminer le composant à rendre)
   */
  type: string;
  
  /**
   * Propriétés spécifiques passées au composant de zone
   */
  props?: Record<string, any>;
  
  /**
   * Disposition de la zone (position, taille)
   */
  layout?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  
  /**
   * Indique si la zone est draggable
   */
  draggable?: boolean;
  
  /**
   * Indique si la zone est resizable
   */
  resizable?: boolean;
  
  /**
   * Fonction appelée lorsque la zone est sélectionnée
   */
  onSelect?: () => void;
}
```

### Exemple

```tsx
import { Area } from '@karmyc';

function MyLayout() {
  return (
    <div className="layout">
      <Area
        id="timeline-1"
        type="timeline"
        props={{ data: timelineData }}
        layout={{ x: 0, y: 0, width: 800, height: 200 }}
        draggable
        resizable
      />
      <Area
        id="properties-1"
        type="properties"
        layout={{ x: 800, y: 0, width: 400, height: 600 }}
      />
    </div>
  );
}
```

## Composants Exportés

```typescript
import {
  KarmycProvider,
  Area,
  AreaRoot,
  ContextMenu,
  Toolbar,
  Resizable,
  Draggable,
  // ...
} from '@karmyc';
```

## Exemple Complet

```tsx
import { KarmycProvider, AreaRoot, useArea } from '@karmyc';

function App() {
  return (
    <KarmycProvider>
      <EditorLayout />
    </KarmycProvider>
  );
}

function EditorLayout() {
  const { areas, addArea } = useArea();
  
  return (
    <div className="editor">
      <button onClick={() => addArea({ type: 'timeline' })}>
        Ajouter Timeline
      </button>
      
      <AreaRoot>
        {areas.map(area => (
          <Area key={area.id} {...area} />
        ))}
      </AreaRoot>
    </div>
  );
}
``` 
