# Area Guide - Karmyc Core

## Overview

Areas are the fundamental building blocks of Karmyc Core. They represent rectangular regions that render specific React components and can be arranged in various layouts. This guide covers everything you need to know about creating, managing, and customizing areas.

## Area Fundamentals

### What is an Area?

An area is a rectangular region that:
- Renders a specific React component
- Has its own state and lifecycle
- Can be resized, moved, and arranged in layouts
- Can be associated with spaces for shared state
- Supports drag and drop operations

### Area Structure

```typescript
interface IArea<T = any> {
  id: string;                    // Unique identifier
  type: AreaTypeValue;          // Type of area (e.g., 'my-area')
  state: T;                     // Area-specific state
  position?: Position;          // Optional position
  spaceId?: string;             // Associated space ID
}

interface Position {
  x: number;
  y: number;
}
```

### Area Roles

Areas can have different roles that determine their behavior:

```typescript
enum AREA_ROLE {
  LEAD = 'LEAD',      // Primary workspace areas with shared state
  FOLLOW = 'FOLLOW',  // Secondary areas that follow LEAD areas
  SELF = 'SELF'       // Independent areas with local state only
}
```

## Creating Area Types

### Step 1: Define the Area Component

Create a React component that will render your area:

```tsx
// MyAreaComponent.tsx
import React from 'react';
import { AreaComponentProps } from '@gamesberry/karmyc-core';

interface MyAreaState {
  data: string;
  count: number;
}

export const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  areaState,
  width,
  height,
  left,
  top
}) => {
  return (
    <div 
      style={{ 
        width, 
        height, 
        left, 
        top,
        border: '1px solid #ccc',
        padding: '10px'
      }}
    >
      <h3>My Area: {areaId}</h3>
      <p>Data: {areaState.data}</p>
      <p>Count: {areaState.count}</p>
    </div>
  );
};
```

### Step 2: Register the Area Type

Register your area type using the `useRegisterAreaType` hook:

```tsx
// MyArea.tsx
import React from 'react';
import { useRegisterAreaType, AREA_ROLE } from '@gamesberry/karmyc-core';
import { MyAreaComponent } from './MyAreaComponent';
import { MyIcon } from 'lucide-react';

export const MyArea = () => {
  useRegisterAreaType(
    'my-area',                    // Unique type identifier
    MyAreaComponent,              // React component
    {                             // Initial state
      data: 'Default data',
      count: 0
    },
    {                             // Options
      displayName: 'My Area',
      role: AREA_ROLE.LEAD,
      icon: MyIcon
    }
  );
  
  return null; // This component doesn't render anything
};
```

### Step 3: Initialize Areas

Add your area initializer to your app:

```tsx
// AreaInitializer.tsx
import React from 'react';
import { MyArea } from './areas/MyArea';

export const AreaInitializer = () => {
  return (
    <>
      <MyArea />
    </>
  );
};
```

## Area State Management

### Accessing Area State

Use the specialized optimized hooks to access area state with optimal performance:

```tsx
// Inside your area component
import { useAreaById, useAreaActions } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  areaState,
  // ... other props
}) => {
  // Get area data with optimized selector (only re-renders when this area changes)
  const area = useAreaById(areaId);
  
  // Get actions (stable reference, no re-renders)
  const actions = useAreaActions();
  
  const handleUpdateData = () => {
    actions.updateArea({
      id: areaId,
      state: {
        ...area?.state,
        data: 'Updated data',
        count: (area?.state.count || 0) + 1
      }
    });
  };
  
  return (
    <div>
      <p>Data: {area?.state.data}</p>
      <p>Count: {area?.state.count}</p>
      <button onClick={handleUpdateData}>Update</button>
    </div>
  );
};
```

### Alternative: Using the Main Optimized Hook

You can also use the main `useAreaOptimized` hook which provides both actions and enhanced functionality:

