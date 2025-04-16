# Component API

This documentation details the React components available in Karmyc's public API.

## KarmycProvider

`KarmycProvider` is the main component that must wrap any application using the layout system.

### Interface

```typescript
interface IKarmycProviderProps {
  /**
   * Application content
   */
  children: React.ReactNode;
  
  /**
   * Optional configuration for the layout system
   */
  options?: IKarmycOptions;
  
  /**
   * Optional custom Redux store
   */
  customStore?: any;
}
```

### Example

```tsx
import { KarmycProvider, useKarmyc } from '@gamesberry/karmyc-core';

function App() {
  // Initialize Karmyc with configuration
  const config = useKarmyc({
    enableLogging: true,
    plugins: [],
    initialAreas: [],
    keyboardShortcutsEnabled: true
  });

  return (
    <KarmycProvider options={config}>
      <MyEditor />
    </KarmycProvider>
  );
}
```

## Area

The `Area` component allows you to display and manage an interactive area in the editor.

### Interface

```typescript
interface AreaProps {
  /**
   * The area object to display
   */
  area: IArea;
  
  /**
   * Indicates if the area is currently selected
   */
  isActive?: boolean;
  
  /**
   * Callback called when the area is selected
   */
  onSelect?: (area: IArea) => void;
  
  /**
   * Child content to display in the area
   */
  children?: React.ReactNode;
}

interface IArea {
  /**
   * Unique identifier for the area
   */
  id: string;
  
  /**
   * Area type (used to determine which component to render)
   */
  type: string;
  
  /**
   * Area state
   */
  state: any;
  
  /**
   * Area position
   */
  position: { x: number; y: number };
  
  /**
   * Area size
   */
  size: { width: number; height: number };
}
```

### Example

```tsx
import { Area, useArea } from '@gamesberry/karmyc-core';

function MyLayout() {
  const { areas, setActive, activeArea } = useArea();
  
  return (
    <div className="layout">
      {areas.map(area => (
        <Area
          key={area.id}
          area={area}
          isActive={activeArea?.id === area.id}
          onSelect={setActive}
        />
      ))}
    </div>
  );
}
```

## AreaComponent

For creating custom area components, use the `AreaComponentProps` interface.

### Interface

```typescript
interface AreaComponentProps<T = any> {
  /**
   * Unique identifier for the area
   */
  id: string;
  
  /**
   * Area state
   */
  state: T;
  
  /**
   * Area type
   */
  type: string;
  
  /**
   * Area viewport (position and dimensions)
   */
  viewport: {
    width: number;
    height: number;
    left: number;
    top: number;
  };
}
```

### Example

```tsx
import React from 'react';
import { useArea } from '@gamesberry/karmyc-core';
import { AreaComponentProps } from '@gamesberry/karmyc-core';

interface TextNoteState {
  content: string;
}

export const TextNoteArea: React.FC<AreaComponentProps<TextNoteState>> = ({
  id,
  state,
  viewport
}) => {
  const { updateAreaState } = useArea();

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateAreaState(id, {
      content: e.target.value
    });
  };

  return (
    <div style={{ width: viewport.width, height: viewport.height }}>
      <textarea
        value={state.content || ''}
        onChange={handleChange}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
```

## Exported Components

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
} from '@gamesberry/karmyc-core';
```

## Complete Example

```tsx
import { KarmycProvider, AreaRoot, useArea } from '@gamesberry/karmyc-core';

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
        Add Timeline
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
