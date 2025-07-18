# API Reference - Karmyc Core

## Overview

This document provides a comprehensive reference for all the hooks, components, and types available in Karmyc Core.

## Core Hooks

### `useKarmyc(options, onError?)`

Initializes the Karmyc system with configuration options.

```typescript
function useKarmyc(
  options: IKarmycOptions,
  onError?: (error: Error) => void
): IKarmycConfigWithLayouts
```

#### Parameters
- `options: IKarmycOptions` - Configuration object for the Karmyc system
- `onError?: (error: Error) => void` - Optional error handler

#### Returns
- `IKarmycConfigWithLayouts` - The processed configuration object

#### Configuration Interface
```typescript
interface IKarmycOptions {
  plugins?: IActionPlugin[];
  validators?: Array<{
    actionType: string;
    validator: (action: any) => { valid: boolean; message?: string };
  }>;
  initialAreas?: IArea[];
  keyboardShortcutsEnabled?: boolean;
  resizableAreas?: boolean;
  manageableAreas?: boolean;
  multiScreen?: boolean;
  allowStackMixedRoles?: boolean;
  builtInLayouts?: LayoutPreset[];
  initialLayout?: string;
  t?: (key: string, fallback: string) => string;
  spaces?: Record<string, ISpace>;
}
```

#### Example
```typescript
const config = useKarmyc({
  plugins: [],
  validators: [],
  initialAreas: [
    { id: 'area-1', type: 'my-area', state: {}, role: 'SELF' }
  ],
  keyboardShortcutsEnabled: true,
  builtInLayouts: [],
  initialLayout: 'default',
  resizableAreas: true,
  manageableAreas: true,
  multiScreen: true,
  allowStackMixedRoles: false
});
```

### `useArea()`

Provides functions to manipulate areas and access their state.

```typescript
function useArea(): {
  createArea: (type: AreaTypeValue, state: any, position?: Position, id?: string) => string;
  removeArea: (id: string) => void;
  setActive: (id: string | null) => void;
  update: (id: string, changes: Partial<IArea<AreaTypeValue>>) => void;
  getActive: () => IArea | null;
  getById: (id: string) => IArea | null;
  getAll: () => IArea[];
  getErrors: () => string[];
}
```

#### Returns
- `createArea` - Function to create a new area
- `removeArea` - Function to remove an area
- `setActive` - Function to set the active area
- `update` - Function to update an area
- `getActive` - Function to get the active area
- `getById` - Function to get an area by ID
- `getAll` - Function to get all areas
- `getErrors` - Function to get area errors

#### Example
```typescript
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
const areaId = createArea('my-area', { data: 'value' });

// Get area by ID
const area = getById(areaId);

// Update area
update(areaId, { state: { newData: 'updated' } });
```

### `useSpace()`

Access state for spaces. Returns all spaces and the active space.

```typescript
function useSpace(): {
  spaces: Record<string, Space>;
  activeSpaceId: string | null;
  getSpaceById: (id: string) => Space | undefined;
}
```

#### Returns
- `spaces: Record<string, Space>` - All spaces
- `activeSpaceId: string | null` - Currently active space ID
- `getSpaceById: (id: string) => Space | undefined` - Function to get a specific space

#### Example
```typescript
const { spaces, activeSpaceId, getSpaceById } = useSpace();
const activeSpace = activeSpaceId ? getSpaceById(activeSpaceId) : null;
```

### `useEnhancedHistory(spaceId: string)`

Access enhanced history functionality for undo/redo operations.

