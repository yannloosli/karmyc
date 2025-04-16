<div align="center" style="display:flex;flex-direction:column;">
    <img src="./assets/brand/karmyc_logo.svg" alt="Karmyc CORE" />
  <h3>KARMYC Core - Blender-like React layout</h3>
</div>

# Karmyc

[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

A flexible, modular layout system for building customizable React interfaces inspired by Blender's UI architecture.

<div align="center" style="display:flex;flex-direction:column;">
    <img src="./assets/karmyc-core.gif" alt="Karmyc CORE preview" />
</div>

## Features

- **Modular Layouts**: Create and arrange areas in flexible configurations
- **Customizable Areas**: Build any type of area with your own rendering logic
- **Drag & Drop**: Intuitive drag and drop interface for rearranging areas
- **Resizable Panels**: Adjust panel sizes with fluid resizing
- **State Management**: Integrated Redux store for state management
- **Undo/Redo**: Built-in history management
- **Context Menus**: Configurable context menus for enhanced interactions

## Roadmap / Wishlist

- Area as a dialog
- presets
- Customizable themes (light/dark mode and configurable color palettes)
- Fullscreen mode for specific areas
- Export/import of layout configurations
- Responsive/mobile support
- Improved accessibility (ARIA, keyboard navigation)
- Global Command Palette / search functionality

## Installation

```bash
# Using yarn
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

### Guides

- [Getting Started](./docs/guides/getting-started.md) - Initial setup
- [Custom Areas](./docs/guides/custom-areas.md) - Creating custom areas
- [Optimizations](./docs/guides/optimizations.md) - Performance optimization tips

## Examples

See the [examples](./examples) directory for working demos:

- Basic layout
- Custom area types
- Context menus
- Drag and drop
- State management

## Contributing

Contributions are welcome! Please see our [Contributing Guide](./CONTRIBUTING.md) for more details.

## Acknowledgements

Karmyc was inspired by and mainly derived from [animation-editor](https://github.com/alexharri/animation-editor) by [@alexharri](https://github.com/alexharri) - a web-based animation editor built with React, Redux, PIXI.js and HTML Canvas.

## License

MIT © [Yann Loosli](https://github.com/example)
