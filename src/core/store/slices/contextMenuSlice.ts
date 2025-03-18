import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '..';
import { ContextMenuItem, IContextMenuPosition, IContextMenuState, OpenCustomContextMenuOptions } from '../../types/contextMenu';
import { validateContextMenuItem, validatePosition } from '../../utils/validation';

const initialState: IContextMenuState = {
    isVisible: false,
    position: { x: 0, y: 0 },
    items: [],
    errors: [],
    customContextMenu: null,
};

export const contextMenuSlice = createSlice({
    name: 'contextMenu',
    initialState,
    reducers: {
        openContextMenu: (state, action: PayloadAction<{
            position: IContextMenuPosition;
            items: ContextMenuItem[];
            targetId?: string;
            metadata?: Record<string, any>;
        }>) => {
            const { position, items, targetId, metadata } = action.payload;

            // Validation de la position
            const positionValidation = validatePosition(position);
            if (!positionValidation.isValid) {
                state.errors = positionValidation.errors;
                return;
            }

            // Validation des items
            const itemsValidation = items.map(item => validateContextMenuItem(item));
            const invalidItems = itemsValidation.filter(validation => !validation.isValid);
            if (invalidItems.length > 0) {
                state.errors = invalidItems.flatMap(validation => validation.errors);
                return;
            }

            state.isVisible = true;
            state.position = position;
            state.items = items;
            state.targetId = targetId;
            state.metadata = metadata;
            state.errors = [];
            state.customContextMenu = null;
        },

        openCustomContextMenu: (state, action: PayloadAction<OpenCustomContextMenuOptions>) => {
            state.isVisible = true;
            state.customContextMenu = action.payload;
            state.items = [];
            state.errors = [];
        },

        closeContextMenu: (state) => {
            state.isVisible = false;
            state.items = [];
            state.targetId = undefined;
            state.metadata = undefined;
            state.errors = [];
            state.customContextMenu = null;
        },

        updateContextMenuPosition: (state, action: PayloadAction<IContextMenuPosition>) => {
            const validation = validatePosition(action.payload);
            if (!validation.isValid) {
                state.errors = validation.errors;
                return;
            }
            state.position = action.payload;
            state.errors = [];
        },

        updateContextMenuItems: (state, action: PayloadAction<ContextMenuItem[]>) => {
            const itemsValidation = action.payload.map(item => validateContextMenuItem(item));
            const invalidItems = itemsValidation.filter(validation => !validation.isValid);
            if (invalidItems.length > 0) {
                state.errors = invalidItems.flatMap(validation => validation.errors);
                return;
            }
            state.items = action.payload;
            state.errors = [];
        },

        clearErrors: (state) => {
            state.errors = [];
        },
    },
});

// Actions
export const {
    openContextMenu,
    closeContextMenu,
    updateContextMenuPosition,
    updateContextMenuItems,
    clearErrors,
    openCustomContextMenu,
} = contextMenuSlice.actions;

// Selectors
export const selectContextMenuVisible = (state: RootState) => state.contextMenu.isVisible;
export const selectContextMenuPosition = (state: RootState) => state.contextMenu.position;
export const selectContextMenuItems = (state: RootState) => state.contextMenu.items;
export const selectContextMenuTargetId = (state: RootState) => state.contextMenu.targetId;
export const selectContextMenuMetadata = (state: RootState) => state.contextMenu.metadata;
export const selectCustomContextMenu = (state: RootState) => state.contextMenu.customContextMenu;
export const selectContextMenuErrors = (state: RootState) => state.contextMenu.errors;

// Export reducer
export const contextMenuReducer = contextMenuSlice.reducer; 