```typescript
function useEnhancedHistory(spaceId: string): {
  // State
  isActionInProgress: boolean;
  currentActionId: string | null;
  lastAction: EnhancedHistoryAction | null;
  stats: HistoryStats;
  
  // Actions
  startAction: (name: string) => void;
  submitAction: () => void;
  cancelAction: () => void;
  undo: () => void;
  redo: () => void;
  
  // Utility actions
  createSimpleAction: (name: string) => HistoryResult;
  createSelectionAction: (name: string, selection: any) => HistoryResult;
  createTransformAction: (name: string, transform: any) => HistoryResult;
  
  // Checks
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Getters
  getCurrentAction: () => EnhancedHistoryAction | null;
  getHistoryLength: () => number;
  getHistoryStats: () => HistoryStats;
  
  // Management
  clearHistory: () => void;
  updateSelectionState: (selection: any) => void;
}
```

#### Parameters
- `spaceId: string` - Space identifier for the history

#### Example
```typescript
const history = useEnhancedHistory('space-1');

// Start a new action
history.startAction('Update Area');

// Make changes
updateAreaState();

// Submit the action
history.submitAction();

// Undo/Redo
if (history.canUndo()) {
  history.undo();
}
```

### `useRegisterAreaType(type, component, initialState, options)`

Register a new area type in the system.

```typescript
function useRegisterAreaType<T>(
  type: string,
  component: React.ComponentType<AreaComponentProps<T>>,
  initialState: T,
  options: AreaTypeOptions
): void
```

#### Parameters
- `type: string` - Unique identifier for the area type
- `component: React.ComponentType<AreaComponentProps<T>>` - React component to render
- `initialState: T` - Initial state for areas of this type
- `options: AreaTypeOptions` - Configuration options

#### AreaTypeOptions Interface
```typescript
interface AreaTypeOptions {
  displayName: string;
  role: AREA_ROLE;
  icon: React.ComponentType;
}
```

#### Example
```typescript
useRegisterAreaType(
  'my-area',
  MyAreaComponent,
  { initialData: 'default value' },
  {
    displayName: 'My Area',
    role: AREA_ROLE.LEAD,
    icon: MyIcon
  }
);
```

### `usePluginSystem(store, plugins)`

Initialize and manage plugins.

```typescript
function usePluginSystem(
  store: StoreApi<any>,
  plugins: Plugin[]
): PluginSystem
```

#### Parameters
- `store: StoreApi<any>` - Zustand store instance
- `plugins: Plugin[]` - Array of plugins to initialize

#### Example
```typescript
const pluginSystem = usePluginSystem(spaceStore, [myPlugin]);
```

## Additional Hooks

### `useAreaDragAndDrop(areaId)`

Provides drag and drop functionality for areas.

```typescript
function useAreaDragAndDrop(areaId: string): {
  isDragging: boolean;
  dragPreview: React.ReactNode | null;
  handleDragStart: (event: DragEvent) => void;
  handleDragEnd: (event: DragEvent) => void;
}
```

#### Parameters
- `areaId: string` - ID of the area to enable drag and drop for

#### Example
```typescript
const {
  isDragging,
  dragPreview,
  handleDragStart,
  handleDragEnd
} = useAreaDragAndDrop('area-1');
```

### `useAreaOptimized()`

Optimized hook for area management with enhanced performance through specialized hooks and Zustand selectors.

```typescript
function useAreaOptimized(): {
  // Basic actions
  createArea: (type: AreaTypeValue, state: any, position?: AreaPosition, id?: string) => string;
  removeArea: (id: string) => void;
  setActive: (id: string | null) => void;
  update: (id: string, changes: Partial<IArea<AreaTypeValue>>) => void;
  
  // Direct store actions
  addArea: (area: IArea) => string;
  setActiveArea: (id: string | null) => void;
  updateArea: (changes: Partial<IArea>) => void;
  updateLayout: (layout: any) => void;
  setAreaToOpen: (area: any) => void;
  updateAreaToOpenPosition: (position: any) => void;
  finalizeAreaPlacement: () => void;
  cleanupTemporaryStates: () => void;
  setJoinPreview: (preview: any) => void;
  joinOrMoveArea: (data: any) => void;
  splitArea: (areaId: string, direction: string) => void;
  setRowSizes: (rowId: string, sizes: number[]) => void;
  setViewports: (viewports: any) => void;
}
```

