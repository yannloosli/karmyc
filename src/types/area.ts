import { AnyAction } from '@reduxjs/toolkit';
import { StateWithHistory } from 'redux-undo';

/**
 * Type de base pour une zone
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
    state: any; // État spécifique au type de zone
    data?: Record<string, unknown>;
}

/**
 * État global des zones
 */
export interface IAreaState {
    areas: IArea[];
    activeAreaId: string | null;
    layout: IAreaLayout;
}

/**
 * Disposition des zones
 */
export interface IAreaLayout {
    rootId: string | null;
    splitDirection: 'horizontal' | 'vertical' | null;
    splitRatio: number;
    children: IAreaLayoutNode[];
}

/**
 * Nœud de disposition des zones
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
 * Type pour un composant de zone
 */
export type TAreaComponent<S = any> = React.ComponentType<{
    id: string;
    state: S;
    isActive: boolean;
}>;

/**
 * Type pour un réducteur d'état de zone
 */
export type TAreaReducer<S = any> = (state: S, action: AnyAction) => S;

/**
 * Type pour les raccourcis clavier d'une zone
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
