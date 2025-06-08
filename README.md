<p align="center">
  <img style="width:50%;" src="./demo/assets/brand/karmyc_logo.svg" alt="🔗Karmyc" />
</p>
<p align="center"><strong>CORE</strong></p>
<p align="center"><em>A flexible and powerful layout management system for React applications</em></p>

---
[![npm version](https://img.shields.io/npm/v/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/your-username/karmyc/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@gamesberry/karmyc-core.svg)](https://www.npmjs.com/package/@gamesberry/karmyc-core)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.0+-61DAFB.svg)](https://reactjs.org/)

# What is Karmyc core?

Karmyc Core is a React library that empowers you to build complex and interactive layouts with ease. It provides a robust set of tools for creating, managing, and customizing workspace areas in your application. Whether you're building a feature-rich IDE, a creative tool, or a dashboard, Karmyc Core offers the flexibility to design dynamic user interfaces.

# Demo
A comprehensive demo is available [here](https://yannloosli.github.io/karmyc) showcasing Karmyc Core's key features:

## Interactive Features
- **Layout Management**: Try dragging areas to rearrange them, and resize them by dragging their borders
- **Multi-Space Support**: Create and switch between different spaces, each with its own state
- **Color Picker**: A practical example of a `LEAD`/`FOLLOW` relationship - changes in one color picker automatically update others in the same space
- **Drawing Area**: Demonstrates custom area implementation with interactive features
- **History**: Test the undo/redo functionality with the history area
- **Keyboard Shortcuts**: View and test the available keyboard shortcuts
- **Debug Area**: Monitor the internal state of the application

## Technical Examples
The demo's source code (in the `demo` folder) serves as a practical reference for:
- Implementing custom area types
- Setting up spaces and shared state
- Configuring keyboard shortcuts
- Adding toolbars and context menus
- Managing layouts and area relationships

Feel free to explore the demo to see Karmyc Core in action!

# Features
- **Modular Layouts**: Create and arrange areas in flexible row/column configurations.
- **Customizable Areas**: Build any type of area with your own React components and logic.
- **Drag & Drop**: Intuitive drag-and-drop interface for rearranging and resizing areas.
- **State Management**: Integrated state management for layouts and areas.
- **Multi-Space Context**: Group areas into "Spaces" to share context or operate independently.
- **Undo/Redo**: Built-in history management for layout changes.
- **Extensible Plugin System**: Enhance functionality with custom plugins.
- **Dynamic Toolbars**: Add toolbars and buttons associated with specific area types.
- **Keyboard Shortcuts**: Define global or area-specific keyboard shortcuts.
- **Multi-Screen Support**: Open areas in new browser windows.

# Quick start
## 1. Install
```bash
# Using yarn (recommended)
yarn add @gamesberry/karmyc-core

# Using npm
npm install @gamesberry/karmyc-core
```
## 2. Define your Area Types
Create components that define the behavior and appearance of your areas. Use the `useRegisterAreaType` hook to register each new area.

`src/areas/MyAwesomeArea.tsx`
```tsx
import { useRegisterAreaType } from '@gamesberry/karmyc-core';
import { MyAwesomeComponent } from '../components/MyAwesomeComponent';

export const MyAwesomeArea = () => {
  useRegisterAreaType(
    'my-awesome-area',      // Unique type name
    MyAwesomeComponent,     // The component to render
    { initialValue: 42 },   // Initial state for this area type
    {
      displayName: 'Awesome Area',
      role: 'LEAD', // Can be 'LEAD' or 'SELF'
    }
  );
  return null; // This component only registers the type
};
```

Create an initializer component to import and render all your area definitions.
`src/areas/AreaInitializer.tsx`
```tsx
import { MyAwesomeArea } from './MyAwesomeArea';
import { AnotherArea } from './AnotherArea';

export const AreaInitializer = () => {
  return (
    <>
      <MyAwesomeArea />
      <AnotherArea />
    </>
  );
};
```

## 3. Configure Karmyc
In your main application component, create a configuration object and pass it to the `useKarmyc` hook.

`App.tsx`
```tsx
import { KarmycProvider, useKarmyc, Karmyc } from '@gamesberry/karmyc-core';
import { AreaInitializer } from './areas/AreaInitializer';

const App = () => {
  const karmycConfig = {
    initialAreas: [
      { id: 'area-1', type: 'my-awesome-area', state: {}, role: 'LEAD' },
    ],
    builtInLayouts: [
      {
        id: 'default',
        name: 'Default Layout',
        config: { /* ... layout configuration ... */ }
      }
    ],
    initialLayout: 'default',
  };

  const config = useKarmyc(karmycConfig);

  return (
    <KarmycProvider options={config}>
      <AreaInitializer />
      <Karmyc />
    </KarmycProvider>
  );
};

export default App;
```

## 4. Add Toolbars (Optional)
You can add toolbars and place UI elements in them using the `<Tools>` component and `useToolsSlot` hook. Toolbars can be placed in different positions and can be associated with specific area types.

Here's an example of how to add toolbars:

```tsx
import { Tools, useToolsSlot } from '@gamesberry/karmyc-core';

// In your main component:
const App = () => {
  return (
    <KarmycProvider options={config}>
      <AreaInitializer />
      {/* Add a toolbar at the top of the application */}
      <Tools name="app" orientation="horizontal">
        <MyToolbar />
      </Tools>
      <Karmyc />
    </KarmycProvider>
  );
};

// In your toolbar component:
const MyToolbar = () => {
  // Register components for different slots
  const { registerComponent: registerMenuComponent } = useToolsSlot('app', 'top-outer');
  const { registerComponent: registerStatusComponent } = useToolsSlot('app', 'bottom-outer');

  useMemo(() => {
    // Add a menu component to the top toolbar
    registerMenuComponent(
      () => <MyMenu />,
      { name: 'myMenu', type: 'menu' },
      { order: 100, width: 'auto', alignment: 'left' }
    );

    // Add a status component to the bottom toolbar
    registerStatusComponent(
      () => <MyStatus />,
      { name: 'myStatus', type: 'status' },
      { order: 100, alignment: 'right', width: 'auto' }
    );
  }, [registerMenuComponent, registerStatusComponent]);

  return null;
};
```

Toolbars can be positioned in different locations:
- `top-outer`: Above the main layout
- `bottom-outer`: Below the main layout
- `top-inner`: Inside an area, at the top
- `bottom-inner`: Inside an area, at the bottom

Each toolbar slot can contain multiple components, which can be:
- Aligned to the left, center, or right
- Given a specific width or set to 'auto'
- Ordered using a numeric value (lower numbers appear first)

# Core Concepts
## Screens, Areas, and Layouts
- **Screen**: A top-level container, usually the main window or a detached window.
- **Area**: A rectangular region in your layout that renders a specific component. Each area has a `type` that determines its behavior and appearance.
- **Layout**: The arrangement of areas on the screen. Layouts are defined by a tree of nested rows and columns.

## Spaces
In Karmyc, **Spaces** are a core concept that allows you to group areas together that should share a common context. Spaces provide a way to organize your UI components and determine how they interact with each other. For example, multiple color picker areas in the same space could all sync to the same selected color.

### Using the Space API
```tsx
import { useSpace, useArea } from '@gamesberry/karmyc-core';

function MyComponent() {
  const { createSpace, updateSharedState, spaces, activeSpace } = useSpace();
  const { createArea } = useArea();
  
  // Create a new space
  const handleCreateProject = () => {
    createSpace('My New Project', { color: '#ff0000' });
  };
  
  // Create an area in the active space
  const handleCreateArea = () => {
    if (activeSpace) {
      createArea('color-picker', { color: activeSpace.sharedState.color }, undefined, activeSpace.id);
    }
  };
}
```

## Area Roles (`LEAD`, `FOLLOW`, `SELF`)
Each area can be assigned a `role` that defines how it interacts with other areas within the same layout branch.

- **`LEAD`**: A `LEAD` area acts as the primary source of context for its neighbors. When a `FOLLOW` area needs data or context, it looks to the nearest `LEAD` area in its hierarchy.
- **`FOLLOW`**: A `FOLLOW` area is a subscriber. It listens for state changes from its corresponding `LEAD` area and updates its own content accordingly. This is ideal for creating synchronized views, such as an inspector that displays the properties of a selected item in a different area.
- **`SELF`**: A `SELF` area is completely independent. It does not provide context to other areas, nor does it subscribe to any `LEAD` area. It manages its own state in isolation.

This role-based system allows for the creation of powerful, interconnected component workflows within your layout.

### Pilot Mode (`AUTO` vs `MANUAL`)
Within each `Space`, you can define a `pilotMode` that controls how `LEAD` areas communicate with `FOLLOW` areas.

- **`AUTO` (default)**: In this mode, changes in a `LEAD` area are automatically and instantly propagated to all its `FOLLOW` areas. This is useful for real-time synchronization.
- **`MANUAL`**: In this mode, changes in a `LEAD` area are not sent automatically. The propagation must be triggered explicitly via an action. This gives you finer control over when updates happen, for example, waiting for a user to click a "Sync" button.

# API Reference
## Main Components
- `<KarmycProvider options={config}>`: The main provider that enables Karmyc functionality. It should wrap your entire application or the part of it that uses Karmyc.
- `<Karmyc />`: The component that renders the main layout of areas.
- `<Tools name="slot-name" orientation="horizontal|vertical">`: A component to define a toolbar slot.

## Key Hooks
- `useKarmyc(config)`: Initializes the Karmyc configuration.
- `useSpace()`: Provides functions to manage spaces (`createSpace`, `switchSpace`, `updateSharedState`).
- `useArea()`: Provides functions to manage areas (`createArea`, `updateArea`, `getAreasBySpaceId`).
- `useRegisterAreaType(type, component, initialState, options)`: Registers a new type of area.
- `useAreaKeyboardShortcuts(areaType, shortcuts)`: Defines keyboard shortcuts for a specific area type.
- `useToolsSlot(slotName)`: Provides a `registerComponent` function to add elements to a toolbar slot.
- `useContextMenu()`: Hook to manage and display context menus.

# Configuration
The `karmycConfig` object passed to `useKarmyc` allows you to customize many aspects of the library:
- `initialAreas`: An array of areas to create on startup.
- `builtInLayouts`: A set of predefined layouts the user can switch between.
- `initialLayout`: The ID of the layout to load first.
- `plugins`: An array of plugins to extend functionality.
- `keyboardShortcutsEnabled`: (boolean) Enable or disable all keyboard shortcuts.
- `resizableAreas`: (boolean) Allow users to resize areas.
- `manageableAreas`: (boolean) Allow users to drag-and-drop and re-organize areas.
- `multiScreen`: (boolean) Allow areas to be opened in new windows.

# Development

## Getting Started
```bash
# Clone the repository
git clone https://github.com/gamesberry/karmyc-core.git
cd karmyc-core

# Install dependencies
yarn install

# Start development mode
yarn dev
```

## Available Scripts
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

## Project Structure
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

## Development Guidelines
- Use TypeScript for type safety
- Follow the existing code style (ESLint + Prettier)
- Write tests for new features
- Update documentation when adding new features
- Keep the demo up to date with new features

## Building
The project uses Rollup for building the library. The build process:
1. Compiles TypeScript
2. Bundles the code
3. Generates type definitions
4. Copies necessary files to the `dist` directory

## Testing
Tests are written using Jest and React Testing Library. Run tests with:
```bash
yarn test
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgements
Karmyc core was extracted and derived from [animation-editor](https://github.com/alexharri/animation-editor) by [@alexharri](https://github.com/alexharri) - a web-based animation editor built with React, Redux, PIXI.js and HTML Canvas.

Karmyc Core is built upon several key libraries:
- **Zustand** & **Immer** for state management.
- **React DnD** for drag-and-drop functionality.
- **Lucide React** for icons.
- **@szhsin/react-menu** for context menus.

# License
- MIT © [Yann Loosli](https://github.com/yannloosli)
- KARMYC Logo © Yann Loosli