#### Example
```typescript
const {
  createArea,
  removeArea,
  setActive,
  update,
  splitArea,
  setRowSizes
} = useAreaOptimized();

// Create a new area
const areaId = createArea('my-area', { data: 'value' });

// Split an area
splitArea(areaId, 'horizontal');
```

### Specialized Area Hooks

The optimized area system provides granular hooks for specific data access, reducing unnecessary re-renders:

#### `useAreaById(areaId)`

Get a specific area by ID with optimized selector.

```typescript
function useAreaById(areaId: string): IArea | undefined
```

#### `useAreaLayoutById(areaId)`

Get the layout of a specific area.

```typescript
function useAreaLayoutById(areaId: string): AreaLayout | undefined
```

#### `useActiveArea()`

Get the currently active area.

```typescript
function useActiveArea(): IArea | null
```

#### `useAllAreas()`

Get all areas in the current screen.

```typescript
function useAllAreas(): Record<string, IArea>
```

#### `useAllLayouts()`

Get all area layouts.

```typescript
function useAllLayouts(): Record<string, AreaLayout>
```

#### `useAreaErrors()`

Get area-related errors.

```typescript
function useAreaErrors(): string[]
```

#### `useRootArea()`

Get the root area of the current screen.

```typescript
function useRootArea(): IArea | null
```

#### `useRootAreaLayout()`

Get the root area layout.

```typescript
function useRootAreaLayout(): AreaLayout | null
```

#### `useAreaViewports()`

Get area viewports.

```typescript
function useAreaViewports(): Record<string, Viewport>
```

#### `useAreaToOpen()`

Get the area to be opened.

```typescript
function useAreaToOpen(): AreaToOpen | null
```

#### `useJoinPreview()`

Get the join preview state.

```typescript
function useJoinPreview(): JoinPreview | null
```

#### `useActiveScreenId()`

Get the active screen ID.

```typescript
function useActiveScreenId(): string
```

#### `useAreaActions()`

Get all area actions from the store.

```typescript
function useAreaActions(): AreaActions
```

#### Usage Examples

```typescript
import { 
  useAreaById, 
  useActiveArea, 
  useAllAreas,
  useAreaActions 
} from '@gamesberry/karmyc-core';

function MyComponent() {
  // Get specific area (only re-renders when this area changes)
  const area = useAreaById('area-1');
  
  // Get active area (only re-renders when active area changes)
  const activeArea = useActiveArea();
  
  // Get all areas (only re-renders when areas object changes)
  const allAreas = useAllAreas();
  
  // Get actions (stable reference, no re-renders)
  const actions = useAreaActions();
  
  return (
    <div>
      {area && <div>Area: {area.type}</div>}
      {activeArea && <div>Active: {activeArea.id}</div>}
      <button onClick={() => actions.setActiveArea('area-2')}>
        Set Active
      </button>
    </div>
  );
}
```

### `useResizePreview()`

Provides resize preview functionality for area row separators.

```typescript
function useResizePreview(): {
  resizePreview: ResizePreviewState | null;
  setResizePreview: (preview: ResizePreviewState | null) => void;
  useOptimizedSizes: (row: AreaRowLayout, fallbackSizes?: number[]) => number[];
  getSeparatorPosition: (row: AreaRowLayout, separatorIndex: number, totalWidth: number, isHorizontal: boolean) => number;
  calculateSizesFromPreview: (row: AreaRowLayout, preview: ResizePreviewState) => number[];
  normalizeSizes: (sizes: number[]) => number[];
}
```

#### Types
```typescript
interface ResizePreviewState {
  rowId: string;
  separatorIndex: number;
  t: number;
}
```

#### Example
```typescript
const {
  resizePreview,
  setResizePreview,
  useOptimizedSizes,
  getSeparatorPosition
} = useResizePreview();

// Set resize preview
setResizePreview({
  rowId: 'row-1',
  separatorIndex: 1,
  t: 0.6
});

// Get optimized sizes
const sizes = useOptimizedSizes(row, [0.5, 0.5]);
```

