# Karmyc Documentation

Welcome to the Karmyc documentation. This guide will help you understand and use Karmyc to build flexible, modular layouts for your React applications.

> **Note:** Documentation updated and verified for code consistency on July 2023.

## Best Practices

- **Imports**: Always import components, hooks and utilities from the main entry point (`import { useKarmyc } from '@gamesberry/karmyc-core'`) rather than from internal implementation files.
- **Component Structure**: Follow the component patterns shown in examples, registering area types before using them.
- **State Management**: Use the provided hooks rather than direct store access for best results.

## Table of Contents

### Guides

- [Getting Started](./guides/getting-started.md) - Initial setup of the system
- [Creating Custom Areas](./guides/custom-areas.md) - Building advanced custom areas
- [Optimizations](./guides/optimizations.md) - Performance improvement tips
- [Context Menus](./guides/context-menus.md) - Working with context menus
- [Drag and Drop](./guides/drag-and-drop.md) - Implementing drag and drop
- [Keyboard Shortcuts](./guides/keyboard-shortcuts.md) - Adding keyboard shortcuts
- [Notifications](./guides/notifications.md) - Using the notification system
- [Plugins](./guides/plugins.md) - Extending functionality with plugins
- [Performance Monitoring](./guides/performance.md) - Tracking and optimizing performance

### API

- [Components](./api/components.md) - Core components documentation
- [Hooks](./api/hooks.md) - React hooks documentation
- [Integration](./api/integration.md) - Guide for React integration

### Architecture

- [Redux Store](./architecture/store.md) - Global store structure
- [Action System](./architecture/actions.md) - Action system architecture
- [State Transitions](./architecture/state-transitions.md) - State transition management
- [Project Structure](./architecture/project-structure.md) - Organization of files and directories

## Overview

Karmyc is a modular layout system that allows you to create interfaces divided into resizable and customizable areas. It was designed to be:

- **Flexible**: Create any type of area with your own rendering logic
- **Performant**: Optimized rendering and efficient state management
- **Maintainable**: Modular and extensible architecture
- **Robust**: Built-in history system (undo/redo)

## Main Features

- **Resizable Areas**: Create areas that users can resize
- **Context Menus**: Configure context menus for areas
- **Keyboard Shortcuts**: Define keyboard shortcuts specific to each area type
- **State Management**: Store each area's state and synchronize it
- **History**: Undo and redo changes
- **Events**: Communication between areas via an event system
- **Notifications**: Display feedback to users with a notification system
- **Plugins**: Extend functionality with the plugin system
- **Performance Monitoring**: Track and optimize application performance

## Next Steps

1. Check the [Getting Started](./guides/getting-started.md) guide to set up the system
2. Explore the [API Hooks](./api/hooks.md) to understand available functionality
3. Learn how to [Create Custom Areas](./guides/custom-areas.md) 