```tsx
import { useAreaOptimized, useAreaById } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  areaState,
  // ... other props
}) => {
  // Get area data with optimized selector
  const area = useAreaById(areaId);
  
  // Get optimized actions and additional functionality
  const { update, splitArea, setRowSizes } = useAreaOptimized();
  
  const handleUpdateData = () => {
    update(areaId, {
      state: {
        ...area?.state,
        data: 'Updated data',
        count: (area?.state.count || 0) + 1
      }
    });
  };
  
  const handleSplitArea = () => {
    splitArea(areaId, 'horizontal');
  };
  
  return (
    <div>
      <p>Data: {area?.state.data}</p>
      <p>Count: {area?.state.count}</p>
      <button onClick={handleUpdateData}>Update</button>
      <button onClick={handleSplitArea}>Split Horizontally</button>
    </div>
  );
};
```

### Available Specialized Hooks

- **`useAreaById(areaId)`** - Get a specific area (only re-renders when this area changes)
- **`useActiveArea()`** - Get the currently active area
- **`useAllAreas()`** - Get all areas in the current screen
- **`useAreaLayoutById(areaId)`** - Get the layout of a specific area
- **`useAreaViewports()`** - Get area viewports
- **`useAreaErrors()`** - Get area-related errors
- **`useRootArea()`** - Get the root area
- **`useJoinPreview()`** - Get join preview state
- **`useAreaActions()`** - Get all area actions (stable reference)

### Area Actions

Karmyc Core provides two approaches for area manipulation:

#### 1. Classic Hook: `useArea()`

Provides basic area management with callback-based data access:

```tsx
import { useArea } from '@gamesberry/karmyc-core';

const MyComponent = () => {
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
  
  // Create a new area
  const handleCreateArea = () => {
    const areaId = createArea('my-area', { data: 'New area' });
    console.log('Created area:', areaId);
  };
  
  // Remove an area
  const handleRemoveArea = (areaId: string) => {
    removeArea(areaId);
  };
  
  // Get data via callbacks (may cause unnecessary re-renders)
  const activeArea = getActive();
  const allAreas = getAll();
  
  return (
    <div>
      <button onClick={handleCreateArea}>Create Area</button>
      <button onClick={() => handleRemoveArea('area-1')}>Remove Area</button>
      <p>Active area: {activeArea?.id}</p>
    </div>
  );
};
```

#### 2. Optimized Hook: `useAreaOptimized()`

Provides enhanced area management with additional actions and better performance:

```tsx
import { useAreaOptimized, useActiveArea, useAllAreas } from '@gamesberry/karmyc-core';

const MyComponent = () => {
  const {
    createArea,
    removeArea,
    setActive,
    update,
    // Additional optimized actions
    splitArea,
    joinOrMoveArea,
    setRowSizes,
    finalizeAreaPlacement,
    setJoinPreview
  } = useAreaOptimized();
  
  // Get data with optimized selectors (only re-renders when specific data changes)
  const activeArea = useActiveArea();
  const allAreas = useAllAreas();
  
  // Create a new area
  const handleCreateArea = () => {
    const areaId = createArea('my-area', { data: 'New area' });
    console.log('Created area:', areaId);
  };
  
  // Advanced area operations
  const handleSplitArea = (areaId: string) => {
    splitArea(areaId, 'horizontal');
  };
  
  const handleResizeRow = (rowId: string, sizes: number[]) => {
    setRowSizes(rowId, sizes);
  };
  
  return (
    <div>
      <button onClick={handleCreateArea}>Create Area</button>
      <button onClick={() => removeArea('area-1')}>Remove Area</button>
      <button onClick={() => handleSplitArea('area-1')}>Split Area</button>
      <p>Active area: {activeArea?.id}</p>
      <p>Total areas: {Object.keys(allAreas).length}</p>
    </div>
  );
};
```

#### When to Use Which Hook?

**Use `useArea()`** when:
- You need simple area management
- You're migrating from legacy code
- You don't need advanced layout operations
- Performance is not a critical concern

**Use `useAreaOptimized()`** when:
- You need optimal performance with large numbers of areas
- You require advanced layout operations (split, join, resize)
- You want granular control over re-renders
- You're building complex UI components

#### Key Differences:

| Feature | `useArea()` | `useAreaOptimized()` |
|---------|-------------|----------------------|
| **Data Access** | Callback-based | Optimized selectors via specialized hooks |
| **Performance** | Standard | Optimized for minimal re-renders |
| **Actions** | Basic CRUD | Extended with layout operations |
| **Type Safety** | Uses fallback types | Strict type validation |
| **Architecture** | Centralized | Modular with specialized hooks |

