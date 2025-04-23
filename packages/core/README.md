# Karmyc Core

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)

Core layout system with drag & drop, resizable panels, and state management for the Karmyc editor.

## Features

- **Modular Layouts**: Create and arrange areas in flexible configurations
- **Customizable Areas**: Build any type of area with your own rendering logic
- **Drag & Drop**: Intuitive drag and drop interface for rearranging areas
- **Resizable Panels**: Adjust panel sizes with fluid resizing
- **State Management**: Integrated store for state management
- **Undo/Redo**: Built-in history management
- **Context Menus**: Configurable context menus for enhanced interactions

## Installation

```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-core

# Using npm
npm install @gamesberry/karmyc-core
```

## Quick Start

```tsx
import React from 'react';
import { 
  KarmycProvider, 
  AreaRoot, 
  useRegisterAreaType, 
  useArea 
} from '@gamesberry/karmyc-core';

// Define a custom area component
const TextNoteArea = ({ areaState, width, height }) => (
  <div style={{ width, height }}>
    <h3>Text Note</h3>
    <p>{areaState.content}</p>
  </div>
);

function App() {
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

export default function Root() {
  return (
    <KarmycProvider>
      <App />
    </KarmycProvider>
  );
}
```

## API Reference

For detailed documentation on components, hooks, and API usage, please refer to the main [documentation](../../docs/api).

## Related Packages

- [@gamesberry/karmyc-shared](../shared) - Shared utilities and components
- [@gamesberry/karmyc-area-projects](../area-projects) - Project management plugin
- [@gamesberry/karmyc-examples](../examples) - Example applications 
