import { validatePosition } from '../utils/validation';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
    ContextMenuItem,
    IContextMenuPosition,
} from '../types/contextMenu'; // Assuming types are correctly located
import { validateContextMenuItem } from '../utils/validation'; // Assuming validation utils are correctly located
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
    // Actions
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

const initialState = {
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

export const useContextMenuStore = create<ContextMenuState>()(
    immer((set) => ({
        ...initialState,

        openContextMenu: (payload) =>
            set((state) => {
                const { position, items, targetId, metadata } = payload;
                const menuClassName = (payload as any).menuClassName;

                // Validation
                const positionValidation = validatePosition(position);
                if (!positionValidation.isValid) {
                    console.warn('Position validation failed:', positionValidation.errors);
                    state.errors = positionValidation.errors;
                    return;
                }

                const itemsValidation = items.map((item) => validateContextMenuItem(item));
                const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
                if (invalidItems.length > 0) {
                    console.warn('Items validation failed:', invalidItems);
                    state.errors = invalidItems.flatMap(
                        (validation: any) => validation.errors || ['Unknown item validation error']
                    );
                    return;
                }

                // Update state
                state.isVisible = true;
                state.position = position;
                state.items = items;
                state.targetId = targetId;
                state.metadata = metadata;
                state.menuClassName = menuClassName || state.menuClassName || 'menu';
                state.errors = [];
                state.menuType = 'default';
            }),

        openCustomContextMenu: (payload) =>
            set((state) => {
                const { position, targetId, metadata, component } = payload;
                const menuClassName = (payload as any).menuClassName;

                // Vérification de la présence de position
                if (!position) {
                    console.warn('Aucune position fournie à openCustomContextMenu');
                    state.errors = ['Aucune position fournie au menu contextuel'];
                    return;
                }

                // Validation
                const positionValidation = validatePosition(position);
                if (!positionValidation.isValid) {
                    console.warn('Position validation failed:', positionValidation.errors);
                    state.errors = positionValidation.errors;
                    return;
                }
                state.isVisible = true;
                state.position = position;
                state.targetId = targetId;
                state.metadata = metadata;
                state.errors = [];
                state.menuClassName = menuClassName + ' menu';
                state.customContextMenuContent = component;
                state.menuType = 'custom';
            }),

        closeContextMenu: () =>
            set((state) => {
                Object.assign(state, initialState); // Reset to initial state
                state.menuType = undefined;
            }),

        updateContextMenuPosition: (position) =>
            set((state) => {
                const validation = validatePosition(position);
                if (!validation.isValid) {
                    state.errors = validation.errors;
                    return;
                }
                state.position = position;
                state.errors = []; // Clear errors on successful update
            }),

        updateContextMenuItems: (items) =>
            set((state) => {
                const itemsValidation = items.map((item) => validateContextMenuItem(item));
                const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
                if (invalidItems.length > 0) {
                    // Type assertion needed if validation result doesn't explicitly have errors property
                    state.errors = invalidItems.flatMap(
                        (validation: any) => validation.errors || ['Unknown item validation error']
                    );
                    return;
                }
                state.items = items;
                state.errors = []; // Clear errors on successful update
            }),

        clearErrors: () =>
            set((state) => {
                state.errors = [];
            }),
    }))
);

// Selectors can be used directly from the hook, e.g.:
// const isVisible = useContextMenuStore(state => state.isVisible);
// const position = useContextMenuStore(state => state.position); 
