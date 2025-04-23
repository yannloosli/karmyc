# History System (Undo/Redo)

This guide explains how the history system works in Karmyc, allowing users to undo and redo actions.

## Overview

Karmyc's history system uses a plugin-based architecture to record important actions and allow them to be undone or redone. It consists of several components:

1.  **History Plugin**: Captures specified actions for the history.
2.  **History Middleware**: Intercepts actions and generates differences (diffs).
3.  **History Slice**: Manages the history state (past, future, ongoing actions).
4.  **React Hooks**: Provides a simple API for using history in components.

## Quick Setup

```tsx
import React from 'react';
import { useKarmyc, KarmycProvider, historyPlugin } from '@gamesberry/karmyc-core';

function App() {
  // Enable history via the plugin system
  const config = useKarmyc({
    plugins: [historyPlugin],
    enableLogging: process.env.NODE_ENV === 'development'
  });

  return (
    <KarmycProvider options={config}>
      <YourApplication />
      <HistoryControls /> {/* Optional history control component */}
    </KarmycProvider>
  );
}
```

## Using the `useHistory` Hook

Karmyc provides a `useHistory` hook to easily interact with the history system in your components:

```tsx
import React from 'react';
import { useHistory } from '@gamesberry/karmyc-core';

function HistoryControls() {
  const { canUndo, canRedo, undo, redo, historyLength } = useHistory();

  return (
    <div className="history-controls">
      <button
        onClick={undo}
        disabled={!canUndo}
      >
        Undo
      </button>

      <button
        onClick={redo}
        disabled={!canRedo}
      >
        Redo
      </button>

      <div className="history-info">
        Actions in history: {historyLength}
      </div>
    </div>
  );
}
```

## History per Space

An important feature of Karmyc's history system is managing independent histories per Space. Each space has its own action history, allowing for finer, more contextualized undo and redo management.

To use space-specific history, the `useHistory` hook provides specialized methods:

```tsx
import React from 'react';
import { useHistory } from '@gamesberry/karmyc-core';

function SpaceHistoryControls({ spaceId }) {
  const {
    canUndoForSpace,
    canRedoForSpace,
    undo,
    redo,
    getHistoryForSpace
  } = useHistory();

  // Check if undo/redo is possible for this space
  const canUndoSpace = canUndoForSpace(spaceId);
  const canRedoSpace = canRedoForSpace(spaceId);

  // Get the complete history for this space
  const spaceHistory = getHistoryForSpace(spaceId);

  return (
    <div className="space-history-controls">
      <button
        onClick={() => undo(spaceId)}
        disabled={!canUndoSpace}
      >
        Undo
      </button>

      <button
        onClick={() => redo(spaceId)}
        disabled={!canRedoSpace}
      >
        Redo
      </button>

      <div className="history-info">
        Actions in history: {spaceHistory.actions.length}
      </div>
    </div>
  );
}
```

## Actions Recorded in History

By default, the history plugin records the following actions:

-   `area/addArea`: Adding an area
-   `area/removeArea`: Removing an area
-   `area/updateArea`: Updating an area
-   `area/moveArea`: Moving an area
-   `area/resizeArea`: Resizing an area
-   `composition/update`: Updating a composition
-   `composition/addElement`: Adding an element
-   `composition/removeElement`: Removing an element
-   `composition/updateElement`: Updating an element
-   `project/update`: Updating a project
-   `drawing/addLine`: Adding a drawing line
-   `drawing/changeStrokeWidth`: Changing stroke width
-   `drawing/clearCanvas`: Clearing the canvas

## Customizing the History System

### Ignoring Certain Actions

You can modify the list of actions to record in the history by creating your own plugin:

```typescript
import { historyPlugin } from '@gamesberry/karmyc-core';

// Create a custom history plugin
const customHistoryPlugin = {
  ...historyPlugin,
  actionTypes: [
    'area/addArea',
    'area/removeArea',
    // Your custom list of actions
  ]
};

// Use this custom plugin
const config = useKarmyc({
  plugins: [customHistoryPlugin]
});
```

