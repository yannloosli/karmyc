# Getting Started with Karmyc

This guide will help you set up a basic project using Karmyc.

## Installation

Karmyc is distributed as a set of packages in a monorepo structure. You'll typically need at least the core package:

```bash
npm install @gamesberry/karmyc-core
```

You may also want to install additional packages depending on your needs:

```bash
# For shared utilities
npm install @gamesberry/karmyc-shared

# For area projects (specific implementations)
npm install @gamesberry/karmyc-area-projects
```

## Basic Setup

Here's a minimal setup to get Karmyc running in your React application:

```tsx
import React from 'react';
import ReactDOM from 'react-dom';
import { KarmycProvider, AreaRoot, useKarmyc } from '@gamesberry/karmyc-core';

function App() {
  // Initialize Karmyc with basic configuration
  const config = useKarmyc({
    enableLogging: true,
    initialAreas: [],
    keyboardShortcutsEnabled: true
  });

  return (
    <KarmycProvider options={config}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <AreaRoot />
      </div>
    </KarmycProvider>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
```

## Adding Areas

Areas are the core building blocks in Karmyc. Here's how to create and add areas:

```tsx
import { useArea } from '@gamesberry/karmyc-core';

function MyEditor() {
  const { addArea } = useArea();

  const handleAddTextArea = () => {
    addArea({
      type: 'text-editor',
      state: {
        content: 'Hello, world!'
      },
      position: { x: 100, y: 100 },
      size: { width: 400, height: 300 }
    });
  };

  return (
    <div>
      <button onClick={handleAddTextArea}>Add Text Editor</button>
      <AreaRoot />
    </div>
  );
}
```

## Creating Custom Area Types

To create custom area types, you need to:

1. Define a component for your area type
2. Register it with Karmyc

```tsx
import React from 'react';
import { registerAreaType, AreaComponentProps } from '@gamesberry/karmyc-core';

// Define the state shape for your area
interface MyAreaState {
  text: string;
}

// Create the area component
const MyCustomArea: React.FC<AreaComponentProps<MyAreaState>> = ({ 
  id, 
  state, 
  viewport 
}) => {
  return (
    <div 
      style={{ 
        width: viewport.width, 
        height: viewport.height,
        backgroundColor: '#f0f0f0',
        padding: '1em'
      }}
    >
      <h3>Custom Area</h3>
      <p>{state.text}</p>
    </div>
  );
};

// Register the area type
registerAreaType('my-custom-area', MyCustomArea);

// Then you can use it with:
// addArea({ type: 'my-custom-area', state: { text: 'Hello!' } });
```

## Working with the Menu Bar

Karmyc provides a MenuBar component for creating application menus:

```tsx
import { MenuBar } from '@gamesberry/karmyc-core';

function MyApp() {
  return (
    <div className="app">
      <MenuBar 
        areaId="root" 
        areaState={{}} 
        areaType="app" 
      />
      <AreaRoot />
    </div>
  );
}
```

## Adding Status Bar Information

For displaying status information, use the StatusBar component:

```tsx
import { StatusBar } from '@gamesberry/karmyc-core';

function MyApp() {
  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ flex: 1 }}>
        <AreaRoot />
      </div>
      <StatusBar 
        areaId="root" 
        areaState={{}} 
        areaType="app" 
      />
    </div>
  );
}
```

## Next Steps

Check out the following resources to learn more:

- [Component API Reference](../api/components.md)
- [Area System Overview](../architecture/area-system.md)
- [Project Structure](../architecture/project-structure.md)
- [Examples](https://github.com/yourusername/karmyc/tree/main/packages/examples)

## Importing from Karmyc

For consistent and maintainable code, always import Karmyc components, hooks, and utilities directly from the main entry point:

```typescript
// ✅ Recommended approach
import { 
    KarmycProvider, 
    useKarmyc, 
    useArea, 
    useRegisterAreaType,
    areaRegistry,
    actionRegistry,
    store
} from '@gamesberry/karmyc-core';

// ❌ Avoid importing directly from internal implementation files
// import { useKarmyc } from '@gamesberry/karmyc-core/lib/hooks/useKarmyc';
// import { areaRegistry } from '@gamesberry/karmyc-core/lib/area/registry';
```

This practice ensures you're using the official public API and makes your code more maintainable in the long run, as internal file structures might change between versions.

## API Reference

For more detailed information about the API, check out the following resources:

- [Components API](../api/components.md)
- [Hooks API](../api/hooks.md)
- [Integration Guide](../api/integration.md) 
