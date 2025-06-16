import React from 'react';
import { StateCreator } from 'zustand';

import { ContextMenuItem, IContextMenuPosition } from '../types/context-menu-types';
import { RootStateType } from '../store';
import { openContextMenu } from './actions/open-context-menu';
import { openCustomContextMenu } from './actions/open-custom-context-menu';
import { closeContextMenu } from './actions/close-context-menu';
import { updateContextMenuPosition } from './actions/update-context-menu-position';
import { updateContextMenuItems } from './actions/update-context-menu-items';
import { clearContextMenuErrors } from './actions/clear-context-menu-errors';

interface ContextMenuState {
    isVisible: boolean;
    position: IContextMenuPosition;
    items: ContextMenuItem[];
    errors: string[];
    targetId?: string;
    metadata?: Record<string, any>;
    menuClassName?: string;
    customContextMenuContent?: React.ReactNode;
    menuType?: 'default' | 'switchType' | 'custom';
}

interface ContextMenuActions {
    openContextMenu: (payload: {
        position: IContextMenuPosition;
        items: ContextMenuItem[] | React.ReactNode;
        targetId?: string;
        metadata?: Record<string, any>;
    }) => void;
    openCustomContextMenu: (payload: {
        position: IContextMenuPosition;
        targetId?: string;
        metadata?: Record<string, any>;
        component: React.ReactNode;
    }) => void;
    closeContextMenu: () => void;
    updateContextMenuPosition: (position: IContextMenuPosition) => void;
    updateContextMenuItems: (items: ContextMenuItem[]) => void;
    clearErrors: () => void;
}

export type ContextMenuSlice = {
    contextMenu: ContextMenuState & ContextMenuActions;
}

export const initialState: ContextMenuState = {
    isVisible: false,
    position: { x: 0, y: 0 },
    items: [],
    errors: [],
    targetId: undefined,
    metadata: undefined,
    menuClassName: 'menu',
    customContextMenuContent: null,
    menuType: undefined
};


export const createContextMenuSlice: StateCreator<
    RootStateType, // le type global du store
    [],
    [],
    ContextMenuSlice
> = (set) => ({
    contextMenu: {
        ...initialState,

        openContextMenu: openContextMenu(set),
        openCustomContextMenu: openCustomContextMenu(set),
        closeContextMenu: closeContextMenu(set),
        updateContextMenuPosition: updateContextMenuPosition(set),
        updateContextMenuItems: updateContextMenuItems(set),
        clearErrors: clearContextMenuErrors(set),
    }
});
