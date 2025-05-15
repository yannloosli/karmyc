# Karmyc Multi-Screen Feature Specification

## 1. Introduction

This document outlines the technical specifications for implementing a multi-screen (multi-workspace) feature in Karmyc. The goal is to allow users to manage multiple independent application states, referred to as "Screens," within a single Karmyc instance, similar to virtual desktops or workspaces.

## 2. Core Concept

-   **Screen:** A "Screen" represents a complete, independent instance of the user's data state (areas, settings, history, etc.). Each screen has a unique identifier (a sequential number starting from 1).
-   **Switching:** Users can switch between Screens using a dedicated UI component. All data displayed and modified pertains to the currently active Screen.
-   **Creation:** Users can create new Screens on demand. Each new screen starts with a default initial state.

## 3. Data Storage and State Management (Zustand)

The core implementation relies on refactoring the Zustand store to manage a collection of Screen states.

### 3.1. Store State Structure

The root state of the Zustand store will be modified as follows:

```typescript
// Interface for the state of a single screen
interface ScreenState {
  areas: AreaSliceState;
  settings: SettingsSliceState;
  history: HistorySliceState; // Manages undo/redo for this specific screen
  // ... other slices composing a single workspace state
}

// New root state structure
interface RootState {
  // Collection of all screens, keyed by their ID (e.g., '1', '2')
  screens: Record<string, ScreenState>;
  // ID of the currently active/visible screen
  activeScreenId: string;
  // Counter to generate unique IDs for new screens
  nextScreenId: number;

  // Actions for managing screens (see below)
  addScreen: () => void;
  switchScreen: (screenId: string) => void;
  // removeScreen: (screenId: string) => void; // Optional: To be implemented if needed

  // Actions from original slices, adapted to work on the active screen
  // (Structure depends on slice implementation)
  // Example:
  // ...AdaptedAreaSliceActions;
  // ...AdaptedSettingsSliceActions;
}

// Helper function to generate the initial state for a new screen
const createInitialScreenState = (): ScreenState => {
  return {
    areas: initialAreaState,
    settings: initialSettingsState,
    history: initialHistoryState, // Ensure history is reset/initialized per screen
    // ... initialize other slices
  };
};
```

-   The store will be initialized with one default screen (`id: '1'`).
-   `activeScreenId` will default to `'1'`.
-   `nextScreenId` will start at `2`.

### 3.2. Store Actions

#### 3.2.1. Screen Management Actions

-   `addScreen()`:
    -   Generates a new `screenId` using `nextScreenId`.
    -   Creates a new `ScreenState` using `createInitialScreenState()`.
    -   Adds the new screen to the `screens` object.
    -   Increments `nextScreenId`.
    -   Sets the `activeScreenId` to the newly created screen's ID.
-   `switchScreen(screenId: string)`:
    -   Checks if `screenId` exists in `screens`.
    -   If it exists, updates `activeScreenId` to `screenId`.
-   `removeScreen(screenId: string)` (Optional):
    -   Removes the screen from the `screens` object.
    -   Handles edge cases:
        -   Cannot remove the last remaining screen.
        -   If the active screen is removed, switch `activeScreenId` to another existing screen (e.g., the previous or next one).

#### 3.2.2. Adapting Slice Actions

-   **Crucial Change:** All existing actions defined within slices (e.g., in `slices/areas.ts`) **must** be refactored.
-   Instead of directly modifying their own state part (e.g., `state.areas`), they must:
    1.  Get the `activeScreenId` using `get().activeScreenId`.
    2.  Get the state of the active screen: `get().screens[activeScreenId]`.
    3.  Perform the state update logic on the relevant part of *that specific screen's state* (e.g., `activeScreen.areas`).
    4.  Use `set()` to update the `screens` object with the modified state for the `activeScreenId`.
-   This typically involves defining slices using the `StateCreator` pattern, receiving `set` and `get` from the root store, as shown in the Zustand documentation for slices.

### 3.3. Selectors

-   All existing selectors must be updated to retrieve data from the currently active screen.
-   They should first get the `activeScreenId` from the state, then access `state.screens[activeScreenId]`, and finally select the desired data from within that screen's state.

```typescript
// Example adapted selector
const selectActiveScreen = (state: RootState) => state.screens[state.activeScreenId];

const selectAllAreas = (state: RootState) => {
   const activeScreen = selectActiveScreen(state);
   // Handle potential case where active screen might not exist transiently
   return activeScreen ? activeScreen.areas.list : [];
}
```

## 4. UI Component (`ScreenSwitcher`)

-   **Location:** Integrated into the application's main status bar, likely on the right side.
-   **Appearance:**
    -   Displays a list of clickable buttons/tabs, each showing a screen number (corresponding to the keys in `RootState.screens`).
    -   Highlights the button corresponding to `RootState.activeScreenId`.
    -   Includes a "+" button to add a new screen.
-   **Functionality:**
    -   Clicking a screen number button calls the `switchScreen(screenId)` action with the corresponding ID.
    -   Clicking the "+" button calls the `addScreen()` action.
-   **Implementation:** A React component using the Zustand hook (`useStore`) to access `screens`, `activeScreenId`, `switchScreen`, and `addScreen`.

## 5. Persistence

-   If using `zustand/middleware/persist`, the middleware should automatically handle persisting the new `RootState` structure (including `screens`, `activeScreenId`, `nextScreenId`) as long as the entire state is serializable.
-   The persistence key (e.g., `karmyc-storage`) remains the same. The saved data will now contain the nested structure for all screens.

## 6. History (Undo/Redo)

-   The current undo/redo mechanism (e.g., `undoable.ts`, potentially using `zustand-middleware-undo`) needs careful adaptation.
-   **Requirement:** Undo/Redo operations must function independently for each screen. Undoing an action on Screen 1 should not affect Screen 2.
-   **Implementation:** This likely involves applying the undo middleware *within* the state definition of each `ScreenState`, rather than applying it globally to the `RootState`. The exact implementation depends heavily on the specifics of the `undoable.ts` middleware. Each `ScreenState` might need its own `_history` object managed by the middleware.

## 7. Impact on Existing Code

-   **Store:** Significant refactoring required for the store structure, slice definitions, actions, and selectors.
-   **Components:** Components directly using Zustand selectors *should* automatically react to screen changes once selectors are updated. Components calling actions might not need changes if the action signature remains the same, but the action's *implementation* changes significantly.
-   **Hooks:** Any custom hooks interacting with the store will need review and potential updates.

## 8. Implementation Steps (Recommendation)

1.  **Backup:** Ensure the current codebase is backed up / version controlled.
2.  **State Refactor:** Modify the main store (`create` call) to implement the new `RootState` structure (`screens`, `activeScreenId`, `nextScreenId`). Define `ScreenState` and `createInitialScreenState`.
3.  **Base Actions:** Implement `addScreen` and `switchScreen` actions.
4.  **Adapt One Slice:** Choose a relatively simple slice (e.g., settings). Refactor its actions and selectors to work with the active screen concept. Test thoroughly.
5.  **Adapt Remaining Slices:** Refactor the other slices one by one.
6.  **Adapt History:** Modify the undo/redo middleware integration to work on a per-screen basis. This might be complex.
7.  **UI Component:** Create the `ScreenSwitcher` React component and integrate it into the status bar.
8.  **Testing:** Perform extensive testing of screen switching, data isolation between screens, action correctness, persistence, and undo/redo functionality on each screen. 
