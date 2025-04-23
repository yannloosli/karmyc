import { AnyAction } from '@reduxjs/toolkit';
import { StateWithHistory } from 'redux-undo';

/**
 * Base type for an area
 */
export interface IArea {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    size: {
        width: number;
        height: number;
    };
    zIndex: number;
    isVisible: boolean;
    isActive: boolean;
    isResizable: boolean;
    isDraggable: boolean;
    isCollapsed: boolean;
    state: any; // State specific to the area type
    data?: Record<string, unknown>;
}

/**
 * Global state of areas
 */
export interface IAreaState {
    areas: IArea[];
    activeAreaId: string | null;
    layout: IAreaLayout;
}

/**
 * Area layout
 */
export interface IAreaLayout {
    rootId: string | null;
    splitDirection: 'horizontal' | 'vertical' | null;
    splitRatio: number;
    children: IAreaLayoutNode[];
}

/**
 * Area layout node
 */
export interface IAreaLayoutNode {
    id: string;
    type: 'area' | 'split';
    splitDirection?: 'horizontal' | 'vertical';
    splitRatio?: number;
    children?: IAreaLayoutNode[];
    areaId?: string;
    areaType?: string;
}

/**
 * Type for an area component
 */
export type TAreaComponent<S = any> = React.ComponentType<{
    id: string;
    state: S;
    isActive: boolean;
}>;

/**
 * Type for an area state reducer
 */
export type TAreaReducer<S = any> = (state: S, action: AnyAction) => S;

/**
 * Type for area keyboard shortcuts
 */
export interface IAreaKeyboardShortcut {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    action: string;
    payload?: any;
}

export type TAreaKeyboardShortcuts = IAreaKeyboardShortcut[];

export interface Area {
    id: string;
    name: string;
    lastModified: number;
    dependencies?: string[];
}

export interface AreaState {
    areas: Area[];
    activeAreaId: string | null;
}

export type UndoableAreaState = StateWithHistory<AreaState>; 
