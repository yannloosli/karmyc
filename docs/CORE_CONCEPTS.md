# Core Concepts - Karmyc Core

## Overview

This document explains the fundamental concepts and architecture of Karmyc Core, a React-based layout management system.

## Architecture Overview

```mermaid
graph TB
    subgraph "Karmyc Core Architecture"
        A[KarmycCoreProvider] --> B[useKarmycStore]
        A --> C[useSpaceStore]
        A --> D[PluginSystem]
        
        B --> E[Screens Management]
        B --> F[Areas Management]
        B --> G[ContextMenu Management]
        B --> H[Core Management]
        
        E --> I[Screen 1]
        E --> J[Screen 2]
        E --> K[Screen N]
        
        I --> L[Areas State]
        J --> M[Areas State]
        K --> N[Areas State]
        
        L --> O[Area Components]
        L --> P[Area States]
        L --> Q[Layout Tree]
        
        C --> R[Spaces Management]
        C --> S[History Management]
        
        R --> T[Space 1]
        R --> U[Space 2]
        R --> V[Space N]
        
        S --> W[Action History]
        S --> X[Undo/Redo System]
        
        D --> Y[Custom Plugins]
        D --> Z[Action Handlers]
    end
```

## Core Entities

### Screen
A top-level container representing a browser window or tab. Each screen contains its own areas and layout.

```mermaid
graph LR
    A[Screen] --> B[Main Window]
    A --> C[Detached Window 1]
    A --> D[Detached Window 2]
    
    B --> E[Areas State]
    C --> F[Areas State]
    D --> G[Areas State]
    
    E --> H[Area 1]
    E --> I[Area 2]
    F --> J[Area 3]
    F --> K[Area 4]
    G --> L[Area 5]
    G --> M[Area 6]
```

### Space
A workspace concept that contains shared state and history, independent of the visual layout. Spaces can be associated with areas across different screens.

```mermaid
graph TB
    subgraph "Space"
        A[Space State] --> B[Shared State]
        A --> C[History Stack]
        A --> D[Metadata]
        
        B --> E[Configuration]
        B --> F[User Preferences]
        B --> G[Plugin Data]
        
        C --> H[Action 1]
        C --> I[Action 2]
        C --> J[Action N]
        
        D --> K[Name]
        D --> L[Description]
        D --> M[Color]
    end
```

## Screens, Spaces, Areas, and Layouts

### Relationship Overview

```mermaid
graph TB
    A[Screen] --> B[Areas State]
    A --> C[Layout Tree]
    
    B --> D[Area 1]
    B --> E[Area 2]
    B --> F[Area 3]
    B --> G[Area 4]
    
    D --> H[Component]
    E --> I[Component]
    F --> J[Component]
    G --> K[Component]
    
    C --> L[Area Row]
    C --> M[Area Column]
    
    L --> N[Area 1]
    L --> O[Area 2]
    
    M --> P[Area 3]
    M --> Q[Area 4]
    
    R[Space] -.-> D
    R -.-> E
    S[Space] -.-> F
    S -.-> G
    
    style R fill:#e1f5fe
    style S fill:#e1f5fe
```

- **Screen**: A top-level container (main window or detached window) that contains areas and layout
- **Area**: A rectangular region that renders a specific React component, organized within a screen
- **Layout**: Tree structure of nested rows and columns defining area arrangement within a screen
- **Space**: A logical workspace concept that can be associated with areas (especially LEAD areas) for shared state and history

### Area
A rectangular region that renders a specific React component.

```mermaid
graph LR
    subgraph "Area"
        A[Area Component] --> B[Area State]
        A --> C[Area Props]
        A --> D[Area Actions]
        
        B --> E[Local State]
        B --> F[Shared State]
        
        C --> G[id]
        C --> H[state]
        C --> I[type]
        C --> J[viewport]
        
        D --> L[State Updates]
        D --> M[Event Handlers]
    end
```

### Layout
A tree structure defining how areas are arranged on screen.

```mermaid
graph TB
    A[Root Layout] --> B[Area Row - Horizontal]
    A --> C[Area Row - Vertical]
    
    B --> D[Area 1]
    B --> E[Area 2]
    B --> F[Area 3]
    
    C --> G[Area 4]
    C --> H[Area 5]
    
    D --> I[Component A]
    E --> J[Component B]
    F --> K[Component C]
    G --> L[Component D]
    H --> M[Component E]
```

## State Management

### Zustand Store Structure

