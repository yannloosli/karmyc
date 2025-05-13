# Karmyc Documentation

Welcome to the Karmyc documentation. This guide will help you understand and use Karmyc to build flexible, modular layouts for your React applications.

> **Note:** Documentation updated for monorepo structure (April 2025).

## Monorepo Structure

Karmyc is organized as a monorepo with the following packages:

- **[@gamesberry/karmyc-core](../packages/karmyc-core)** - Core layout system with the main functionality
- **[@gamesberry/karmyc-shared](../packages/karmyc-shared)** - Shared utilities used across packages
- **[@gamesberry/karmyc-area-projects](../packages/area-projects)** - Project management plugin

## Best Practices

- **Imports**: Always import components, hooks and utilities from the main entry point (`import { useKarmyc } from '@gamesberry/karmyc-core'`) rather than from internal implementation files.
- **Component Structure**: Follow the component patterns shown in examples, registering area types before using them.
- **State Management**: Use the provided hooks rather than direct store access for best results.
- **Plugins**: Import plugins directly from their respective packages (`import { ... } from '@gamesberry/karmyc-area-projects'`)

## Table of Contents

### Guides

- [Getting Started](./guides/getting-started.md) - Initial setup of the system
- [Creating Custom Areas](./guides/custom-areas.md) - Building advanced custom areas
- [Optimizations](./guides/optimizations.md) - Performance improvement tips
- [Context Menus](./guides/context-menus.md) - Working with context menus
- [Drag and Drop](./guides/drag-and-drop.md) - Implementing drag and drop
- [Keyboard Shortcuts](./guides/keyboard-shortcuts.md) - Adding keyboard shortcuts
- [Plugins](./guides/plugins.md) - Using and creating plugins
- [Performance Monitoring](./guides/performance.md) - Tracking and optimizing performance

### API

- [Components](./api/components.md) - Core components documentation
- [Hooks](./api/hooks.md) - React hooks documentation
- [Integration](./api/integration.md) - Guide for React integration
- [Plugins API](./api/plugins.md) - Plugin system documentation

### Architecture

- [Zustand Store](./architecture/store.md) - Zustand stores structure
- [Action System](./architecture/actions.md) - Action system architecture
- [State Transitions](./architecture/state-transitions.md) - State transition management
- [Project Structure](./architecture/project-structure.md) - Organization of files and directories
- [Monorepo Structure](./architecture/monorepo.md) - Monorepo organization and development workflow

## Overview

Karmyc is a modular layout system that allows you to create interfaces divided into resizable and customizable areas. It was designed to be:

- **Flexible**: Create any type of area with your own rendering logic
- **Performant**: Optimized rendering and efficient state management
- **Maintainable**: Modular and extensible architecture
- **Robust**: Built-in history system (undo/redo)
- **Extensible**: Plugin system for adding new functionality

## Main Features

- **Resizable Areas**: Create areas that users can resize
- **Context Menus**: Configure context menus for areas
- **Keyboard Shortcuts**: Define keyboard shortcuts specific to each area type
- **State Management**: Store each area's state and synchronize it
- **History**: Undo and redo changes
- **Events**: Communication between areas via an event system
- **Plugins**: Extend functionality with the plugin system
- **Performance Monitoring**: Track and optimize application performance

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
```

## Next Steps

1. Check the [Getting Started](./guides/getting-started.md) guide to set up the system
2. Explore the [API Hooks](./api/hooks.md) to understand available functionality
3. Learn how to [Create Custom Areas](./guides/custom-areas.md)
4. See how to use and create [Plugins](./guides/plugins.md)
