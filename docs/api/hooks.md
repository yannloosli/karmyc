# Hooks API

## Overview

This document details the hooks provided by Karmyc for interacting with the layout system. These hooks provide a convenient interface for registering area types, actions, context menus, and initializing the system with custom configuration.

> **Important**: Always import hooks and other API components directly from the main package entry point: `import { useKarmyc, useArea } from '@gamesberry/karmyc-core';` rather than from internal implementation files.

## Core Hooks

### useKarmyc

The `useKarmyc` hook is the main entry point for configuring and initializing the Karmyc system.

```typescript
import { useKarmyc, KarmycProvider } from '@gamesberry/karmyc-core';

function App() {
  const config = useKarmyc({
    enableLogging: true,
    plugins: [],
    initialAreas: [
      { type: 'text-area', state: { content: 'Example text' } },
      { type: 'image-area', state: { url: '/example.jpg' } }
    ],
    keyboardShortcutsEnabled: true
  });
  
  return (
    <KarmycProvider options={config}>
      <MyEditor />
    </KarmycProvider>
  );
}
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| options | `IKarmycOptions` | Configuration options for the Karmyc system |

#### Options Properties

| Name | Type | Description | Default |
|------|------|-------------|---------|
| enableLogging | `boolean` | Enable logging for debugging | `false` |
| plugins | `Array` | List of plugin objects to enable | `[]` |
| validators | `Array` | Custom validators for actions | `[]` |
| initialAreas | `Array` | Initial areas to create | `[]` |
| keyboardShortcutsEnabled | `boolean` | Enable keyboard shortcuts | `true` |

#### Return Value

Returns a memoized configuration object that can be passed to the KarmycProvider's `options` prop.

### useKarmycLayout

The `useKarmycLayout` hook initializes and configures the Karmyc system. This hook is used internally by `useKarmyc` and is provided for advanced use cases.

```typescript
import { useKarmycLayout } from '@gamesberry/karmyc-core';

function MyApp() {
  useKarmycLayout({
    enableLogging: true,
    plugins: ['timeline', 'properties'],
    initialAreas: [
      { type: 'timeline', state: { data: [] } },
      { type: 'properties', state: { selected: null } }
    ]
  });
  
  return <div>My App</div>;
}
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| config | `IKarmycConfig` | Configuration object for the Karmyc system |

### useKarmycLayoutProvider

The `useKarmycLayoutProvider` hook creates a configuration for the KarmycProvider component. This hook is used internally by `useKarmyc` and is provided for advanced use cases.

```typescript
import { useKarmycLayoutProvider, KarmycProvider } from '@gamesberry/karmyc-core';

function Root() {
  const config = useKarmycLayoutProvider({
    enableLogging: true,
    keyboardShortcutsEnabled: true
  });
  
  return (
    <KarmycProvider config={config}>
      <App />
    </KarmycProvider>
  );
}
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| options | `IKarmycOptions` | Options for the layout provider |

#### Return Value

Returns a memoized configuration object that can be passed to the KarmycProvider.

## Area Registration

### useRegisterAreaType

The `useRegisterAreaType` hook registers a custom area type for use in the application.

```typescript
import { useRegisterAreaType } from '@gamesberry/karmyc-core';
import TextArea from './components/TextArea';

function AreaRegistration() {
  useRegisterAreaType(
    'text-area',
    TextArea,
    { content: '' },  // Initial state
    {
      displayName: 'Text Area',
      defaultSize: { width: 300, height: 200 }
    }
  );
  
  return null; // This component doesn't render anything
}
```

#### Parameters

| Name | Type | Description |
|------|------|-------------|
| areaType | `string` | Unique identifier for the area type |
| component | `React.ComponentType` | React component to render for this area type |
| initialState | `any` | Default state for new areas of this type |
| options | `object` | Additional configuration options |

#### Options Properties

| Name | Type | Description |
|------|------|-------------|
| displayName | `string` | Human-readable name for the area type |
| icon | `React.ComponentType` | Icon component for the area type |
| defaultSize | `{ width: number, height: number }` | Default size for new areas |
| supportedActions | `string[]` | Actions that can be performed on this area type |

### useArea

The `useArea` hook provides functions for manipulating areas and accessing their state.

```typescript
import { useArea } from '@gamesberry/karmyc-core';