#### Migration Guide

To migrate from `useArea()` to `useAreaOptimized()`:

```tsx
// Before
const { getActive, getById, getAll } = useArea();
const activeArea = getActive();
const specificArea = getById('area-1');
const allAreas = getAll();

// After
const { update, splitArea } = useAreaOptimized();
const activeArea = useActiveArea();
const specificArea = useAreaById('area-1');
const allAreas = useAllAreas();
```
  };
  
  // Set active area
  const handleSetActive = (areaId: string) => {
    setActive(areaId);
  };
  
  // Update area
  const handleUpdateArea = (areaId: string) => {
    update(areaId, { state: { data: 'Updated' } });
  };
  
  // Get all areas
  const allAreas = getAll();
  
  return (
    <div>
      <button onClick={handleCreateArea}>Create Area</button>
      {allAreas.map(area => (
        <div key={area.id}>
          <span>{area.id}</span>
          <button onClick={() => handleRemoveArea(area.id)}>Remove</button>
        </div>
      ))}
    </div>
  );
};
```

## Area Layout and Positioning

### Viewport Props

Area components receive viewport information as props:

```tsx
interface AreaComponentProps<T = any> {
  areaId: string;
  areaState: T;
  width: number;    // Width in pixels
  height: number;   // Height in pixels
  left: number;     // Left position in pixels
  top: number;      // Top position in pixels
}
```

### Responsive Design

Areas automatically resize based on their container. Use the viewport props for responsive layouts:

```tsx
const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  width,
  height,
  left,
  top,
  areaState
}) => {
  const isSmall = width < 300;
  const isMedium = width >= 300 && width < 600;
  const isLarge = width >= 600;
  
  return (
    <div style={{ width, height, left, top }}>
      {isSmall && <SmallLayout data={areaState} />}
      {isMedium && <MediumLayout data={areaState} />}
      {isLarge && <LargeLayout data={areaState} />}
    </div>
  );
};
```

## Area Interactions

### Drag and Drop

Enable drag and drop for areas using the `useAreaDragAndDrop` hook:

```tsx
import { useAreaDragAndDrop } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  const {
    isDragging,
    dragPreview,
    handleDragStart,
    handleDragEnd
  } = useAreaDragAndDrop(areaId);
  
  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: 'move'
      }}
    >
      {isDragging && dragPreview}
      <h3>Draggable Area</h3>
      <p>Drag me to move this area</p>
    </div>
  );
};
```

### Context Menus

Areas can have context menus for additional actions:

```tsx
import { useContextMenu } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  const { showContextMenu, hideContextMenu } = useContextMenu();
  
  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault();
    showContextMenu(event.nativeEvent, [
      {
        label: 'Copy',
        onClick: () => console.log('Copy area')
      },
      {
        label: 'Delete',
        onClick: () => console.log('Delete area')
      }
    ]);
  };
  
  return (
    <div onContextMenu={handleContextMenu}>
      <h3>Right-click for menu</h3>
    </div>
  );
};
```

### Keyboard Shortcuts

Areas can respond to keyboard shortcuts:

```tsx
import { useAreaKeyboardShortcuts } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  useAreaKeyboardShortcuts(areaId);
  
  // The area will automatically respond to keyboard shortcuts
  // like Ctrl+Z (undo), Ctrl+Y (redo), etc.
  
  return (
    <div>
      <h3>Keyboard shortcuts enabled</h3>
      <p>Try Ctrl+Z to undo</p>
    </div>
  );
};
```

## Area Error Handling

### Error Boundaries

Wrap area components with error boundaries:

```tsx
import { AreaErrorBoundary } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  return (
    <AreaErrorBoundary areaId={areaId}>
      <div>
        <h3>My Area</h3>
        {/* Your area content */}
      </div>
    </AreaErrorBoundary>
  );
};
```

### Fallback Components

Create fallback components for when areas fail to render:

```tsx
// AreaFallback.tsx
import React from 'react';

interface AreaFallbackProps {
  areaId: string;
  error?: Error;
}

