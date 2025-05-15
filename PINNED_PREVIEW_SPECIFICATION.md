# Feature Specification: Pinned Drag Previews

## 1. Introduction

This document outlines the specifications for implementing a "Pinned Preview" feature in Karmyc. The goal is to allow users to keep the visual preview component, which normally appears during a drag-and-drop operation, visible on the screen even after the drag operation completes. This allows users to keep a temporary visual reference to an item without altering the main grid layout significantly.

## 2. Core Concept

-   **Pinned Preview:** A visual representation of an item (e.g., an Area) that mirrors the component shown during drag-and-drop, but remains visible on the screen after the drop.
-   **Trigger:** The user explicitly chooses to "pin" the preview during a drag operation using a specific modifier key (`Ctrl`).
-   **Decoupling:** Pinned previews are rendered outside the main grid structure, potentially in a floating layer or a dedicated container.
-   **Data Link:** Each pinned preview remains linked to the data of the original item it represents.
-   **Transience:** Pinned previews are intended as temporary references and can be closed individually by the user.
-   **Screen Specific:** Pinned previews are specific to the active "Screen" (workspace).

## 3. State Management (Zustand)

The state for pinned previews will be managed within the `ScreenState` for each active screen in the Zustand store.

### 3.1. Additions to `ScreenState`

Add the following fields to the `ScreenState` interface:

```typescript
// Information stored for each pinned preview
interface PinnedPreviewInfo {
  itemId: string; // ID of the item (e.g., Area ID) being previewed
  // Optional: Add position if pinned previews should be movable/placed specifically
  // position?: { x: number; y: number };
}

// Extend the existing ScreenState
interface ScreenState {
  // ... existing states (areas, settings, history, etc.) ...

  // Manages the currently pinned drag previews for this screen
  // Keyed by itemId for easy lookup and removal.
  pinnedPreviews: Record<string, PinnedPreviewInfo>;
}
```

-   `pinnedPreviews` defaults to an empty object `{}`.

### 3.2. New Store Actions

Add the following actions to the `RootState` (accessible via the Zustand hook), ensuring they operate on the `activeScreenId`:

```typescript
interface RootState {
  // ... existing state and actions ...

  // Actions for managing pinned previews
  pinDraggedPreview: (itemId: string /*, initialPosition?: { x: number; y: number } */) => void;
  unpinPreview: (itemId: string) => void;
  // Optional: updatePinnedPreviewPosition: (itemId: string, newPosition: { x: number; y: number }) => void;
}

// Implementation within create( ... (set, get) => ({ ... }) ... ):

  pinDraggedPreview: (itemId /*, initialPosition */) => set((state) => {
    const activeScreenId = state.activeScreenId;
    const activeScreen = state.screens[activeScreenId];
    // Prevent pinning if item ID is invalid or already pinned for this screen
    if (!activeScreen || !itemId || activeScreen.pinnedPreviews[itemId]) return {};

    const newPinInfo: PinnedPreviewInfo = { itemId /*, position: initialPosition */ };

    return {
      screens: {
        ...state.screens,
        [activeScreenId]: {
          ...activeScreen,
          pinnedPreviews: {
            ...activeScreen.pinnedPreviews,
            [itemId]: newPinInfo, // Add the item to the pinned set
          },
        },
      },
    };
  }),

  unpinPreview: (itemId) => set((state) => {
    const activeScreenId = state.activeScreenId;
    const activeScreen = state.screens[activeScreenId];
    // Prevent unpinning if item ID is invalid or not currently pinned
    if (!activeScreen || !itemId || !activeScreen.pinnedPreviews[itemId]) return {};

    // Create a new object excluding the item to be unpinned
    const { [itemId]: _, ...remainingPreviews } = activeScreen.pinnedPreviews;

    return {
      screens: {
        ...state.screens,
        [activeScreenId]: {
          ...activeScreen,
          pinnedPreviews: remainingPreviews,
        },
      },
    };
  }),

  // updatePinnedPreviewPosition: (...) => { /* Logic to update position if implemented */},
```

## 4. Mechanism for Pinning (Ctrl + Drag)

The user initiates the pinning of a drag preview by holding down the **`Ctrl`** key while releasing the mouse button to complete a drag-and-drop operation.

### 4.1. Integration with Drag-and-Drop Library

-   Modification is required within the event handler that signals the end of a drag operation (e.g., `onDragEnd` in `dnd-kit`, or the `drop` handler in `react-dnd`).
-   This handler must access the browser's native event object to check the status of the `Ctrl` key.