#### Example
```typescript
const { showPreview, hidePreview, previewState } = useResizePreview();
```

### `useContextMenu()`

Provides context menu functionality.

```typescript
function useContextMenu(): {
  showContextMenu: (event: MouseEvent, items: ContextMenuItem[]) => void;
  hideContextMenu: () => void;
}
```

#### Example
```typescript
const { showContextMenu, hideContextMenu } = useContextMenu();
```

### `useAreaKeyboardShortcuts(areaId)`

Provides keyboard shortcuts for areas.

```typescript
function useAreaKeyboardShortcuts(areaId: string): void
```

#### Parameters
- `areaId: string` - ID of the area

### `useScreenManagement()`

Provides screen management functionality.

```typescript
function useScreenManagement(): {
  createScreen: () => string;
  removeScreen: (screenId: string) => void;
  switchScreen: (screenId: string) => void;
}
```

### `useAreaStack(areaId)`

Provides area stacking functionality.

```typescript
function useAreaStack(areaId: string): {
  isChildOfStack: boolean;
  stackData: {
    layoutId: string;
    layout: AreaRowLayout;
    areas: Record<string, IArea>;
  } | null;
  firstChildOfRow: string | null;
  lastChildOfRow: string | null;
}
```

#### Parameters
- `areaId: string` - ID of the area to check for stacking

### `useToolsState(areaId?)`

Provides tools state management.

```typescript
function useToolsState(areaId?: string): {
  activeScreenId: string;
  isDetached: boolean;
  multiScreen: boolean;
  currentArea: IArea | undefined;
  currentSpaceId: string | undefined;
  handleFocus: () => void;
  isFullscreen: boolean;
}
```

#### Parameters
- `areaId?: string` - Optional area ID to get tools state for

#### Example
```typescript
const {
  activeScreenId,
  isDetached,
  multiScreen,
  currentArea,
  currentSpaceId,
  handleFocus,
  isFullscreen
} = useToolsState('area-1');
```

### `useSpaceHistory()`

Provides space history functionality.

```typescript
function useSpaceHistory(spaceId: string): {
  history: EnhancedHistoryAction[];
  currentIndex: number;
  undo: () => void;
  redo: () => void;
}
```

### `useEnhancedHistory(spaceId)`

Provides enhanced history functionality with advanced features like action batching, diff tracking, and typed actions.

```typescript
function useEnhancedHistory(spaceId: string): {
  // State
  isActionInProgress: boolean;
  currentActionId: string | null;
  lastAction: EnhancedHistoryAction | null;
  stats: HistoryStats;
  
  // Actions
  startAction: (actionId: string) => HistoryResult;
  submitAction: (name: string, diffs?: Diff[], allowIndexShift?: boolean, modifiedKeys?: string[]) => HistoryResult;
  cancelAction: () => HistoryResult;
  undo: () => HistoryResult;
  redo: () => HistoryResult;
  
  // Utilities
  createSimpleAction: (name: string, diffs?: Diff[], allowIndexShift?: boolean, modifiedKeys?: string[]) => HistoryResult;
  createSelectionAction: (name: string, selectionData: any, diffs?: Diff[]) => HistoryResult;
  createTransformAction: (name: string, transformData: any, diffs?: Diff[]) => HistoryResult;
  
  // Checks
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Getters
  getCurrentAction: () => EnhancedHistoryAction | null;
  getHistoryLength: () => number;
  getHistoryStats: () => HistoryStats;
  
  // Management
  clearHistory: () => void;
  updateSelectionState: (selectionState: any) => void;
}
```

#### Parameters
- `spaceId: string` - Space identifier for the history

#### Example
```typescript
const history = useEnhancedHistory('space-1');

// Create a simple action
const result = history.createSimpleAction('Update Item', [
  {
    type: 'UPDATE',
    path: ['item', 'name'],
    oldValue: 'old name',
    newValue: 'new name'
  }
]);

if (result.success) {
  console.log('Action created:', result.action);
}

// Undo/Redo
if (history.canUndo()) {
  history.undo();
}
```

