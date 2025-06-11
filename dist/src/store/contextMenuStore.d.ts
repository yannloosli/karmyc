import { ContextMenuItem, IContextMenuPosition } from '../types/contextMenu';
import React from 'react';
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
    openContextMenu: (payload: {
        position: IContextMenuPosition;
        items: ContextMenuItem[];
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
    openSwitchTypeContextMenu?: (payload: {
        position: IContextMenuPosition;
        targetId?: string;
        metadata?: Record<string, any>;
        menuClassName?: string;
    }) => void;
}
export declare const useContextMenuStore: import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<ContextMenuState>, "setState"> & {
    setState(nextStateOrUpdater: ContextMenuState | Partial<ContextMenuState> | ((state: import("immer").WritableDraft<ContextMenuState>) => void), shouldReplace?: boolean | undefined): void;
}>;
export {};