### 4.2. Modified `onDragEnd` / Drop Logic

The logic within the drag end handler should follow this pattern:

```javascript
function handleDragEnd(event) { // 'event' structure depends on the DnD library
  const draggedItemId = event.active.id; // Assuming ID is available on 'active'

  // Access the underlying browser event to check ctrlKey.
  // This detail depends on the DnD library implementation.
  const isCtrlPressed = event.originalEvent?.ctrlKey || /* other method if needed */;

  if (isCtrlPressed) {
    // --- Pinning Logic ---
    // Prevent the default DnD move/reorder action if it would normally occur.
    // event.preventDefault?.(); // Call if necessary for the library

    // Call the Zustand action to pin the item's preview.
    useStore.getState().pinDraggedPreview(draggedItemId);

    // (Optional position logic would go here if needed)

    // IMPORTANT: Explicitly DO NOT execute the standard item move/reorder logic.
    return; // Exit early or structure logic to skip the standard path.

  } else {
    // --- Standard Drop Logic ---
    // This block contains the original code that handles moving or reordering
    // the item within the grid or performing the default drop action.
    // Example: handleMoveItem(draggedItemId, event.over?.id);
  }
}
```

-   The key is that holding `Ctrl` diverts the flow to call `pinDraggedPreview` *instead of* executing the standard drop behavior.

## 5. Rendering Pinned Previews

### 5.1. `PinnedPreviewsContainer` Component

-   A new React component (e.g., `PinnedPreviewsContainer.tsx`) should be created and placed high in the component tree, outside the main grid layout, likely using fixed or absolute positioning to overlay the main content area.
-   This component subscribes to the Zustand store (`useStore`).
-   It selects the `pinnedPreviews` object from the active screen's state (`state.screens[state.activeScreenId].pinnedPreviews`).
-   It iterates over the `itemId`s in the `pinnedPreviews` object.

### 5.2. Rendering Individual Previews

-   For each `itemId` in `pinnedPreviews`:
    -   The container fetches the full data for that item using appropriate selectors (e.g., `selectAreaById(itemId)`).
    -   It renders the **same preview component** that is used during the drag-and-drop operation, passing the necessary item data to it.
    -   Each rendered pinned preview **must include a close button ('X')**.
    -   Clicking the close button on a pinned preview must call the `unpinPreview(itemId)` action with the corresponding item's ID.

## 6. Interaction with Original Item

-   Pinning a preview does not remove or change the original item in the grid. The pinned preview is an additional, temporary view.
-   **Synchronization:** If the data of the original item changes, the pinned preview should ideally update to reflect these changes (this depends on how the preview component gets its data - if it uses live selectors, this might happen automatically).
-   **Deletion Handling:** When an item is deleted from the main application state (e.g., an Area is removed), the system should also ensure its corresponding preview, if pinned, is removed. This can be done by:
    -   Modifying the item deletion action in the store to also check and dispatch `unpinPreview(deletedItemId)` if necessary.
    -   Alternatively, the `PinnedPreviewsContainer` could filter out previews whose `itemId` no longer corresponds to a valid item in the main state, although this is less clean.

## 7. Persistence

-   The `pinnedPreviews` state is part of the `ScreenState`.
-   Assuming the Zustand store uses the `persist` middleware, the state of pinned previews for each screen will be automatically saved to and loaded from storage along with the rest of the application state. No specific persistence logic is required for this feature itself.

## 8. Implementation Steps (Recommendation)

1.  **State & Actions:** Add `pinnedPreviews` to `ScreenState` and implement `pinDraggedPreview`, `unpinPreview` actions in the Zustand store.
2.  **Modify Drag End Logic:** Integrate the `Ctrl + Drag` detection into your DnD library's `onDragEnd` (or equivalent) handler to call `pinDraggedPreview`.
3.  **Container Component:** Create the `PinnedPreviewsContainer` component. Implement its subscription to the store to get `pinnedPreviews`.
4.  **Render Previews:** Inside the container, iterate `pinnedPreviews`, fetch item data, and render the *existing* drag preview component for each.
5.  **Add Close Button:** Ensure each rendered pinned preview has a functional close button calling `unpinPreview`.
6.  **Deletion Sync:** Update item deletion logic to also call `unpinPreview` for the deleted item's ID.
7.  **Styling & Positioning:** Style the container and the pinned previews appropriately (e.g., position, z-index).
8.  **Testing:** Test pinning via `Ctrl + Drag`, closing previews, persistence across reloads, behavior across screen switches, and automatic unpinning when the original item is deleted. 
