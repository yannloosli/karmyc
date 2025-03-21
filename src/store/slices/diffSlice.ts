import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { IDiff, IDiffState } from '../../types/diff';
import { validateDiff } from '../../utils/validation';

const initialState: IDiffState = {
  diffs: [],
  activeDiffId: null,
  diffConfig: {
    maxHistory: 50,
    autoSave: true,
    saveInterval: 5000,
  },
  errors: [],
};

export const diffSlice = createSlice({
  name: 'diff',
  initialState,
  reducers: {
    addDiff: (state, action: PayloadAction<IDiff>) => {
      const validation = validateDiff(action.payload);
      if (!validation.isValid) {
        state.errors = validation.errors;
        return;
      }

      state.diffs.push(action.payload);
      // Limiter l'historique selon la configuration
      if (state.diffs.length > state.diffConfig.maxHistory) {
        state.diffs.shift();
      }
      state.errors = [];
    },
    removeDiff: (state, action: PayloadAction<string>) => {
      const diffExists = state.diffs.some(diff => diff.id === action.payload);
      if (!diffExists) {
        state.errors = ['Diff non trouvée'];
        return;
      }

      state.diffs = state.diffs.filter(diff => diff.id !== action.payload);
      if (state.activeDiffId === action.payload) {
        state.activeDiffId = null;
      }
      state.errors = [];
    },
    setActiveDiff: (state, action: PayloadAction<string | null>) => {
      if (action.payload) {
        const diffExists = state.diffs.some(diff => diff.id === action.payload);
        if (!diffExists) {
          state.errors = ['Diff non trouvée'];
          return;
        }
      }
      state.activeDiffId = action.payload;
      state.errors = [];
    },
    clearDiffs: (state) => {
      state.diffs = [];
      state.activeDiffId = null;
      state.errors = [];
    },
    updateDiffConfig: (state, action: PayloadAction<Partial<IDiffState['diffConfig']>>) => {
      const newConfig = {
        ...state.diffConfig,
        ...action.payload,
      };

      if (newConfig.maxHistory < 1) {
        state.errors = ['Le nombre maximum d\'historique doit être supérieur à 0'];
        return;
      }

      if (newConfig.saveInterval < 1000) {
        state.errors = ['L\'intervalle de sauvegarde doit être supérieur à 1000ms'];
        return;
      }

      state.diffConfig = newConfig;
      state.errors = [];
    },
    applyDiff: (state, action: PayloadAction<string>) => {
      const diff = state.diffs.find(d => d.id === action.payload);
      if (!diff) {
        state.errors = ['Diff non trouvée'];
        return;
      }

      // L'application de la diff sera gérée par le middleware
      state.activeDiffId = action.payload;
      state.errors = [];
    },
    revertDiff: (state, action: PayloadAction<string>) => {
      const diff = state.diffs.find(d => d.id === action.payload);
      if (!diff) {
        state.errors = ['Diff non trouvée'];
        return;
      }

      // La réversion de la diff sera gérée par le middleware
      state.activeDiffId = null;
      state.errors = [];
    },
    clearErrors: (state) => {
      state.errors = [];
    },
  },
});

// Actions
export const {
  addDiff,
  removeDiff,
  setActiveDiff,
  clearDiffs,
  updateDiffConfig,
  applyDiff,
  revertDiff,
  clearErrors,
} = diffSlice.actions;

// Sélecteurs
export const selectDiffState = (state: { diff: IDiffState }) => state.diff;

export const selectAllDiffs = (state: { diff: IDiffState }) => state.diff.diffs;

export const selectActiveDiffId = (state: { diff: IDiffState }) => state.diff.activeDiffId;

export const selectDiffConfig = (state: { diff: IDiffState }) => state.diff.diffConfig;

export const selectDiffById = (id: string) => (state: { diff: IDiffState }) =>
  state.diff.diffs.find(diff => diff.id === id);

export const selectActiveDiff = (state: { diff: IDiffState }) =>
  state.diff.activeDiffId
    ? state.diff.diffs.find(diff => diff.id === state.diff.activeDiffId)
    : null;

export const selectDiffHistory = (state: { diff: IDiffState }) =>
  state.diff.diffs.slice().reverse();

export const selectDiffErrors = (state: { diff: IDiffState }) => state.diff.errors;

export default diffSlice.reducer; 
