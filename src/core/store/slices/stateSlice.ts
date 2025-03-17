import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IState, IStateState } from '../../types/state';
import { validateState } from '../../utils/validation';

const initialState: IStateState = {
  states: {},
  activeStateId: null,
  stateConfig: {
    maxStates: 100,
    autoSave: true,
    saveInterval: 3000,
  },
  errors: [],
};

export const stateSlice = createSlice({
  name: 'state',
  initialState,
  reducers: {
    registerState: (state, action: PayloadAction<IState>) => {
      const validation = validateState(action.payload);
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      const { id, ...stateData } = action.payload;
      state.states[id] = stateData;
      state.errors = [];
    },
    unregisterState: (state, action: PayloadAction<string>) => {
      if (!state.states[action.payload]) {
        state.errors = ['État non trouvé'];
        return;
      }

      delete state.states[action.payload];
      if (state.activeStateId === action.payload) {
        state.activeStateId = null;
      }
      state.errors = [];
    },
    setActiveState: (state, action: PayloadAction<string | null>) => {
      if (action.payload && !state.states[action.payload]) {
        state.errors = ['État non trouvé'];
        return;
      }
      state.activeStateId = action.payload;
      state.errors = [];
    },
    updateState: (state, action: PayloadAction<{
      id: string;
      changes: Partial<IState>;
    }>) => {
      const { id, changes } = action.payload;
      if (!state.states[id]) {
        state.errors = ['État non trouvé'];
        return;
      }

      const updatedState = {
        ...state.states[id],
        ...changes,
        updatedAt: new Date().toISOString(),
      };

      const validation = validateState({ id, ...updatedState });
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      state.states[id] = updatedState;
      state.errors = [];
    },
    clearStates: (state) => {
      state.states = {};
      state.activeStateId = null;
      state.errors = [];
    },
    updateStateConfig: (state, action: PayloadAction<Partial<IStateState['stateConfig']>>) => {
      const newConfig = {
        ...state.stateConfig,
        ...action.payload,
      };

      if (newConfig.maxStates < 1) {
        state.errors = ['Le nombre maximum d\'états doit être supérieur à 0'];
        return;
      }

      if (newConfig.saveInterval < 1000) {
        state.errors = ['L\'intervalle de sauvegarde doit être supérieur à 1000ms'];
        return;
      }

      state.stateConfig = newConfig;
      state.errors = [];
    },
    transitionState: (state, action: PayloadAction<{
      id: string;
      transition: string;
      data?: any;
    }>) => {
      const { id, transition, data } = action.payload;
      if (!state.states[id]) {
        state.errors = ['État non trouvé'];
        return;
      }

      const stateData = state.states[id];
      if (!stateData.transitions.includes(transition)) {
        state.errors = ['Transition non autorisée'];
        return;
      }

      // La transition sera gérée par le middleware
      state.activeStateId = id;
      state.errors = [];
    },
    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

// Actions
export const {
  registerState,
  unregisterState,
  setActiveState,
  updateState,
  clearStates,
  updateStateConfig,
  transitionState,
  clearErrors,
} = stateSlice.actions;

// Sélecteurs
export const selectStateState = (state: { state: IStateState }) => state.state;

export const selectAllStates = (state: { state: IStateState }) => state.state.states;

export const selectActiveStateId = (state: { state: IStateState }) => state.state.activeStateId;

export const selectStateConfig = (state: { state: IStateState }) => state.state.stateConfig;

export const selectStateById = (id: string) => (state: { state: IStateState }) =>
  state.state.states[id];

export const selectActiveState = (state: { state: IStateState }) =>
  state.state.activeStateId
    ? state.state.states[state.state.activeStateId]
    : null;

export const selectStatesByType = (type: string) => (state: { state: IStateState }) =>
  Object.entries(state.state.states)
    .filter(([_, stateData]) => stateData.type === type)
    .map(([id, stateData]) => ({ id, ...stateData }));

export const selectStateErrors = (state: { state: IStateState }) => state.state.errors;

export default stateSlice.reducer; 