```mermaid
graph TB
    subgraph "useKarmycStore"
        A[Main Store] --> B[Screens]
        A --> C[Areas]
        A --> D[ContextMenu]
        A --> E[Core]
        
        B --> F[Screen 1]
        B --> G[Screen 2]
        B --> H[Active Screen]
        
        F --> I[Areas State]
        G --> J[Areas State]
        
        I --> K[Layout Tree]
        I --> L[Area Components]
        I --> M[Viewports]
        
        C --> N[Area Registry]
        C --> O[Area Types]
        C --> P[Area States]
        
        D --> Q[Menu Items]
        D --> R[Menu Position]
        
        E --> S[Configuration]
        E --> T[Settings]
    end
    
    subgraph "useSpaceStore"
        U[Space Store] --> V[Spaces]
        U --> W[Active Space]
        U --> X[History]
        
        V --> Y[Space 1]
        V --> Z[Space 2]
        
        Y --> AA[Shared State]
        Y --> BB[Metadata]
        
        X --> CC[Action Stack]
        X --> DD[Undo/Redo]
    end
```

### Store Slices

The main store is divided into several slices:

1. **Screens Slice**: Manages multiple screens and their states
2. **Areas Slice**: Manages areas, their types, and layouts
3. **Context Menu Slice**: Manages context menu state and actions
4. **Core Slice**: Manages core configuration and settings

The space store manages:
1. **Spaces**: Workspace definitions and shared state
2. **History**: Action history for undo/redo functionality
3. **Active Space**: Currently active workspace

## Area Types and Registration

### Area Type System

Areas are typed components that can be registered with the system:

```typescript
interface AreaTypeOptions {
  displayName: string;
  role: AREA_ROLE;
  icon: React.ComponentType;
}

enum AREA_ROLE {
  LEAD = 'LEAD',      // Primary workspace areas
  FOLLOW = 'FOLLOW',  // Secondary areas that follow LEAD areas
  SELF = 'SELF'       // Independent areas
}
```

### Area Registration Flow

```mermaid
sequenceDiagram
    participant App as Application
    participant Registry as Area Registry
    participant Store as Store
    participant Component as Area Component
    
    App->>Registry: Register Area Type
    Registry->>Store: Store Type Definition
    App->>Store: Create Area Instance
    Store->>Component: Render with Props
    Component->>Store: Update State
    Store->>Component: Re-render
```

## Layout System

### Layout Tree Structure

Layouts are represented as a tree of nodes:

```typescript
interface LayoutNode {
  id: string;
  type: 'area' | 'area_row';
  orientation?: 'horizontal' | 'vertical';
  areas?: Array<{ id: string; size: number }>;
}
```

### Layout Operations

```mermaid
graph LR
    A[Layout Operations] --> B[Split Area]
    A --> C[Join Areas]
    A --> D[Resize Areas]
    A --> E[Move Areas]
    
    B --> F[Create Row/Column]
    B --> G[Add New Area]
    
    C --> H[Remove Row/Column]
    C --> I[Merge Areas]
    
    D --> J[Update Sizes]
    D --> K[Maintain Ratios]
    
    E --> L[Drag & Drop]
    E --> M[Update Layout]
```

## Plugin System

### Plugin Architecture

Plugins can extend the system's functionality:

```typescript
interface IActionPlugin {
  id: string;
  name: string;
  onStoreChange?: (state: any, prevState: any) => void;
  onStoreInit?: (store: StoreApi<any>) => void;
  transformState?: (state: any) => Partial<any>;
  actions?: Record<string, (...args: any[]) => void>;
}
```

### Plugin Integration

```mermaid
graph TB
    A[Plugin System] --> B[Action Registry]
    A --> C[State Transformers]
    A --> D[Event Handlers]
    
    B --> E[Custom Actions]
    B --> F[Action Validators]
    
    C --> G[State Modifications]
    C --> H[Data Transformations]
    
    D --> I[Store Changes]
    D --> J[External Events]
```

## Enhanced History System

### History Architecture

The enhanced history system provides sophisticated undo/redo functionality:

```mermaid
graph TB
    A[History System] --> B[Action Recording]
    A --> C[State Diffs]
    A --> D[Metadata]
    
    B --> E[Action Stack]
    B --> F[Action Groups]
    
    C --> G[State Changes]
    C --> H[Related Changes]
    
    D --> I[Timestamps]
    D --> J[User Info]
    D --> K[Action Types]
```

### History Actions

```typescript
interface EnhancedHistoryAction {
  id: string;
  name: string;
  timestamp: number;
  diffs: Diff[];
  state: any;
  allowIndexShift: boolean;
  modifiedRelated: boolean;
  metadata: {
    actionType: string;
    payload?: Record<string, any>;
    duration?: number;
  };
  indexDirection: -1 | 1;
}
```

