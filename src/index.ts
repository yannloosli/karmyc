// Core
export * from './core';
export type { CoreSlice } from './core/slices/core-slice';
export type { ContextMenuSlice } from './core/slices/context-menu-slice';
export type { ScreensSlice } from './core/slices/screens-slice';
export type { AreasSlice } from './core/slices/areas-slice';
export type { ActionRegistry } from './core/registries/actionRegistry';
export type { keyboardShortcutRegistry } from './core/registries/keyboardShortcutRegistry';

// Components
export * from './components';
export type { Props as AreaErrorBoundaryProps, State as AreaErrorBoundaryState } from './components/AreaErrorBoundary';
export type { AreaPreviewProps } from './components/AreaPreview';
export type { OwnProps as AreaRowSeparatorsProps } from './components/AreaRowSeparators';
export type { AreaStackProps } from './components/AreaStack';
export type { AreaTabsProps } from './components/AreaTabs';
export type { OwnProps as AreaToOpenPreviewProps } from './components/AreaToOpenPreview';
export type { DropZoneProps } from './components/DropZone';
export type { Props as JoinAreaPreviewProps } from './components/JoinAreaPreview';
export type { ToolsProps } from './components/ToolsSlot';

// Hooks
export { useArea } from './hooks/useArea';
export { useAreaDragAndDrop } from './hooks/useAreaDragAndDrop';
export { useRegisterAreaType } from './hooks/useRegisterAreaType';
export { useSpace } from './hooks/useSpace';
export { useKarmyc } from './hooks/useKarmyc';
export { usePluginSystem } from './hooks/usePluginSystem';
export type { ZustandPlugin } from './hooks/usePluginSystem';
export { useSpaceHistory } from './hooks/useSpaceHistory';
export type { UseSpaceHistoryOptions } from './hooks/useSpaceHistory';
export { useContextMenu } from './hooks/useContextMenu';
export { useAreaKeyboardShortcuts } from './hooks/useAreaKeyboardShortcuts';

// Store
export * from './core/store';

// Utils
export * from './utils';

// Types
export type { PlaceArea } from './core/types/areas-type';
export type { Space } from './core/spaceStore';
export type { THistoryDiff } from './types/historyTypes';

// Providers
export * from './core/KarmycCoreProvider'; 