export const AreaFallback: React.FC<AreaFallbackProps> = ({ areaId, error }) => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h3>Area Failed to Load</h3>
      <p>Area ID: {areaId}</p>
      {error && <p>Error: {error.message}</p>}
      <button onClick={() => window.location.reload()}>
        Reload Area
      </button>
    </div>
  );
};
```

## Area Styling

### CSS Classes

Areas receive CSS classes for styling:

```css
/* Default area styles */
.area-component {
  position: absolute;
  overflow: hidden;
  background: white;
  border: 1px solid #ddd;
}

.area-component.active {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.area-component.dragging {
  opacity: 0.5;
  z-index: 1000;
}
```

### Custom Styling

Apply custom styles to your area components:

```tsx
const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  width,
  height,
  left,
  top,
  areaState
}) => {
  return (
    <div
      className="my-custom-area"
      style={{
        width,
        height,
        left,
        top,
        backgroundColor: areaState.theme === 'dark' ? '#333' : '#fff',
        color: areaState.theme === 'dark' ? '#fff' : '#333',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}
    >
      <h3>Custom Styled Area</h3>
      <p>Theme: {areaState.theme}</p>
    </div>
  );
};
```

## Area Performance

### Optimization Strategies

1. **Memoization**: Use React.memo for area components
2. **Selective Updates**: Only update when necessary
3. **Lazy Loading**: Load heavy components on demand

```tsx
import React, { memo, useMemo } from 'react';

const MyAreaComponent = memo<AreaComponentProps<MyAreaState>>(({
  areaId,
  areaState,
  width,
  height,
  left,
  top
}) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return expensiveCalculation(areaState.data);
  }, [areaState.data]);
  
  // Memoize styles
  const styles = useMemo(() => ({
    width,
    height,
    left,
    top,
    backgroundColor: areaState.theme === 'dark' ? '#333' : '#fff'
  }), [width, height, left, top, areaState.theme]);
  
  return (
    <div style={styles}>
      <h3>Optimized Area</h3>
      <p>Processed: {processedData}</p>
    </div>
  );
});

MyAreaComponent.displayName = 'MyAreaComponent';
```

## Area Configuration

### Initial Configuration

Configure areas in your Karmyc setup:

```tsx
const karmycConfig = {
  plugins: [],
  initialAreas: [
    {
      id: 'area-1',
      type: 'my-area',
      state: {
        data: 'Initial data',
        count: 0,
        theme: 'light'
      },
      role: AREA_ROLE.LEAD
    },
    {
      id: 'area-2',
      type: 'my-area',
      state: {
        data: 'Second area',
        count: 10,
        theme: 'dark'
      },
      role: AREA_ROLE.FOLLOW
    }
  ],
  keyboardShortcutsEnabled: true,
  builtInLayouts: [],
  initialLayout: 'default',
  resizableAreas: true,
  manageableAreas: true,
  multiScreen: true
};
```

### Built-in Layouts

Define layouts that include your areas:

```tsx
const builtInLayouts = [
  {
    id: 'my-layout',
    name: 'My Custom Layout',
    config: {
      _id: 1,
      rootId: 'root',
      errors: [],
      activeAreaId: 'area-1',
      joinPreview: null,
      layout: {
        root: {
          id: 'root',
          type: 'area_row',
          orientation: 'horizontal',
          areas: [
            { id: 'area-1', size: 0.6 },
            { id: 'area-2', size: 0.4 }
          ]
        },
        'area-1': {
          type: 'area',
          id: 'area-1'
        },
        'area-2': {
          type: 'area',
          id: 'area-2'
        }
      },
      areas: {
        'area-1': {
          id: 'area-1',
          type: 'my-area',
          state: { data: 'Left area' },
          role: AREA_ROLE.LEAD
        },
        'area-2': {
          id: 'area-2',
          type: 'my-area',
          state: { data: 'Right area' },
          role: AREA_ROLE.FOLLOW
        }
      },
      viewports: {},
      areaToOpen: null,
      lastSplitResultData: null,
      lastLeadAreaId: 'area-1'
    },
    isBuiltIn: true
  }
];
```

## Advanced Area Features

### Area Stacks

Areas can be stacked in tabs:

```tsx
import { AreaTabs } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  const areas = [
    { id: 'tab1', type: 'my-area', state: { data: 'Tab 1' } },
    { id: 'tab2', type: 'my-area', state: { data: 'Tab 2' } }
  ];
  
  return (
    <div>
      <AreaTabs areas={areas} />
    </div>
  );
};
```

### Area Previews

Show previews when dragging areas:

```tsx
import { AreaPreview } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  areaState,
  // ... other props
}) => {
  return (
    <div>
      <h3>My Area</h3>
      <AreaPreview area={{ id: areaId, type: 'my-area', state: areaState }} />
    </div>
  );
};
```

### Area Joining

Areas can be joined together:

```tsx
import { JoinAreaPreview } from '@gamesberry/karmyc-core';