### `useActiveSpaceHistory()`

Provides enhanced history functionality for the currently active space.

```typescript
function useActiveSpaceHistory(): ReturnType<typeof useEnhancedHistory>
```

### `useTypedHistoryActions(spaceId)`

Provides typed history actions for common operations.

```typescript
function useTypedHistoryActions(spaceId: string): {
  // Basic actions
  create: (data: any) => HistoryResult;
  update: (data: any, diffs?: Diff[]) => HistoryResult;
  delete: (data: any) => HistoryResult;
  move: (data: any, diffs?: Diff[]) => HistoryResult;
  copy: (data: any) => HistoryResult;
  paste: (data: any) => HistoryResult;
  
  // Selection actions
  select: (selectionData: any) => HistoryResult;
  deselect: (selectionData: any) => HistoryResult;
  selectAll: (selectionData: any) => HistoryResult;
  deselectAll: (selectionData: any) => HistoryResult;
  
  // Group actions
  group: (groupData: any, diffs?: Diff[]) => HistoryResult;
  ungroup: (groupData: any, diffs?: Diff[]) => HistoryResult;
  
  // Transform actions
  transform: (transformData: any, diffs?: Diff[]) => HistoryResult;
  rotate: (rotateData: any, diffs?: Diff[]) => HistoryResult;
  scale: (scaleData: any, diffs?: Diff[]) => HistoryResult;
  translate: (translateData: any, diffs?: Diff[]) => HistoryResult;
  
  // Timeline actions
  timelineUpdate: (timelineData: any, diffs?: Diff[]) => HistoryResult;
  keyframeAdd: (keyframeData: any, diffs?: Diff[]) => HistoryResult;
  keyframeRemove: (keyframeData: any, diffs?: Diff[]) => HistoryResult;
  keyframeUpdate: (keyframeData: any, diffs?: Diff[]) => HistoryResult;
  
  // Custom actions
  custom: (name: string, data: any, diffs?: Diff[]) => HistoryResult;
}
```

### `useActiveSpaceTypedActions()`

Provides typed history actions for the currently active space.

```typescript
function useActiveSpaceTypedActions(): ReturnType<typeof useTypedHistoryActions>
```

## Core Components

### `KarmycCoreProvider`

Main provider that sets up the Karmyc environment.

```tsx
interface KarmycCoreProviderProps {
  children: React.ReactNode;
  options?: IKarmycOptions;
  customStore?: any;
  onError?: (error: Error) => void;
}

<KarmycCoreProvider options={config}>
  {children}
</KarmycCoreProvider>
```

### `Karmyc`

Primary component that renders layouts and areas.

```tsx
interface KarmycProps {
  offset?: number;
}

<Karmyc offset={TOOLBAR_HEIGHT} />
```

### `ToolsSlot`

System for injecting components into predefined UI slots.

```tsx
interface ToolsSlotProps {
  areaType: string;
  children: React.ReactNode;
}

<Tools areaType="app">
  <Karmyc />
</Tools>
```

### `AreaErrorBoundary`

Error boundary for area components.

```tsx
interface AreaErrorBoundaryProps {
  areaId: string;
  children: React.ReactNode;
}

<AreaErrorBoundary areaId="area-1">
  <MyAreaComponent />
</AreaErrorBoundary>
```

### `AreaTabs`

Tabbed interface for areas.

```tsx
interface AreaTabsProps {
  areas: IArea[];
  onTabChange?: (areaId: string) => void;
}

<AreaTabs areas={areas} onTabChange={handleTabChange} />
```

### `ScreenSwitcher`

Component for switching between screens.

```tsx
<ScreenSwitcher />
```

### `AreaStack`

Component for stacked areas.

```tsx
interface AreaStackProps {
  areas: IArea[];
}

<AreaStack areas={areas} />
```

