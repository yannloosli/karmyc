import { createSelector } from '@reduxjs/toolkit';
import { RootState } from './index';

// Basic selectors
const selectState = (state: RootState) => state.state;
const selectDiff = (state: RootState) => state.diff;
const selectToolbar = (state: RootState) => state.toolbar;

// Memoized selectors for states
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

// Memoized selectors for diffs
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

// Memoized selectors for toolbar
export const selectToolbarItems = createSelector(
    selectToolbar,
    (toolbar) => toolbar.items
);

export const selectActiveTool = createSelector(
    selectToolbar,
    (toolbar) => toolbar.activeTool
);

// Composite selectors
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

// Validation selectors
export const selectStateValidation = createSelector(
    selectStateById,
    (state) => {
        if (!state) return { isValid: false, errors: ['State not found'] };

        const errors: string[] = [];

        // Required fields validation
        if (!state.data) {
            errors.push('Missing data');
        }

        // Validation based on state type
        switch (state.type) {
        case 'draft':
            if (!state.data.isComplete) {
                errors.push('Draft is not complete');
            }
            if (state.data.hasErrors) {
                errors.push('Draft contains errors');
            }
            break;

        case 'review':
            if (state.data.reviewStatus !== 'completed') {
                errors.push('Review is not completed');
            }
            break;

        case 'approved':
            if (!state.data.isReadyForPublish) {
                errors.push('Not ready for publishing');
            }
            if (state.data.hasWarnings) {
                errors.push('Contains warnings');
            }
            break;
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
);

// Performance selectors
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

// Filtering selectors
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