const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  // ... other props
}) => {
  const sourceArea = { id: areaId, type: 'my-area', state: {} };
  const targetArea = { id: 'target-area', type: 'my-area', state: {} };
  
  return (
    <div>
      <JoinAreaPreview sourceArea={sourceArea} targetArea={targetArea} />
    </div>
  );
};
```

## Best Practices

### 1. Keep Areas Focused

Each area should have a single responsibility:

```tsx
// Good: Focused area
const DataViewerArea: React.FC<AreaComponentProps> = ({ areaState }) => (
  <div>
    <h3>Data Viewer</h3>
    <DataTable data={areaState.data} />
  </div>
);

// Bad: Too many responsibilities
const ComplexArea: React.FC<AreaComponentProps> = ({ areaState }) => (
  <div>
    <h3>Complex Area</h3>
    <DataTable data={areaState.data} />
    <Chart data={areaState.chartData} />
    <Form onSubmit={handleSubmit} />
    <SettingsPanel />
  </div>
);
```

### 2. Use Proper State Management

Keep area state minimal and focused:

```tsx
// Good: Minimal state
interface GoodAreaState {
  data: string[];
  selectedIndex: number;
}

// Bad: Too much state
interface BadAreaState {
  data: string[];
  selectedIndex: number;
  uiState: {
    isExpanded: boolean;
    isDragging: boolean;
    isResizing: boolean;
    theme: string;
    language: string;
    // ... many more UI states
  };
  // ... more state
}
```

### 3. Handle Errors Gracefully

Always provide error boundaries and fallbacks:

```tsx
const MyAreaComponent: React.FC<AreaComponentProps<MyAreaState>> = ({
  areaId,
  areaState
}) => {
  if (!areaState.data) {
    return <div>No data available</div>;
  }
  
  try {
    return (
      <div>
        <h3>My Area</h3>
        <DataComponent data={areaState.data} />
      </div>
    );
  } catch (error) {
    return <div>Error loading area: {error.message}</div>;
  }
};
```

### 4. Optimize for Performance

Use React optimization techniques:

```tsx
const MyAreaComponent = memo<AreaComponentProps<MyAreaState>>(({
  areaId,
  areaState,
  width,
  height,
  left,
  top
}) => {
  const styles = useMemo(() => ({
    width,
    height,
    left,
    top
  }), [width, height, left, top]);
  
  const processedData = useMemo(() => {
    return processData(areaState.data);
  }, [areaState.data]);
  
  return (
    <div style={styles}>
      <DataDisplay data={processedData} />
    </div>
  );
});
```

### 5. Follow Naming Conventions

Use consistent naming for area types and components:

```tsx
// Good: Clear naming
const DataViewerArea = () => {
  useRegisterAreaType('data-viewer', DataViewerComponent, { data: [] });
  return null;
};

// Bad: Unclear naming
const Area1 = () => {
  useRegisterAreaType('area1', Component1, {});
  return null;
};
```

## Troubleshooting

### Common Issues

1. **Area not rendering**: Check if the area type is properly registered
2. **State not updating**: Ensure you're using the correct state management hooks
3. **Layout issues**: Verify viewport props are being used correctly
4. **Performance problems**: Use memoization and optimization techniques

### Debug Tools

Use the browser's React DevTools to inspect area components and their state.

### Error Messages

Common error messages and solutions:

- `"Area type not found"`: Register the area type before using it
- `"Invalid area configuration"`: Check the area configuration format
- `"Area already exists"`: Use unique IDs for areas
