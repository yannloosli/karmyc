import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Sélecteurs de base
const selectState = (state: RootState) => state.state;
const selectDiff = (state: RootState) => state.diff;
const selectToolbar = (state: RootState) => state.toolbar;

// Sélecteurs mémorisés pour les états
export const selectStates = createSelector(
  selectState,
  (state) => state.states
);

export const selectStateById = createSelector(
  [selectStates, (_, id: string) => id],
  (states, id) => states[id]
);

export const selectStatesByType = createSelector(
  [selectStates, (_, type: string) => type],
  (states, type) => Object.values(states).filter(state => state.type === type)
);

// Sélecteurs mémorisés pour les diffs
export const selectDiffs = createSelector(
  selectDiff,
  (diff) => diff.diffs
);

export const selectActiveDiff = createSelector(
  selectDiff,
  (diff) => diff.diffs.find(d => d.id === diff.activeDiffId)
);

export const selectDiffById = createSelector(
  [selectDiffs, (_, id: string) => id],
  (diffs, id) => diffs.find(d => d.id === id)
);

// Sélecteurs mémorisés pour la barre d'outils
export const selectToolbarItems = createSelector(
  selectToolbar,
  (toolbar) => toolbar.items
);

export const selectActiveTool = createSelector(
  selectToolbar,
  (toolbar) => toolbar.activeTool
);

// Sélecteurs composites
export const selectStateWithDiffs = createSelector(
  [selectStateById, selectDiffs],
  (state, diffs) => {
    if (!state) return null;
    return {
      ...state,
      diffs: diffs.filter(d => d.target === state.id)
    };
  }
);

export const selectAvailableTransitions = createSelector(
  [selectStateById],
  (state) => {
    if (!state) return [];
    return Object.entries(transitions)
      .filter(([key]) => key.startsWith(state.type))
      .map(([key]) => key.split('-')[1]);
  }
);

// Sélecteurs de validation
export const selectStateValidation = createSelector(
  selectStateById,
  (state) => {
    if (!state) return { isValid: false, errors: ['État non trouvé'] };
    
    const errors: string[] = [];
    
    // Validation des champs requis
    if (!state.data) {
      errors.push('Données manquantes');
    }
    
    // Validation selon le type d'état
    switch (state.type) {
      case 'draft':
        if (!state.data.isComplete) {
          errors.push('Le brouillon n\'est pas complet');
        }
        if (state.data.hasErrors) {
          errors.push('Le brouillon contient des erreurs');
        }
        break;
        
      case 'review':
        if (state.data.reviewStatus !== 'completed') {
          errors.push('La revue n\'est pas terminée');
        }
        break;
        
      case 'approved':
        if (!state.data.isReadyForPublish) {
          errors.push('Non prêt pour la publication');
        }
        if (state.data.hasWarnings) {
          errors.push('Contient des avertissements');
        }
        break;
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
);

// Sélecteurs de performance
export const selectStateMetrics = createSelector(
  selectStateById,
  (state) => {
    if (!state) return null;
    
    return {
      age: Date.now() - new Date(state.createdAt).getTime(),
      updateCount: state.data?.updateCount || 0,
      lastUpdate: state.updatedAt,
      transitionCount: state.data?.transitionCount || 0
    };
  }
);

// Sélecteurs de filtrage
export const selectFilteredStates = createSelector(
  [selectStates, (_, filters: Record<string, any>) => filters],
  (states, filters) => {
    return Object.values(states).filter(state => {
      return Object.entries(filters).every(([key, value]) => {
        return state.data[key] === value;
      });
    });
  }
); 
