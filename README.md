# Karmyc Core

<p align="center">
  <img style="width:50%;" src="https://raw.githubusercontent.com/yannloosli/karmyc/refs/heads/main/demo/assets/brand/karmyc_logo.svg" alt="🔗Karmyc" />
</p>
<p align="center"><strong>CORE</strong></p>
<p align="center"><em>A flexible and powerful layout management system for React applications</em></p>

---
[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Development](#development)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Overview

Karmyc Core is a React library that empowers you to build complex and interactive layouts with ease. It provides a robust set of tools for creating, managing, and customizing workspace areas in your application. Whether you're building a feature-rich IDE, a creative tool, or a dashboard, Karmyc Core offers the flexibility to design dynamic user interfaces.

### Demo
A comprehensive demo is available [here](https://yannloosli.github.io/karmyc) showcasing Karmyc Core's key features.

## Features
- **Modular Layouts**: Create and arrange areas in flexible row/column configurations.
- **Customizable Areas**: Build any type of area with your own React components and logic.
- **Drag & Drop**: Intuitive drag-and-drop interface for rearranging and resizing areas.
- **State Management**: Integrated state management for layouts and areas using Zustand.
- **Multi-Screen Support**: Open areas in new browser windows and manage multiple workspaces.
- **Undo/Redo**: Built-in history management for layout changes.
- **Extensible Plugin System**: Enhance functionality with custom action handlers and validators.
- **Dynamic Toolbars**: Add toolbars and buttons associated with specific area types.
- **Keyboard Shortcuts**: Define global or area-specific keyboard shortcuts.
- **Built-in Layouts**: Provide a selection of layouts that users can load.

## Quick Start

### 1. Installation
```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-core

# Using npm
npm install @gamesberry/karmyc-core
```

#### Dependencies
Karmyc Core requires the following peer dependencies:
- `react >= 18.2`
- `react-dom >= 18.2`

### 2. Basic Setup
Wrap your application with the `KarmycCoreProvider` and configure your Karmyc instance using the `useKarmyc` hook.

```tsx
// App.tsx
import { KarmycCoreProvider, useKarmyc, Karmyc, TOOLBAR_HEIGHT } from '@gamesberry/karmyc-core';
import { AreaInitializer } from './AreaInitializer';

const App = () => {
  const karmycConfig = {
    // ...see detailed configuration below
  };
  const config = useKarmyc(karmycConfig);

  return (
    <KarmycCoreProvider options={config}>
      <AreaInitializer />
      <Karmyc offset={TOOLBAR_HEIGHT} />
    </KarmycCoreProvider>
  );
};
```

### 3. Area Initialization (`AreaInitializer`)
Create an `AreaInitializer` component to centrally register your area types and other initial configurations. This component renders nothing.

```tsx
// AreaInitializer.tsx
import { MyArea } from './areas/MyArea';
import { AnotherArea } from './areas/AnotherArea';

export const AreaInitializer = () => {
  return (
    <>
      <MyArea />
      <AnotherArea />
    </>
  );
};
```

### 4. Defining an Area Type
Each area type is defined in its own component. This component uses `useRegisterAreaType` to register the area and its configuration.

```tsx
// areas/MyArea.tsx
import { useRegisterAreaType, AREA_ROLE } from '@gamesberry/karmyc-core';
import { MyAreaComponent } from './MyAreaComponent';
import { Icon } from 'lucide-react';

export const MyArea = () => {
  useRegisterAreaType(
    'my-area', // Unique identifier
    MyAreaComponent, // The React component to render
    { initialData: 'default value' }, // Initial state of the area
    { // Options
      displayName: 'My Area',
      role: AREA_ROLE.LEAD,
      icon: Icon
    }
  );
  return null; // This component does not render anything itself
};
```

### 5. `karmycConfig` Example
Here is an example of a configuration object that you can pass to the `useKarmyc` hook.

```ts
const karmycConfig = {
    plugins: [],
    initialAreas: [
        { id: 'area-1', type: 'my-area', state: {}, role: AREA_ROLE.SELF },
        { id: 'area-2', type: 'another-area', state: {}, role: AREA_ROLE.LEAD },
    ],
    keyboardShortcutsEnabled: true,
    builtInLayouts: [
        {
            id: 'default',
            name: 'Default Layout',
            config: { /* ... layout configuration ... */ }
        }
    ],
    initialLayout: 'default',
    resizableAreas: true,
    manageableAreas: true,
    multiScreen: true,
};
```

## Core Concepts

### Screens, Spaces, Areas, and Layouts
- **Screen**: A top-level container, usually the main window or a detached window. Each screen has its own independent layout and state.
- **Space**: A workspace within a screen. Each space has its own layout, action history, and areas. Users can switch between different spaces.
- **Area**: A rectangular region in your layout that renders a specific component.
- **Layout**: The arrangement of areas on the screen, defined by a tree of nested rows and columns.

### Core Components
- **`KarmycCoreProvider`**: The main provider that sets up the Karmyc environment. It initializes the state management store and makes it available to all child components.
- **`Karmyc`**: The primary component that renders the layouts and areas. It orchestrates the display of the entire Karmyc UI.

### `ToolsSlot`
The `ToolsSlot` system allows you to inject components (like menus, buttons, or status indicators) into predefined slots in the UI. This is useful for creating dynamic, application-level, or area-specific toolbars. Use the `useToolsSlot` hook to register components in these slots.

### State Management
Karmyc uses [Zustand](https://github.com/pmndrs/zustand) for state management. The store is divided into several "slices," each responsible for a specific part of the state. It is recommended to use the provided hooks to interact with the state rather than accessing the store directly.

### Plugin System
Karmyc provides a plugin system to extend its functionality. You can create plugins to intercept actions, validate them, or add new behaviors. A plugin is an object that implements the `IActionPlugin` interface.

```typescript
export interface IActionPlugin {
  id: string;
  actionTypes: string[]; // Action types the plugin should react to
  handler: (action: Action) => void;
  priority?: ActionPriority;
}
```

## API Reference

### Hooks
- `useKarmyc(options, onError)`: Initializes the Karmyc system with the given options.
- `useKarmycStore()`: Provides direct access to the Zustand store. Use with caution.
- `useArea(id)`: Hook to access the state and actions of a specific area.
- `useSpace(id)`: Hook to access the state of a specific space.
- `useSpaceHistory(spaceId)`: Hook to access the action history of a space for undo/redo functionality.
- `useRegisterAreaType(type, component, initialState, options)`: Registers a new type of area.
- `useRegisterActionHandler(actionType, handler)`: Registers a handler for a specific action.
- `useContextMenu()`: Hook to manage and interact with the context menu.
- `useAreaDragAndDrop()`: Provides hooks and handlers for area drag-and-drop functionality.
- `useAreaKeyboardShortcuts()`: Hook to manage keyboard shortcuts within an area.
- `useToolsSlot(areaType, slotName)`: Returns a `registerComponent` function to add components to a tool slot.
- `usePluginSystem()`: Hook to interact with the plugin system.
- `t(key, ...args)`: Function for internationalization (i18n), exported alongside the hooks.

## Development

### Available Scripts
- `yarn dev`: Start development mode with watch.
- `yarn build`: Build the library.
- `yarn bundle`: Create production bundle using Rollup.
- `yarn demo:dev`: Start the demo application in development mode.
- `yarn demo:build`: Build the demo application.
- `yarn test`: Run tests.
- `yarn test:watch`: Run tests in watch mode.

### Project Structure
```
karmyc-core/
├── src/                    # Source code
│   ├── components/       # React components, including menus and handlers
│   ├── core/             # Core logic, including state management, providers, and registries
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   ├── index.ts          # Main entry point
│   └── setupTests.ts     # Test configuration
├── demo/                   # Demo application
│   ├── config/           # Demo configuration (area initializers, etc.)
└── dist/                   # Built files (generated)
```

## Acknowledgements
Karmyc core was extracted and derived from [animation-editor](https://github.com/alexharri/animation-editor) by [@alexharri](https://github.com/alexharri) - a web-based animation editor built with React, Redux, PIXI.js and HTML Canvas.

Karmyc Core is built upon several key libraries:
- **Zustand** & **Immer** for state management
- **React DnD** for drag-and-drop functionality
- **Lucide React** for icons
- **@szhsin/react-menu** for context menus

## License
- MIT © [Yann Loosli](https://github.com/yannloosli)
- KARMYC Logo © Yann Loosli
