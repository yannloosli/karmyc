import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IToolbarItem, IToolbarState } from '../../types/toolbar';
import { validateToolbarItem } from '../../utils/validation';

const initialState: IToolbarState = {
  toolbars: {},
  activeToolbarId: null,
  activeToolId: null,
  toolbarConfigs: {},
  errors: [],
};

export const toolbarSlice = createSlice({
  name: 'toolbar',
  initialState,
  reducers: {
    registerToolbar: (state, action: PayloadAction<{
      id: string;
      items: IToolbarItem[];
      config?: Record<string, any>;
    }>) => {
      const { id, items, config } = action.payload;

      // Validation des items
      const itemsValidation = items.map(item => validateToolbarItem(item));
      const invalidItems = itemsValidation.filter(validation => !validation.isValid);
      if (invalidItems.length > 0) {
        state.errors = invalidItems.flatMap(validation => validation.errors);
        return;
      }

      state.toolbars[id] = items;
      if (config) {
        state.toolbarConfigs[id] = config;
      }
      state.errors = [];
    },
    unregisterToolbar: (state, action: PayloadAction<string>) => {
      if (!state.toolbars[action.payload]) {
        state.errors = ['Toolbar non trouvée'];
        return;
      }

      delete state.toolbars[action.payload];
      delete state.toolbarConfigs[action.payload];
      if (state.activeToolbarId === action.payload) {
        state.activeToolbarId = null;
      }
      state.errors = [];
    },
    setActiveToolbar: (state, action: PayloadAction<string | null>) => {
      if (action.payload && !state.toolbars[action.payload]) {
        state.errors = ['Toolbar non trouvée'];
        return;
      }
      state.activeToolbarId = action.payload;
      state.errors = [];
    },
    setActiveTool: (state, action: PayloadAction<string | null>) => {
      if (action.payload && state.activeToolbarId) {
        const toolbar = state.toolbars[state.activeToolbarId];
        const toolExists = toolbar.some(item => item.id === action.payload);
        if (!toolExists) {
          state.errors = ['Outil non trouvé'];
          return;
        }
      }
      state.activeToolId = action.payload;
      state.errors = [];
    },
    updateToolbarItems: (state, action: PayloadAction<{
      toolbarId: string;
      items: IToolbarItem[];
    }>) => {
      const { toolbarId, items } = action.payload;
      if (!state.toolbars[toolbarId]) {
        state.errors = ['Toolbar non trouvée'];
        return;
      }

      // Validation des items
      const itemsValidation = items.map(item => validateToolbarItem(item));
      const invalidItems = itemsValidation.filter(validation => !validation.isValid);
      if (invalidItems.length > 0) {
        state.errors = invalidItems.flatMap(validation => validation.errors);
        return;
      }

      state.toolbars[toolbarId] = items;
      state.errors = [];
    },
    updateToolbarConfig: (state, action: PayloadAction<{
      toolbarId: string;
      config: Record<string, any>;
    }>) => {
      const { toolbarId, config } = action.payload;
      if (!state.toolbars[toolbarId]) {
        state.errors = ['Toolbar non trouvée'];
        return;
      }

      state.toolbarConfigs[toolbarId] = config;
      state.errors = [];
    },
    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

// Actions
export const {
  registerToolbar,
  unregisterToolbar,
  setActiveToolbar,
  setActiveTool,
  updateToolbarItems,
  updateToolbarConfig,
  clearErrors,
} = toolbarSlice.actions;

// Sélecteurs
export const selectToolbarState = (state: { toolbar: IToolbarState }) => state.toolbar;

export const selectAllToolbars = (state: { toolbar: IToolbarState }) => state.toolbar.toolbars;

export const selectActiveToolbarId = (state: { toolbar: IToolbarState }) => state.toolbar.activeToolbarId;

export const selectActiveToolId = (state: { toolbar: IToolbarState }) => state.toolbar.activeToolId;

export const selectToolbarById = (id: string) => (state: { toolbar: IToolbarState }) => 
  state.toolbar.toolbars[id];

export const selectToolbarConfig = (id: string) => (state: { toolbar: IToolbarState }) =>
  state.toolbar.toolbarConfigs[id];

export const selectActiveToolbar = (state: { toolbar: IToolbarState }) =>
  state.toolbar.activeToolbarId ? state.toolbar.toolbars[state.toolbar.activeToolbarId] : null;

export const selectActiveToolbarConfig = (state: { toolbar: IToolbarState }) =>
  state.toolbar.activeToolbarId ? state.toolbar.toolbarConfigs[state.toolbar.activeToolbarId] : null;

export const selectToolbarErrors = (state: { toolbar: IToolbarState }) => state.toolbar.errors;

export default toolbarSlice.reducer; 
