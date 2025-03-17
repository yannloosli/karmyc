import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IArea } from '../../types/core';
import { validateArea } from '../../utils/validation';

interface AreaState {
  areas: IArea[];
  activeAreaId: string | null;
  errors: string[];
}

const initialState: AreaState = {
  areas: [],
  activeAreaId: null,
  errors: [],
};

export const areaSlice = createSlice({
  name: 'area',
  initialState,
  reducers: {
    addArea: (state, action: PayloadAction<IArea>) => {
      const validation = validateArea(action.payload);
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }
      state.areas.push(action.payload);
      state.errors = [];
    },
    removeArea: (state, action: PayloadAction<string>) => {
      state.areas = state.areas.filter(area => area.id !== action.payload);
      if (state.activeAreaId === action.payload) {
        state.activeAreaId = null;
      }
      state.errors = [];
    },
    updateArea: (state, action: PayloadAction<{ id: string; changes: Partial<IArea> }>) => {
      const { id, changes } = action.payload;
      const areaIndex = state.areas.findIndex(area => area.id === id);
      
      if (areaIndex === -1) {
        state.errors = ['Zone non trouvée'];
        return;
      }

      const updatedArea = { ...state.areas[areaIndex], ...changes };
      const validation = validateArea(updatedArea);
      
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      state.areas[areaIndex] = updatedArea;
      state.errors = [];
    },
    setActiveArea: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        const areaExists = state.areas.some(area => area.id === action.payload);
        if (!areaExists) {
          state.errors = ['Zone non trouvée'];
          return;
        }
      }
      state.activeAreaId = action.payload;
      state.errors = [];
    },
    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

// Actions
export const { addArea, removeArea, updateArea, setActiveArea, clearErrors } = areaSlice.actions;

// Sélecteurs
export const selectAreaState = (state: { area: AreaState }) => state.area;
export const selectAllAreas = (state: { area: AreaState }) => state.area.areas;
export const selectActiveAreaId = (state: { area: AreaState }) => state.area.activeAreaId;
export const selectActiveArea = (state: { area: AreaState }) => 
  state.area.activeAreaId 
    ? state.area.areas.find(area => area.id === state.area.activeAreaId)
    : null;
export const selectAreaById = (id: string) => (state: { area: AreaState }) =>
  state.area.areas.find(area => area.id === id);
export const selectAreaErrors = (state: { area: AreaState }) => state.area.errors;

export default areaSlice.reducer; 
