import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IContextMenuItem, IContextMenuPosition, IContextMenuState } from '../../types/contextMenu';
import { validateContextMenuItem, validatePosition } from '../../utils/validation';

const initialState: IContextMenuState = {
  isVisible: false,
  position: { x: 0, y: 0 },
  items: [],
  errors: [],
};

export const contextMenuSlice = createSlice({
  name: 'contextMenu',
  initialState,
  reducers: {
    openContextMenu: (state, action: PayloadAction<{
      position: IContextMenuPosition;
      items: IContextMenuItem[];
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
    },
    closeContextMenu: (state) => {
      state.isVisible = false;
      state.items = [];
      state.targetId = undefined;
      state.metadata = undefined;
      state.errors = [];
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
    updateContextMenuItems: (state, action: PayloadAction<IContextMenuItem[]>) => {
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
} = contextMenuSlice.actions;

// Sélecteurs
export const selectContextMenuState = (state: { contextMenu: IContextMenuState }) => state.contextMenu;
export const selectContextMenuVisible = (state: { contextMenu: IContextMenuState }) => state.contextMenu.isVisible;
export const selectContextMenuPosition = (state: { contextMenu: IContextMenuState }) => state.contextMenu.position;
export const selectContextMenuItems = (state: { contextMenu: IContextMenuState }) => state.contextMenu.items;
export const selectContextMenuTargetId = (state: { contextMenu: IContextMenuState }) => state.contextMenu.targetId;
export const selectContextMenuMetadata = (state: { contextMenu: IContextMenuState }) => state.contextMenu.metadata;
export const selectContextMenuErrors = (state: { contextMenu: IContextMenuState }) => state.contextMenu.errors;

export const contextMenuReducer = contextMenuSlice.reducer;
export default contextMenuSlice.reducer; 