function AreaManager() {
  const { 
    areas,
    activeArea,
    createArea,
    deleteArea,
    updateAreaState,
    setActive
  } = useArea();
  
  const handleAddTextArea = () => {
    createArea('text-area', { content: 'New text area' });
  };
  
  return (
    <div>
      <button onClick={handleAddTextArea}>Add Text Area</button>
      <div>
        {areas.map(area => (
          <div 
            key={area.id}
            onClick={() => setActive(area.id)}
            className={activeArea?.id === area.id ? 'active' : ''}
          >
            {area.type}: {area.id}
            <button onClick={() => deleteArea(area.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Return Value

| Name | Type | Description |
|------|------|-------------|
| areas | `Array<IArea>` | Array of all areas |
| activeArea | `IArea \| null` | Currently active area |
| createArea | `Function` | Creates a new area |
| deleteArea | `Function` | Deletes an area by ID |
| updateAreaState | `Function` | Updates an area's state |
| setActive | `Function` | Sets the active area by ID |

## Context Menu Management

### useContextMenu

Provides functions for creating and managing context menus.

```typescript
import { useContextMenu } from '@gamesberry/karmyc-core';

function ContextMenuExample() {
  const { openContextMenu, closeContextMenu } = useContextMenu();
  
  const handleRightClick = (e) => {
    e.preventDefault();
    
    openContextMenu('example-menu', [
      { label: 'Option 1', onClick: () => console.log('Option 1 clicked') },
      { label: 'Option 2', onClick: () => console.log('Option 2 clicked') },
    ], { x: e.clientX, y: e.clientY });
  };
  
  return <div onContextMenu={handleRightClick}>Right click me</div>;
}
```

## Best Practices

1. **Hook Usage**
   - Use `useKarmyc` for the simplest setup in most cases
   - Place hooks at the top level of your components
   - Don't use hooks inside conditions
   - Register area types in your app's initialization component

2. **State Management**
   - Use `updateAreaState` to update an area's state
   - Listen for state changes with selectors
   - Use immutable patterns for state updates

3. **Performance**
   - Memoize expensive computations
   - Use `useCallback` for event handlers
   - Avoid unnecessary re-renders by using selectors

## Example: Complete App Setup

```tsx
import React from 'react';
import { 
  KarmycProvider, 
  useKarmyc,
  AreaRoot, 
  useRegisterAreaType, 
  useArea 
} from '@gamesberry/karmyc-core';

// Define area components
const TextNoteArea = ({ areaState, width, height }) => (
  <div style={{ width, height }} className="text-note">
    <h3>Text Note</h3>
    <p>{areaState.content}</p>
  </div>
);

// App component with area registration
function AppContent() {
  // Register area types
  useRegisterAreaType(
    'text-note',
    TextNoteArea,
    { content: 'Initial content' },
    {
      displayName: 'Text Note',
      defaultSize: { width: 300, height: 200 }
    }
  );
  
  // Get area creation function
  const { createArea } = useArea();
  
  return (
    <div>
      <button onClick={() => createArea('text-note', { content: 'New note' })}>
        Add Text Note
      </button>
      <AreaRoot />
    </div>
  );
}

// Root component with provider setup
export default function App() {
  // Create and initialize Karmyc with a single hook
  const config = useKarmyc({
    enableLogging: process.env.NODE_ENV === 'development',
    keyboardShortcutsEnabled: true,
    initialAreas: [
      { type: 'text-note', state: { content: 'Welcome to Karmyc!' } }
    ]
  });
  
  return (
    <KarmycProvider config={config}>
      <AppContent />
    </KarmycProvider>
  );
}
``` 

## Integration with State Management (Zustand)

Karmyc Core now uses Zustand for state management. Components interact with the state stores using specific hooks provided by each store (e.g., `useAreaStore`, `useContextMenuStore`).

See the [Zustand Store Architecture](./../architecture/store.md) document for details on the available stores, their state, actions, and how to use them within React components.

## Store Configuration
