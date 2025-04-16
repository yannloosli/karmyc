# Getting Started with Karmyc

This guide will help you set up and start using Karmyc in your React application.

## Installation

First, install Karmyc using yarn:

```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-core
```

## Basic Setup

### 1. Add the KarmycProvider with useKarmyc

The first step is to set up the Karmyc system using the `useKarmyc` hook and wrap your application with the `KarmycProvider` component:

```tsx
// src/index.tsx or src/App.tsx
import React from 'react';
import { KarmycProvider, useKarmyc } from '@gamesberry/karmyc-core';

function App() {
  // Initialize and configure Karmyc
  const config = useKarmyc({
    enableLogging: process.env.NODE_ENV === 'development',
    keyboardShortcutsEnabled: true
  });

  return (
    <KarmycProvider options={config}>
      <YourApplication />
    </KarmycProvider>
  );
}

export default App;
```

### 2. Register Area Types

Before using areas, you need to register the area types your application will use. This can be done with the `useRegisterAreaType` hook:

```tsx
// src/components/Layout.tsx
import React from 'react';
import { useRegisterAreaType } from '@gamesberry/karmyc-core';
import TextArea from './areas/TextArea';
import ImageArea from './areas/ImageArea';

function Layout() {
  // Register a text area type
  useRegisterAreaType(
    'text-area',
    TextArea,
    { content: '' },  // Initial state
    {
      displayName: 'Text',
      defaultSize: { width: 300, height: 200 }
    }
  );
  
  // Register an image area type
  useRegisterAreaType(
    'image-area',
    ImageArea,
    { url: '', caption: '' },  // Initial state
    {
      displayName: 'Image',
      defaultSize: { width: 400, height: 300 }
    }
  );
  
  return (
    <div className="layout-container">
      {/* Your layout components */}
    </div>
  );
}

export default Layout;
```

### 3. Create Area Components

Create the components for each area type using the `AreaComponentProps` interface:

```tsx
// src/components/areas/TextArea.tsx
import React from 'react';
import { useArea } from '@gamesberry/karmyc-core';
import { AreaComponentProps } from '@gamesberry/karmyc-core';

interface TextAreaState {
  content: string;
}

const TextArea: React.FC<AreaComponentProps<TextAreaState>> = ({ 
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
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          resize: 'none'
        }}
        placeholder="Enter text here..."
      />
    </div>
  );
};

export default TextArea;
```

```tsx
// src/components/areas/ImageArea.tsx
import React from 'react';
import { useArea } from '@gamesberry/karmyc-core';
import { AreaComponentProps } from '@gamesberry/karmyc-core';

interface ImageAreaState {
  url: string;
  caption: string;
}

const ImageArea: React.FC<AreaComponentProps<ImageAreaState>> = ({ 
  id, 
  state, 
  viewport 
}) => {
  const { updateAreaState } = useArea();
  
  const handleCaptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateAreaState(id, {
      caption: e.target.value
    });
  };

  return (
    <div style={{ width: viewport.width, height: viewport.height, padding: '8px' }}>
      {state.url ? (
        <img 
          src={state.url} 
          alt={state.caption || 'Image'} 
          style={{ maxWidth: '100%', maxHeight: 'calc(100% - 40px)' }}
        />
      ) : (
        <div className="placeholder">No image selected</div>
      )}
      <input
        type="text"
        value={state.caption || ''}
        onChange={handleCaptionChange}
        placeholder="Image caption"
        style={{ width: '100%', marginTop: '8px' }}
      />
    </div>
  );
};

export default ImageArea;
```

### 4. Create and Display Areas

Use the `useArea` hook to create and manage areas, and the `AreaRoot` component to display them:

```tsx
// src/components/Workspace.tsx
import React from 'react';
import { AreaRoot, useArea } from '@gamesberry/karmyc-core';

function Workspace() {
  const { createArea } = useArea();
  
  const handleAddTextArea = () => {
    createArea('text-area', { content: 'New text area content' });
  };
  
  const handleAddImageArea = () => {
    createArea('image-area', { 
      url: 'https://example.com/image.jpg',
      caption: 'Sample image'
    });
  };
  
  return (
    <div className="workspace">
      <div className="toolbar">
        <button onClick={handleAddTextArea}>Add Text Area</button>
        <button onClick={handleAddImageArea}>Add Image Area</button>
      </div>
      
      <AreaRoot />
    </div>
  );
}

export default Workspace;
```

### 5. Putting it All Together

Now, integrate all components into your main app:

```tsx
// src/App.tsx
import React from 'react';
import { KarmycProvider, useKarmyc } from '@gamesberry/karmyc-core';
import Layout from './components/Layout';
import Workspace from './components/Workspace';

function App() {
  // Initialize Karmyc
  const config = useKarmyc({
    enableLogging: process.env.NODE_ENV === 'development',
    keyboardShortcutsEnabled: true
  });

  return (
    <KarmycProvider options={config}>
      <Layout />
      <Workspace />
    </KarmycProvider>
  );
}

export default App;
```

## Next Steps

Once you have set up the basic structure, you can explore more advanced features:

1. Configure [Context Menus](./context-menus.md) for your areas
2. Set up [Keyboard Shortcuts](./keyboard-shortcuts.md) 
3. Implement [Drag and Drop](./drag-and-drop.md) functionality
4. Learn about [Performance Optimizations](./optimizations.md)

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
