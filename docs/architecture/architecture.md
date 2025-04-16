# Karmyc Core Architecture

This document provides an overview of the architecture and fundamental design patterns used in the Karmyc Core modular layout system.

## System Architecture

Karmyc Core follows a modular architecture built around Redux for state management, with hooks for React integration. The system is designed to be flexible, extensible, and maintainable.

```mermaid
graph TD
    A[lib/index.ts] --> B[store]
    A --> C[hooks]
    A --> D[actions]
    A --> E[components]
    A --> F[providers]
    
    B --> G[slices]
    B --> H[middleware]
    B --> I[enhancers]
    
    G --> J[area.ts]
    G --> K[contextMenu.ts]
    G --> L[project.ts]
    
    H --> M[history.ts]
    H --> N[actions.ts]
    H --> O[persistence.ts]
    
    C --> P[useArea.ts]
    C --> Q[useContextMenu.ts]
    C --> R[useProject.ts]
    
    D --> S[registry.ts]
    D --> T[validation.ts]
    D --> U[plugins]
```

For a detailed overview of the project structure, please refer to the [Project Structure](./project-structure.md) document.

## State Management

### State Structure

Karmyc Core uses a two-level state structure:

1. **ApplicationState**: The complete application state, including history
2. **ActionState**: The current state without history, used for current operations

This distinction allows fine-grained history management while maintaining optimal performance for current operations.

```mermaid
graph TD
    A[ApplicationState] --> B[ActionState]
    A --> C[History]
    B --> D[Area State]
    B --> E[Context Menu State]
    B --> F[Project State]
    B --> G[Tool State]
    C --> H[Previous States List]
    C --> I[Current Index]
    C --> J[Differences]
```

## Action System

Karmyc Core uses a modular action system based on a plugin architecture that allows registering action handlers with different priorities. It is integrated with Redux Toolkit and provides React hooks for easy use.

```mermaid
graph TD
    A[Action Dispatch] --> B[Action Registry]
    B --> C[Action Validation]
    C --> D[Action Handlers]
    D --> E[Store Update]
    D --> F[Side Effects]
    B --> G[Middleware]
    G --> H[History Management]
```

For a detailed explanation of the action system, see the [Action System](./actions.md) document.

## Data Flow

The data flow in Karmyc Core follows the Redux pattern with custom extensions for specific features like history, complex operations, and visual differences.

```mermaid
graph TD
    U[User] -->|Interaction| C[UI Components]
    C -->|requestAction| L[Listener System]
    L -->|createOperation| O[Operation]
    O -->|add actions| O
    O -->|addDiff| O
    O -->|submit| S[Redux Store]
    S -->|dispatch| R[Reducers]
    R -->|update| S
    S -->|state changes| C
    O -->|performDiff| D[Diff System]
    D -->|visual updates| C
```

## Component Architecture

Karmyc Core provides a set of React components for building modular layouts:

1. **KarmycProvider**: The main provider component that wraps the application
2. **AreaRoot**: The container for all areas
3. **Area**: Individual area components that can be customized
4. **ContextMenu**: Context menu system
5. **Toolbar**: Toolbar components

These components are connected to the state management system and provide a seamless user experience.

## Integration Points

Karmyc Core provides several integration points for customization:

1. **Area Types**: Register custom area types with specific components and initial state
2. **Actions**: Register custom actions to extend functionality
3. **Keyboard Shortcuts**: Register keyboard shortcuts for specific area types
4. **Context Menus**: Create custom context menus for areas
5. **Plugins**: Register plugins to extend core functionality

These integration points allow for extensive customization while maintaining a consistent API and behavior.

## Usage Flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as Component
    participant L as Listener
    participant R as requestAction
    
    U->>C: Interaction (click, drag-drop)
    C->>R: requestAction(options, callback)
    R->>L: addListener(event, handler)
    L-->>R: event triggered
    R->>C: callback with params
```

This architecture provides a solid foundation for building complex layouts with drag-and-drop functionality, resizable areas, and rich user interactions. 