### `AreaPreview`

Preview component for areas.

```tsx
interface AreaPreviewProps {
  area: IArea;
}

<AreaPreview area={area} />
```

### `AreaToOpenPreview`

Preview component for areas to be opened.

```tsx
interface AreaToOpenPreviewProps {
  area: IArea;
}

<AreaToOpenPreview area={area} />
```

### `JoinAreaPreview`

Preview component for joining areas.

```tsx
interface JoinAreaPreviewProps {
  sourceArea: IArea;
  targetArea: IArea;
}

<JoinAreaPreview sourceArea={sourceArea} targetArea={targetArea} />
```

### `DropZone`

Drop zone component for drag and drop.

```tsx
interface DropZoneProps {
  onDrop: (areaId: string) => void;
  children: React.ReactNode;
}

<DropZone onDrop={handleDrop}>
  {children}
</DropZone>
```

### `AreaRowSeparators`

Component for area row separators.

```tsx
interface AreaRowSeparatorsProps {
  rowId: string;
  orientation: 'horizontal' | 'vertical';
}

<AreaRowSeparators rowId={rowId} orientation="horizontal" />
```

### `KeyboardShortcutsViewer`

Component for displaying keyboard shortcuts.

```tsx
<KeyboardShortcutsViewer />
```

### `DetachedWindowCleanup`

Component for cleaning up detached windows.

```tsx
<DetachedWindowCleanup />
```

### `KarmycNextWrapper`

Wrapper component for Next.js compatibility.

```tsx
interface KarmycNextWrapperProps {
  children: React.ReactNode;
}

<KarmycNextWrapper>
  {children}
</KarmycNextWrapper>
```

## Menu Components

### `ContextMenu`

Main context menu component.

```tsx
<ContextMenu />
```

### `SwitchAreaTypeContextMenu`

Context menu for switching area types.

```tsx
interface SwitchAreaTypeContextMenuProps {
  areaId: string;
  currentType: string;
  availableTypes: string[];
  onTypeChange: (newType: string) => void;
}

<SwitchAreaTypeContextMenu
  areaId="area-1"
  currentType="my-area"
  availableTypes={['my-area', 'other-area']}
  onTypeChange={handleTypeChange}
/>
```

### `SpaceMenu`

Menu for space management.

```tsx
<SpaceMenu />
```

### `LayoutMenu`

Menu for layout management.

```tsx
<LayoutMenu />
```

## Types

### Core Types

```typescript
interface IArea<T = any> {
  id: string;
  type: AreaTypeValue;
  state: T;
  position?: Position;
  spaceId?: string;
}

interface Position {
  x: number;
  y: number;
}

interface Space {
  id: string;
  name: string;
  sharedState: Record<string, any>;
}

interface LayoutPreset {
  id: string;
  name: string;
  config: LayoutConfig;
  isBuiltIn: boolean;
}

interface LayoutConfig {
  _id: number;
  rootId: string | null;
  errors: string[];
  activeAreaId: string | null;
  joinPreview: any | null;
  layout: Record<string, any>;
  areas: Record<string, any>;
  viewports: Record<string, any>;
  areaToOpen: any | null;
  lastSplitResultData: any | null;
  lastLeadAreaId: string | null;
}
```

### Area Component Props

```typescript
interface AreaComponentProps<T = any> {
  areaId: string;
  areaState: T;
  width: number;
  height: number;
  left: number;
  top: number;
}
```

### Enhanced History Types

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

interface HistoryStats {
  totalActions: number;
  undoableActions: number;
  redoableActions: number;
}

interface HistoryResult {
  success: boolean;
  actionId?: string;
  error?: string;
}
```

### Plugin Types

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

## Constants

```typescript
enum AREA_ROLE {
  LEAD = 'LEAD',
  FOLLOW = 'FOLLOW',
  SELF = 'SELF'
}

const TOOLBAR_HEIGHT = 40;
```
