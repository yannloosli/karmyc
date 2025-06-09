# Karmyc Core

<p align="center">
  <img style="width:50%;" src="./demo/assets/brand/karmyc_logo.svg" alt="🔗Karmyc" />
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
- [Advanced Features](#advanced-features)
- [Development](#development)
- [Acknowledgements](#acknowledgements)
- [License](#license)

## Overview

Karmyc Core is a React library that empowers you to build complex and interactive layouts with ease. It provides a robust set of tools for creating, managing, and customizing workspace areas in your application. Whether you're building a feature-rich IDE, a creative tool, or a dashboard, Karmyc Core offers the flexibility to design dynamic user interfaces.

### Demo
A comprehensive demo is available [here](https://yannloosli.github.io/karmyc) showcasing Karmyc Core's key features:

#### Interactive Features
- **Layout Management**: Try dragging areas to rearrange them, and resize them by dragging their borders
- **Multi-Space Support**: Create and switch between different spaces, each with its own state
- **Color Picker**: A practical example of a `LEAD`/`FOLLOW` relationship
- **Drawing Area**: Demonstrates custom area implementation with interactive features
- **History**: Test the undo/redo functionality with the history area
- **Keyboard Shortcuts**: View and test the available keyboard shortcuts
- **Debug Area**: Monitor the internal state of the application

#### Technical Examples
The demo's source code (in the `demo` folder) serves as a practical reference for:
- Implementing custom area types
- Setting up spaces and shared state
- Configuring keyboard shortcuts
- Adding toolbars and context menus
- Managing layouts and area relationships

## Features
- **Modular Layouts**: Create and arrange areas in flexible row/column configurations
- **Customizable Areas**: Build any type of area with your own React components and logic
- **Drag & Drop**: Intuitive drag-and-drop interface for rearranging and resizing areas
- **State Management**: Integrated state management for layouts and areas
- **Multi-Space Context**: Group areas into "Spaces" to share context or operate independently
- **Undo/Redo**: Built-in history management for layout changes
- **Extensible Plugin System**: Enhance functionality with custom plugins
- **Dynamic Toolbars**: Add toolbars and buttons associated with specific area types
- **Keyboard Shortcuts**: Define global or area-specific keyboard shortcuts
- **Multi-Screen Support**: Open areas in new browser windows

## Quick Start

### 1. Installation
```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-core

# Using npm
npm install @gamesberry/karmyc-core
```

### 2. Basic Setup
```tsx
import { KarmycProvider, useKarmyc, Karmyc } from '@gamesberry/karmyc-core';

const App = () => {
  const config = useKarmyc({
    initialAreas: [
      { type: 'my-area', state: {}, role: 'LEAD' }
    ]
  });

  return (
    <KarmycProvider options={config}>
      <Karmyc />
    </KarmycProvider>
  );
};
```

### 3. Define Area Types
```tsx
import { useRegisterAreaType } from '@gamesberry/karmyc-core';

export const MyArea = () => {
  useRegisterAreaType(
    'my-area',
    MyComponent,
    { initialValue: 42 },
    {
      displayName: 'My Area',
      role: 'LEAD'
    }
  );
  return null;
};
```

### 4. Add Toolbars (Optional)
```tsx
import { Tools, useToolsSlot } from '@gamesberry/karmyc-core';

const App = () => (
  <KarmycProvider options={config}>
    <Tools name="app" orientation="horizontal">
      <MyToolbar />
    </Tools>
    <Karmyc />
  </KarmycProvider>
);
```

## Core Concepts

### Screens, Areas, and Layouts
- **Screen**: A top-level container, usually the main window or a detached window
- **Area**: A rectangular region in your layout that renders a specific component
- **Layout**: The arrangement of areas on the screen, defined by a tree of nested rows and columns

### Internal Components
- **KarmycInitializer**: Internal component that handles system initialization, plugin registration, and initial area creation
- **KarmycProvider**: Main provider component that sets up the global context and handles URL synchronization
- **ContextMenuProvider**: Manages context menus throughout the application

### Core Types
```typescript
interface IKarmycConfig {
    areas: {
        types: string[];
        layout: any;
    };
    actions: {
        plugins: any[];
        validators: any[];
    };
    contextMenu: {
        actions: any[];
    };
}

interface IKarmycOptions {
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
    initialAreas?: Array<{
        type: string;
        state?: any;
        position?: { x: number; y: number };
        role?: AreaRole;
    }>;
    keyboardShortcutsEnabled?: boolean;
    resizableAreas?: boolean;
    manageableAreas?: boolean;
    multiScreen?: boolean;
    allowStackMixedRoles?: boolean;
    builtInLayouts?: LayoutPreset[];
    initialLayout?: string;
}
```

### Keyboard Shortcuts System
The system handles three types of keyboard shortcuts:

1. **Global Shortcuts**
   - Available throughout the application
   - Not tied to specific areas
   - Can be configured with modifier keys

2. **Area-Specific Shortcuts**
   - Only active when an area is focused
   - Can be customized per area type
   - Support for required and optional modifier keys

3. **System Shortcuts**
   - Built-in shortcuts for core functionality
   - Cannot be overridden by custom shortcuts

#### Modifier Key Support
- Required modifiers: Must be pressed for the shortcut to trigger
- Optional modifiers: Can be pressed but are not required
- Supported modifiers: Control, Alt, Shift, Command (Meta)

Example of registering a keyboard shortcut:
```typescript
keyboardShortcutRegistry.registerShortcut({
    name: 'Save',
    key: 's',
    modifierKeys: ['Control'],
    optionalModifierKeys: ['Shift'],
    isGlobal: true,
    fn: (areaId, context) => {
        // Handle save action
    }
});
```

### Plugin System and Action Handling
The system provides a flexible plugin architecture for extending functionality:

#### Action Plugins
Plugins can register custom actions and validators:

```typescript
interface IActionPlugin {
    id: string;
    priority: number;
    actionTypes: string[];
    handler: (action: any) => void;
}

// Example plugin registration
const myPlugin: IActionPlugin = {
    id: 'my-plugin',
    priority: 100,
    actionTypes: ['CUSTOM_ACTION'],
    handler: (action) => {
        console.log('Handling custom action:', action);
    }
};
```

#### Action Validators
Validators ensure actions are executed only when they meet specific criteria:

```typescript
// Register a validator for a specific action type
actionRegistry.registerValidator('CUSTOM_ACTION', (action) => {
    return {
        valid: action.payload !== undefined,
        message: 'Action payload is required'
    };
});
```

#### Built-in Plugins
The system includes several built-in plugins:
- **History Plugin**: Manages undo/redo functionality
- **Layout Plugin**: Handles area arrangement and resizing
- **Space Plugin**: Manages space creation and state sharing

### State Management
The system uses a combination of Zustand and Immer for state management:

#### Store Structure
```typescript
interface IKarmycStore {
    screens: {
        [screenId: string]: {
            areas: {
                rootId: string;
                areas: { [areaId: string]: Area };
                viewports: { [areaId: string]: Viewport };
                activeAreaId: string | null;
            };
        };
    };
    activeScreenId: string;
    options: {
        resizableAreas: boolean;
        manageableAreas: boolean;
        multiScreen: boolean;
        builtInLayouts: LayoutPreset[];
    };
}
```

#### State Updates
- State updates are handled through actions
- Each action is validated before execution
- Changes are tracked for undo/redo functionality
- State is automatically persisted for spaces

#### Multi-Screen State
- Each screen maintains its own state
- Screens can be synchronized through URL parameters
- State is shared between screens when needed

### Spaces
Spaces allow you to group areas together that should share a common context. They provide a way to organize UI components and determine how they interact with each other.

#### Space Management
```tsx
import { useSpace } from '@gamesberry/karmyc-core';

function SpaceManager() {
  const { createSpace, updateSharedState } = useSpace();
  
  const handleCreateSpace = () => {
    createSpace('My Space', { color: '#ff0000' });
  };
}
```

#### Space Persistence
Spaces are automatically persisted in the browser's local storage using Zustand persist. Synchronization between tabs is handled automatically.

#### Pilot Mode
Each space can operate in two modes:
- **AUTO** (default): Changes in a `LEAD` area are instantly propagated to `FOLLOW` areas
- **MANUAL**: Changes require an explicit action to be propagated

### Area Roles
- **LEAD**: Primary source of context for its neighbors
- **FOLLOW**: Subscriber that listens for state changes from its `LEAD` area
- **SELF**: Independent area that manages its own state



## API Reference

### Main Components
- `<KarmycProvider options={config}>`: Main provider component
- `<Karmyc />`: Main layout component
- `<Tools name="slot-name" orientation="horizontal|vertical">`: Toolbar component

### Key Hooks
- `useKarmyc(config)`: Initialize Karmyc configuration
- `useSpace()`: Manage spaces
- `useArea()`: Manage areas
- `useRegisterAreaType(type, component, initialState, options)`: Register area types
- `useToolsSlot(slotName)`: Manage toolbar slots
- `useContextMenu()`: Manage context menus
- `useTranslation()`: Access the translation system and translate text

### Types and Interfaces
```typescript
interface Space {
  id: string;
  name: string;
  description?: string;
  sharedState: SpaceSharedState;
}

interface SpaceSharedState {
  color: string;
  pastDiffs: THistoryDiff[];
  futureDiffs: THistoryDiff[];
  [key: string]: any;
}

interface IKarmycOptions {
  plugins?: IActionPlugin[];
  validators?: Array<{
    actionType: string;
    validator: (action: any) => { valid: boolean; message?: string };
  }>;
  initialAreas?: Array<{
    type: string;
    state?: any;
    position?: { x: number; y: number };
    role?: AreaRole;
  }>;
  // ... other options
}
```

### Configuration Options
The `useKarmyc` hook accepts a configuration object with the following options:

| Option | Description | Type | Default |
|--------|-------------|------|---------|
| `initialAreas` | Array of areas to create on startup | `Array<{type: string, state?: any, position?: {x: number, y: number}, role?: AreaRole}>` | `[]` |
| `builtInLayouts` | Set of predefined layouts the user can switch between | `Array<LayoutPreset>` | `[]` |
| `initialLayout` | ID of the layout to load first | `string` | `'default'` |
| `plugins` | Array of plugins to extend functionality | `Array<IActionPlugin>` | `[]` |
| `validators` | Array of custom validators for actions | `Array<{actionType: string, validator: (action: any) => {valid: boolean, message?: string}}>` | `[]` |
| `keyboardShortcutsEnabled` | Enable or disable all keyboard shortcuts | `boolean` | `true` |
| `resizableAreas` | Allow users to resize areas | `boolean` | `true` |
| `manageableAreas` | Allow users to drag-and-drop and re-organize areas | `boolean` | `true` |
| `multiScreen` | Allow areas to be opened in new windows | `boolean` | `true` |
| `allowStackMixedRoles` | Allow areas with different roles to be stacked together | `boolean` | `false` |

#### Example Configuration
```tsx
const config = useKarmyc({
  // Initial areas to create
  initialAreas: [
    { 
      type: 'editor',
      state: { content: '' },
      role: 'LEAD'
    },
    {
      type: 'preview',
      state: { mode: 'live' },
      role: 'FOLLOW'
    }
  ],

  // Built-in layouts
  builtInLayouts: [
    {
      id: 'default',
      name: 'Default Layout',
      config: {
        root: {
          type: 'area_row',
          orientation: 'horizontal',
          areas: [
            { id: 'editor', size: 0.6 },
            { id: 'preview', size: 0.4 }
          ]
        }
      }
    }
  ],

  // Initial layout to use
  initialLayout: 'default',

  // Custom plugins
  plugins: [
    {
      id: 'my-plugin',
      priority: 100,
      actionTypes: ['CUSTOM_ACTION'],
      handler: (action) => {
        console.log('Handling custom action:', action);
      }
    }
  ],

  // Feature flags
  keyboardShortcutsEnabled: true,
  resizableAreas: true,
  manageableAreas: true,
  multiScreen: true,
  allowStackMixedRoles: false
});
```

## Advanced Features

### Space Export/Import
```tsx
function SpaceExporter() {
  const { spaceList, activeSpaceId, createSpace, setActive } = useSpace();

  const handleExportSpace = () => {
    const space = spaceList.find(s => s.id === activeSpaceId);
    if (!space) return;

    const dataStr = JSON.stringify(space, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `${space.name}.json`);
    linkElement.click();
  };
}
```

### Multi-Screen Management
```tsx
function MultiScreenManager() {
  const { activeScreenId } = useKarmycStore();

  const handleOpenInNewWindow = (areaId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('screen', activeScreenId);
    url.searchParams.set('area', areaId);
    window.open(url.toString(), '_blank');
  };
}
```

### Internationalization (i18n) System
Karmyc Core includes a built-in internationalization system that allows you to customize all text displayed in the interface. The system is designed to be flexible and easy to use.

#### Basic Usage
```typescript
const config = useKarmyc({
  // ... other config options ...
  t: (key: string, fallback: string) => {
    // Implement your translation logic here
    return translations[key] || fallback;
  }
});
```

#### Translation Keys Structure
The translation keys follow a hierarchical structure:
- `area.*` - Area-related texts
  - `area.role.*` - Area role labels (LEAD, FOLLOW, SELF)
  - `area.type.*` - Area type names
  - `area.tab.*` - Area tab labels
  - `area.preview.*` - Area preview texts
  - `area.separator.*` - Area separator texts
  - `area.spaces.*` - Space-related texts
  - `area.join.*` - Area joining texts
  - `area.switch.*` - Area switching texts
- `dropzone.*` - Drop zone messages
- `menu.*` - Menu-related texts
- `shortcuts.*` - Keyboard shortcut descriptions
- `tools.*` - Tool-related texts

#### Example Translations
```typescript
const translations = {
  // Area roles
  'area.role.lead': 'LEAD',
  'area.role.follow': 'FOLLOW',
  'area.role.self': 'SELF',

  // Area types
  'area.type.app': 'Application',
  'area.type.console': 'Console',
  'area.type.preview': 'Preview',

  // Area tabs
  'area.tab.close': 'Close',
  'area.tab.app': 'Application',
  'area.tab.console': 'Console',

  // Area previews
  'area.preview.app': 'Preview of Application',
  'area.preview.console': 'Preview of Console',

  // Area separators
  'area.separator.resize': 'Resize',

  // Spaces
  'area.spaces.title': 'SPACES',
  'space.default.name': 'Default Space',

  // Drop zones
  'dropzone.message': 'Drop here',

  // Area joining
  'area.join.preview': 'Join areas',

  // Area switching
  'area.switch.log': 'Switching area {areaId} to type {newType}'
};
```

#### Using Translations in Components
```typescript
import { useTranslation } from '@gamesberry/karmyc-core';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('area.type.app', 'Application')}</h1>
      <button title={t('area.tab.close', 'Close')}>×</button>
    </div>
  );
};
```

#### Best Practices
1. Always provide a fallback text in English
2. Use consistent key naming across your application
3. Group related translations under the same namespace
4. Keep translations organized in a separate file
5. Use TypeScript to ensure type safety for your translation keys

## Development

### Getting Started
```bash
# Clone the repository
git clone https://github.com/gamesberry/karmyc-core.git
cd karmyc-core

# Install dependencies
yarn install

# Start development mode
yarn dev
```

### Available Scripts
- `yarn dev`: Start development mode with watch
- `yarn build`: Build the library
- `yarn bundle`: Create production bundle using Rollup
- `yarn demo:dev`: Start the demo application in development mode
- `yarn demo:build`: Build the demo application
- `yarn demo:preview`: Preview the built demo
- `yarn test`: Run tests
- `yarn test:watch`: Run tests in watch mode
- `yarn lint`: Run ESLint
- `yarn tscheck`: Run TypeScript type checking

### Project Structure
```
karmyc-core/
├── src/                    # Source code
│   ├── actions/           # Action creators and handlers
│   ├── components/        # React components
│   ├── hooks/            # Custom React hooks
│   ├── providers/        # React context providers
│   ├── store/            # State management
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── demo/                  # Demo application
│   ├── config/           # Demo configuration
│   ├── assets/           # Static assets
│   └── components/       # Demo-specific components
└── dist/                 # Built files (generated)
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
