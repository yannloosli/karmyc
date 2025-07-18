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
[![React](https://img.shields.io/badge/React-19.0+-61DAFB.svg)](https://reactjs.org/)

## Table of Contents
- [Overview](#overview)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [API Reference](#api-reference)
- [Development](#development)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Overview

Karmyc Core is a React library that provides a flexible layout management system using Zustand for state management. It allows you to create dynamic, resizable workspace areas that can be arranged in rows and columns, with support for multiple screens, undo/redo functionality, and a plugin system.

### Demo
A comprehensive demo is available [here](https://yannloosli.github.io/karmyc) showcasing Karmyc Core's key features.

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
- `react >= 19.0`
- `react-dom >= 19.0`

### 2. Basic Setup
```tsx
// App.tsx
import { KarmycCoreProvider, useKarmyc, Karmyc, Tools } from '@gamesberry/karmyc-core';
import { AreaInitializer } from './AreaInitializer';

const App = () => {
  const karmycConfig = {
    plugins: [],
    validators: [],
    initialAreas: [
      { id: 'area-1', type: 'my-area', state: { initialData: 'default value' }, role: 'SELF' },
    ],
    keyboardShortcutsEnabled: true,
    resizableAreas: true,
    manageableAreas: true,
    multiScreen: true,
    allowStackMixedRoles: false,
    builtInLayouts: [],
    initialLayout: 'default',
  };
  const config = useKarmyc(karmycConfig);

  return (
    <KarmycCoreProvider options={config}>
      <AreaInitializer />
      <Tools areaType="apptitle">
        <Tools areaType="app">
          <Karmyc />
        </Tools>
      </Tools>
    </KarmycCoreProvider>
  );
};
```

### 3. Area Initialization
```tsx
// AreaInitializer.tsx
import { MyArea } from './areas/MyArea';

export const AreaInitializer = () => {
  return (
    <>
      <MyArea />
    </>
  );
};
```

### 4. Defining an Area Type
```tsx
// areas/MyArea.tsx
import { useRegisterAreaType, AREA_ROLE } from '@gamesberry/karmyc-core';
import { MyAreaComponent } from './MyAreaComponent';
import { Icon } from 'lucide-react';

export const MyArea = () => {
  useRegisterAreaType(
    'my-area',
    MyAreaComponent,
    { initialData: 'default value' },
    {
      displayName: 'My Area',
      role: AREA_ROLE.LEAD,
      icon: Icon
    }
  );
  return null;
};
```

### 5. Area Component
```tsx
// MyAreaComponent.tsx
import { AreaComponentProps } from '@gamesberry/karmyc-core';

interface MyAreaState {
  initialData: string;
}

export const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  id,
  state,
  type,
  viewport,
  raised
}) => {
  return (
    <div style={{ 
      width: viewport.width, 
      height: viewport.height, 
      left: viewport.left, 
      top: viewport.top 
    }}>
      <h2>My Area: {state.initialData}</h2>
    </div>
  );
};
```

## Core Concepts

### Screens, Spaces, Areas, and Layouts

- **Screen**: A top-level container (main window or detached window) that contains areas and layout
- **Area**: A rectangular region that renders a specific React component, organized within a screen
- **Layout**: Tree structure of nested rows and columns defining area arrangement within a screen
- **Space**: A logical workspace concept that can be associated with areas (especially LEAD areas) for shared state and history

### Area Roles

```typescript
const AREA_ROLE = {
  LEAD: 'LEAD',      // Primary workspace areas with shared state
  FOLLOW: 'FOLLOW',  // Secondary areas that follow LEAD areas
  SELF: 'SELF'       // Independent areas with local state only
} as const;
```

### Tools Slot System

The tools slot system allows injecting components into predefined UI positions. The `Tools` component (alias for `ToolsSlot`) can be configured with different props:

```tsx
<Tools areaType="apptitle">
  <Tools areaType="app">
    <Karmyc />
  </Tools>
</Tools>
```

#### Tools Component Props

```typescript
interface ToolsProps {
  areaId?: string;           // Specific area ID for targeted tools
  areaType?: string;         // Area type for type-specific tools (default: 'app')
  areaState?: any;           // Current area state
  children: React.ReactNode; // Content to render
  viewport?: Rect;           // Viewport dimensions
  nbOfLines?: number;        // Number of toolbar lines (default: 1)
}
```

## API Reference

### Core Hooks

#### `useKarmyc(options, onError?)`
Initializes the Karmyc system with configuration options.

```typescript
interface IKarmycOptions {
  plugins?: IActionPlugin[];
  validators?: Array<{
    actionType: string;
    validator: (action: any) => { valid: boolean; message?: string };
  }>;
  initialAreas?: IArea[];
  keyboardShortcutsEnabled?: boolean;
  resizableAreas?: boolean;
  manageableAreas?: boolean;
  multiScreen?: boolean;
  allowStackMixedRoles?: boolean;
  builtInLayouts?: LayoutPreset[];
  initialLayout?: string;
  t?: (key: string, fallback: string) => string;
  spaces?: Record<string, ISpace>;
}
```

#### `useArea()`
Provides functions to manipulate areas and access their state.

```typescript
const {
  createArea,
  removeArea,
  setActive,
  update,
  getActive,
  getById,
  getAll,
  getErrors
} = useArea();
```

#### `useSpace()`
Access state for spaces.

```typescript
const { spaces, activeSpaceId, getSpaceById } = useSpace();
```

#### `useRegisterAreaType(type, component, initialState, options)`
Register a new area type.

```typescript
useRegisterAreaType(
  'my-area',
  MyComponent,
  { data: 'default' },
  { displayName: 'My Area', role: AREA_ROLE.LEAD }
);
```

#### Additional Hooks

##### `useAreaOptimized()`
Optimized hook for area management with enhanced performance and extended functionality.

```typescript
const { createArea, removeArea, splitArea, setRowSizes } = useAreaOptimized();
```

##### Specialized Area Hooks
Granular hooks for optimal performance:

```typescript
const area = useAreaById(areaId);           // Get specific area
const activeArea = useActiveArea();         // Get active area
const allAreas = useAllAreas();             // Get all areas
const layout = useAreaLayoutById(areaId);   // Get area layout
const actions = useAreaActions();           // Get area actions
```

##### `useAreaDragAndDrop(areaId)`
Provides drag and drop functionality for areas.

```typescript
const { isDragging, dragRef, dropRef } = useAreaDragAndDrop(areaId);
```

##### `useAreaKeyboardShortcuts(areaId)`
Provides keyboard shortcuts for areas.

```typescript
useAreaKeyboardShortcuts(areaId);
```

##### `useContextMenu()`
Provides context menu functionality.

```typescript
const { openContextMenu, closeContextMenu } = useContextMenu();
```

##### `useResizePreview()`
Provides resize preview functionality.

```typescript
const { showPreview, hidePreview, previewState } = useResizePreview();
```

##### `useScreenManagement()`
Provides screen management functionality.

```typescript
const { createScreen, removeScreen, switchScreen } = useScreenManagement();
```

##### `useAreaStack(areaId)`
Provides area stacking functionality.

```typescript
const { isChildOfStack, stackArea, unstackArea } = useAreaStack(areaId);
```

##### `useSpaceHistory(spaceId)`
Provides space history functionality.

```typescript
const { history, currentIndex, undo, redo } = useSpaceHistory(spaceId);
```

##### `useEnhancedHistory(spaceId)`
Provides enhanced history functionality with advanced features like action batching, diff tracking, and typed actions.

```typescript
const {
  // State
  isActionInProgress,
  currentActionId,
  lastAction,
  stats,
  
  // Actions
  startAction,
  submitAction,
  cancelAction,
  undo,
  redo,
  
  // Utilities
  createSimpleAction,
  createSelectionAction,
  createTransformAction,
  
  // Checks
  canUndo,
  canRedo,
  
  // Getters
  getCurrentAction,
  getHistoryLength,
  getHistoryStats,
  
  // Management
  clearHistory,
  updateSelectionState
} = useEnhancedHistory(spaceId);
```

##### `useActiveSpaceHistory()`
Provides enhanced history functionality for the currently active space.

```typescript
const historyActions = useActiveSpaceHistory();
```

##### `useTypedHistoryActions(spaceId)`
Provides typed history actions for common operations.

```typescript
const {
  create, update, delete, move, copy, paste,
  select, deselect, selectAll, deselectAll,
  group, ungroup, transform, rotate, scale, translate,
  timelineUpdate, keyframeAdd, keyframeRemove, keyframeUpdate,
  custom
} = useTypedHistoryActions(spaceId);
```

##### `usePluginSystem()`
Provides plugin system functionality.

```typescript
const { registerPlugin, unregisterPlugin, getPlugins } = usePluginSystem();
```

### Core Components

#### `KarmycCoreProvider`
Main provider that sets up the Karmyc environment.

```tsx
<KarmycCoreProvider options={config}>
  {children}
</KarmycCoreProvider>
```

#### `Karmyc`
Primary component that renders layouts and areas.

```tsx
<Karmyc />
```

#### `Tools`
System for injecting components into predefined UI slots.

```tsx
<Tools areaType="app">
  <Karmyc />
</Tools>
```

#### Additional Components

##### `AreaErrorBoundary`
Error boundary component for areas.

```tsx
<AreaErrorBoundary component={MyAreaComponent} areaId="area-1" areaState={{}} type="my-area" viewport={{}} />
```

##### `AreaPreview`
Preview component for areas.

```tsx
<AreaPreview areaId="area-1" />
```

##### `AreaTabs`
Tab component for stacked areas.

```tsx
<AreaTabs areaId="area-1" />
```

##### `ScreenSwitcher`
Component for switching between screens.

```tsx
<ScreenSwitcher />
```

##### `KeyboardShortcutsViewer`
Component for displaying keyboard shortcuts.

```tsx
<KeyboardShortcutsViewer />
```

##### `ContextMenu`
Context menu component.

```tsx
<ContextMenu />
```

### Configuration

#### Built-in Layouts
You can define built-in layouts that users can switch between:

```typescript
const builtInLayouts = [
  {
    id: 'default',
    name: 'Default Layout',
    config: { /* layout configuration */ },
    isBuiltIn: true
  }
];
```

### Types and Interfaces

#### Core Types

```typescript
// Area types
interface IArea<T = any> {
  id: string;
  type: AreaTypeValue;
  state?: Record<string, any>;
  spaceId?: string | null;
  viewport?: Rect;
  position?: Point;
  size?: { width: number; height: number };
  raised?: boolean;
  role?: AreaRole;
  isLocked?: boolean;
  enableFullscreen?: boolean;
  previousLayout?: { [key: string]: AreaLayout | AreaRowLayout };
  previousRootId?: string | null;
}

// Layout types
interface LayoutNode {
  id: string;
  type: 'area' | 'area_row';
  orientation?: 'horizontal' | 'vertical' | 'stack';
  areas?: Array<{ id: string; size: number }>;
}

// Additional types
interface Rect {
  top: number;
  left: number;
  width: number | string;
  height: number | string;
}

interface Point {
  x: number;
  y: number;
}

interface AreaLayout {
  // Layout configuration for areas
}

interface AreaRowLayout {
  // Layout configuration for area rows
}

// Space types
interface ISpace {
  id: string;
  name: string;
  sharedState: any;
  history: EnhancedHistoryAction[];
}

// Plugin types
interface IActionPlugin {
  id: string;
  name: string;
  onStoreChange?: (state: any, prevState: any) => void;
  onStoreInit?: (store: StoreApi<any>) => void;
  transformState?: (state: any) => Partial<any>;
  actions?: Record<string, (...args: any[]) => void>;
}
```

#### Enums and Constants

```typescript
const AREA_ROLE = {
  LEAD: 'LEAD',
  FOLLOW: 'FOLLOW',
  SELF: 'SELF'
} as const;

const TOOLBAR_HEIGHT = 30;
```

## Development

### Available Scripts
- `yarn dev`: Start development mode with watch
- `yarn build`: Build the library
- `yarn bundle`: Build the library (alias for build)
- `yarn test`: Run tests
- `yarn test:watch`: Run tests in watch mode
- `yarn test:coverage`: Run tests with coverage
- `yarn demo:dev`: Start the demo application in development mode
- `yarn demo:build`: Build the demo application
- `yarn demo:ssr:dev`: Start the SSR demo application in development mode
- `yarn demo:ssr:build`: Build the SSR demo application
- `yarn demo:ssr:start`: Start the SSR demo application

### Project Structure
```
karmyc-core/
├── src/                    # Source code
│   ├── components/       # React components
│   │   ├── menus/       # Context menus
│   │   └── handlers/    # Event handlers
│   ├── core/             # Core logic and state management
│   │   ├── plugins/     # Plugin system
│   │   ├── registries/  # Component registries
│   │   ├── slices/      # Zustand store slices
│   │   └── types/       # Core type definitions
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript type definitions
│   ├── utils/            # Utility functions
│   └── index.ts          # Main entry point
├── demo/                   # Demo application
│   ├── config/           # Demo configuration
│   └── shared/           # Shared demo components
└── docs/                   # Documentation
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