## Multi-Screen Support

### Screen Management

Karmyc Core supports multiple screens with independent layouts:

```mermaid
graph TB
    A[Screen Manager] --> B[Main Screen]
    A --> C[Detached Screen 1]
    A --> D[Detached Screen 2]
    
    B --> E[Areas & Layout]
    C --> F[Areas & Layout]
    D --> G[Areas & Layout]
    
    E --> H[Screen State]
    F --> I[Screen State]
    G --> J[Screen State]
    
    H --> K[Active Areas]
    I --> L[Active Areas]
    J --> M[Active Areas]
```

### Screen Operations

- **Create Screen**: Create a new detached window
- **Remove Screen**: Close a detached window
- **Switch Screen**: Change active screen
- **Sync State**: Synchronize state between screens

## Tools Slot System

### Slot Architecture

The tools slot system allows injecting components into predefined UI positions:

```mermaid
graph TB
    A[Tools Slot System] --> B[Top Outer]
    A --> C[Top Inner]
    A --> D[Bottom Outer]
    A --> E[Bottom Inner]
    
    B --> F[App Title Tools]
    C --> G[App Tools]
    D --> H[App Title Tools]
    E --> I[App Tools]
    
    F --> J[Registered Components]
    G --> K[Registered Components]
    H --> L[Registered Components]
    I --> M[Registered Components]
```

### Slot Types

- **apptitle**: Tools for the application title bar
- **app**: Tools for the main application area

### Slot Positions

- **top-outer**: Above the main content, outside the app area
- **top-inner**: Above the main content, inside the app area
- **bottom-outer**: Below the main content, outside the app area
- **bottom-inner**: Below the main content, inside the app area

## Drag and Drop System

### Drag and Drop Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Area as Area Component
    participant DnD as Drag & Drop Hook
    participant Store as Store
    
    User->>Area: Start Drag
    Area->>DnD: handleDragStart
    DnD->>Store: Set Drag State
    DnD->>Area: Show Preview
    
    User->>Area: Drag Over
    Area->>DnD: handleDragOver
    DnD->>Store: Update Preview
    
    User->>Area: Drop
    Area->>DnD: handleDrop
    DnD->>Store: Execute Drop Action
    Store->>Area: Update Layout
```

### Drop Zones

Drop zones are areas where dragged items can be dropped:

- **Area Joining**: Join two areas together
- **Area Splitting**: Split an area into multiple areas
- **Area Moving**: Move an area to a different position

## Context Menu System

### Context Menu Architecture

```mermaid
graph TB
    A[Context Menu System] --> B[Menu Items]
    A --> C[Menu Position]
    A --> D[Menu Actions]
    
    B --> E[Area Actions]
    B --> F[Layout Actions]
    B --> G[Space Actions]
    
    C --> H[Mouse Position]
    C --> I[Element Position]
    
    D --> J[Action Handlers]
    D --> K[State Updates]
```

### Menu Types

- **Area Context Menu**: Actions for specific areas
- **Layout Context Menu**: Actions for layout management
- **Space Context Menu**: Actions for space management

## Error Handling

### Error Boundary System

```mermaid
graph TB
    A[Error Boundary] --> B[Area Errors]
    A --> C[Layout Errors]
    A --> D[System Errors]
    
    B --> E[Component Errors]
    B --> F[State Errors]
    
    C --> G[Layout Validation]
    C --> H[Area Validation]
    
    D --> I[Plugin Errors]
    D --> J[Store Errors]
```

### Error Recovery

- **Area Error Boundary**: Catches errors in area components
- **Fallback Components**: Provides fallback UI for failed areas
- **Error Reporting**: Reports errors for debugging

## Performance Optimizations

### Optimization Strategies

1. **Memoization**: Components and hooks are memoized to prevent unnecessary re-renders
2. **Selective Updates**: Only affected areas are updated when state changes
3. **Lazy Loading**: Area components are loaded on demand
4. **Viewport Culling**: Only visible areas are rendered

### Performance Monitoring

```mermaid
graph TB
    A[Performance Monitoring] --> B[Render Times]
    A --> C[Memory Usage]
    A --> D[State Updates]
    
    B --> E[Component Renders]
    B --> F[Layout Updates]
    
    C --> G[Area Instances]
    C --> H[Store Size]
    
    D --> I[Action Frequency]
    D --> J[Update Patterns]
``` 
