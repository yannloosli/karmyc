<div align="center" style="display:flex;flex-direction:column;">
    <img src="./assets/brand/karmyc_logo.svg" alt="Karmyc CORE" />
  <h3>KARMYC - multimodal editor</h3>
</div>

# Karmyc Monorepo

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

A multimodal React editor.

<div align="center" style="display:flex;flex-direction:column;">
    <img src="./assets/karmyc-core.gif" alt="Karmyc CORE preview" />
</div>

## Monorepo Structure

This project is organized as a monorepo with the following packages:

- **[@gamesberry/karmyc-core](./packages/core)** - Core layout system with drag & drop, resizable panels, and state management
- **[@gamesberry/karmyc-shared](./packages/shared)** - Shared utilities and components used across packages
- **[@gamesberry/karmyc-area-projects](./packages/area-projects)** - Project management plugin for Karmyc
- **[@gamesberry/karmyc-examples](./packages/examples)** - Example applications showing how to use Karmyc

Each package has its own README with detailed documentation:
- [Core Package Documentation](./packages/core/README.md)
- [Shared Package Documentation](./packages/shared/README.md)
- [Area Projects Package Documentation](./packages/area-projects/README.md)
- [Examples Package Documentation](./packages/examples/README.md)

## Features

- **Modular Layouts**: Create and arrange areas in flexible configurations
- **Customizable Areas**: Build any type of area with your own rendering logic
- **Drag & Drop**: Intuitive drag and drop interface for rearranging areas
- **Resizable Panels**: Adjust panel sizes with fluid resizing
- **State Management**: Integrated store for state management
- **Undo/Redo**: Built-in history management
- **Context Menus**: Configurable context menus for enhanced interactions
- **Plugin System**: Extend functionality with plugins (like area-projects)

## Roadmap / Wishlist

- Area as a dialog
- Presets
- Customizable themes (light/dark mode and configurable color palettes)
- Fullscreen mode for specific areas
- Export/import of layout configurations
- Responsive/mobile support
- Improved accessibility (ARIA, keyboard navigation)
- Global Command Palette / search functionality

## Spaces in Karmyc

In Karmyc, **Spaces** are a core concept that allows you to group areas together that should share a common context. Spaces provide a way to organize your UI components and determine how they interact with each other.

### Key Features of Spaces

- **Grouped Context**: Areas within the same space can share data and state
- **Isolated Environments**: Different spaces operate independently
- **Selective Sharing**: You can choose which areas belong to which spaces

### When to Use Spaces

Use spaces when you want to:
- Create multiple independent working environments
- Group related areas that should react to the same actions
- Separate unrelated components that should function independently

### Example Use Cases

- **Color Pickers**: Group color pickers in the same space to sync their color selection
- **Document Editing**: Group document editor areas to share the same document context
- **Multi-project Support**: Switch between different projects with their own state

### Using Spaces API

```tsx
import { useSpace, useArea } from '@gamesberry/karmyc-core';

function MyComponent() {
  const { createSpace, updateSharedState, spaces, activeSpace } = useSpace();
  const { createArea, getAreasBySpaceId } = useArea();
  
  // Create a new space
  const handleCreateProject = () => {
    createSpace('My New Project', { color: '#ff0000' });
  };
  
  // Create area in the active space
  const handleCreateArea = () => {
    if (activeSpace) {
      createArea('color-picker', { color: activeSpace.sharedState.color }, undefined, activeSpace.id);
    }
  };
  
  // Update all areas in a space
  const handleUpdateSpaceColor = (color) => {
    if (activeSpace) {
      updateSharedState(activeSpace.id, { color });
    }
  };
  
  return (
    <div>
      {/* Component UI */}
    </div>
  );
}
```

## Installation

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Core package
yarn add @gamesberry/karmyc-core

# Optional plugins
yarn add @gamesberry/karmyc-area-projects
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

## Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Watch specific packages
yarn watch:core
yarn watch:shared
yarn watch:area-projects

# Develop all packages simultaneously
yarn dev:all

# Run examples application
yarn dev:examples

# Build examples
yarn build:examples
```

## Documentation

The documentation is organized into several sections:

### API Reference

- [Components](./docs/api/components.md) - Core components documentation
- [Hooks](./docs/api/hooks.md) - React hooks documentation
- [Integration](./docs/api/integration.md) - Guide for React integration

### Architecture

- [Redux Store](./docs/architecture/store.md) - Store structure
- [Action System](./docs/architecture/actions.md) - Action architecture
- [State Transitions](./docs/architecture/state-transitions.md) - State transition system
- [Project Structure](./docs/architecture/project-structure.md) - Organization of files and directories
- [Monorepo Structure](./docs/architecture/monorepo.md) - Monorepo organization

### Guides

- [Getting Started](./docs/guides/getting-started.md) - Initial setup
- [Custom Areas](./docs/guides/custom-areas.md) - Creating custom areas
- [Optimizations](./docs/guides/optimizations.md) - Performance optimization tips
- [Creating Plugins](./docs/guides/plugins.md) - Building your own plugins

## Examples

See the [examples](./packages/examples) directory for working demos:

- Basic layout
- Custom area types
- Context menus
- Drag and drop
- Using plugins

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for more details.

## Acknowledgements

Karmyc was inspired by and mainly derived from [animation-editor](https://github.com/alexharri/animation-editor) by [@alexharri](https://github.com/alexharri) - a web-based animation editor built with React, Redux, PIXI.js and HTML Canvas.

## License

MIT © [Yann Loosli](https://github.com/example)