### Limiting History Size

You can configure the history limit:

```typescript
const config = useKarmyc({
  plugins: [historyPlugin],
  historyOptions: {
    limit: 50 // Maximum 50 actions in history
  }
});
```

### Accessing Action Metadata

You can access the metadata of actions recorded in the history:

```typescript
function HistoryList() {
  const { getHistoryForSpace } = useHistory();
  const spaceId = 'your-space-id';
  const { actions } = getHistoryForSpace(spaceId);

  return (
    <div className="history-list">
      <h3>Action History</h3>
      <ul>
        {actions.map(action => (
          <li key={action.id}>
            {action.name} - {new Date(action.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Technical Details

### History Entry Structure

Each entry in the history contains the following information:

```typescript
interface HistoryEntry {
  name: string;         // Action name
  timestamp?: number;   // Timestamp
  prevState: any;       // State before the action
  nextState: any;       // State after the action
  metadata?: {
    spaceId?: string;    // ID of the affected space
    projectId?: string;  // ID of the affected project
    userId?: string;     // User ID
    duration?: number;   // Action duration
  };
}
```

### Internal Architecture

The history system uses the Redux pattern to manage history state:

1.  The **History Middleware** intercepts all actions.
2.  For history actions, it generates differences (diffs) between the state before and after.
3.  The **History Slice** stores history entries with the previous and next states.
4.  The **`useHistory` hook** provides an API to interact with the history.

## Complete Example: HistoryDrawingArea

Karmyc includes a complete example of using the history system with the `HistoryDrawingArea` component. This component allows drawing on a canvas and uses history to enable undoing and redoing drawing actions.

Here's how the history system is used in this component:

```tsx
// Import history functions
import {
  addHistoryEntry,
  hasFutureEntriesForSpace,
  hasPastEntriesForSpace,
  redo,
  undo
} from '@gamesberry/karmyc-core/store/slices/historySlice';

export const HistoryDrawingArea = ({ id, viewport }) => {
  // ...

  // Check if undo/redo is possible for the current space
  const canUndo = useSelector((state) =>
    hasPastEntriesForSpace(state, currentSpaceId ?? null)
  );
  const canRedo = useSelector((state) =>
    hasFutureEntriesForSpace(state, currentSpaceId ?? null)
  );

  // Record an action in history (e.g., adding a line)
  const handleMouseUp = () => {
    // ...
    const newLine = { /* ... */ };

    // Store the state before and after the action
    const prevSharedState = currentSpaceSharedState ?? { /* ... */ };
    const nextSharedState = {
      ...prevSharedState,
      drawingLines: [...(prevSharedState.drawingLines ?? []), newLine]
    };

    // Apply the action
    dispatch(addDrawingLineToSpace({ spaceId: currentSpaceId, line: newLine }));

    // Record in history
    dispatch(addHistoryEntry({
      name: 'drawing/addLine',
      prevState: prevSharedState,
      nextState: nextSharedState,
      metadata: { spaceId: currentSpaceId }
    }));
  };

  // Handle undo for the current space
  const handleUndo = () => {
    if (currentSpaceId) {
      dispatch(undo({ spaceId: currentSpaceId }));
    }
  };

  // Handle redo for the current space
  const handleRedo = () => {
    if (currentSpaceId) {
      dispatch(redo({ spaceId: currentSpaceId }));
    }
  };

  // ...
};
```

This component illustrates several key concepts:
- Separate history per space (spaceId)
- Recording before/after states for each action
- Checking the availability of undo/redo actions
- Handling different types of actions (drawing, changing thickness, clearing)

## Best Practices

1.  **Atomic Actions**: Design your actions to be atomic and reversible.
2.  **Clear Descriptions**: Use clear descriptions for actions.
3.  **Limit Size**: Limit the history size to avoid performance issues.
4.  **Diff Optimization**: Use tools like Immer to generate efficient diffs.
5.  **Contextual History**: Use the history-per-space system for finer management.
6.  **Useful Metadata**: Include relevant metadata in history entries.
