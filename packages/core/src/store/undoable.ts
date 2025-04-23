import { AnyAction, Reducer } from '@reduxjs/toolkit';
import undoable, { StateWithHistory } from 'redux-undo';
import { areaSlice } from './slices/areaSlice';

export interface UndoableOptions {
    limit?: number;
    filter?: (action: AnyAction) => boolean;
    groupBy?: (action: AnyAction) => string | null;
    initTypes?: string[];
    neverSkipReducer?: boolean;
    syncFilter?: boolean;
    debug?: boolean;
}

const areaActionTypesToExclude = [
    areaSlice.actions.addAreaToRow.type,
    areaSlice.actions.setRowSizes.type,
    areaSlice.actions.setViewports.type,
    areaSlice.actions.convertAreaToRow.type,
    areaSlice.actions.setJoinAreasPreview.type,
    areaSlice.actions.joinAreas.type,
    areaSlice.actions.cleanupTemporaryStates.type,
    areaSlice.actions.updateArea.type, // Exclude transient updates
];

export const defaultUndoableOptions: UndoableOptions = {
    limit: 50,
    filter: (action: AnyAction) => {
        // Don't include selection, activation, loading, or error actions in history
        const isExcludedByDefault = !action.type.includes('setSelected') &&
            !action.type.includes('setActive') &&
            !action.type.includes('setLoading') &&
            !action.type.includes('setError');

        // Exclude specific area manipulation actions
        // Cast action.type to any to satisfy TypeScript's stricter type checking with includes
        const isAreaManipulationAction = areaActionTypesToExclude.includes(action.type as any);

        return isExcludedByDefault && !isAreaManipulationAction;
    },
    groupBy: (action: AnyAction) => {
        // Group actions by type to reduce history size
        if (action.type.includes('update')) {
            return action.type;
        }
        return null;
    },
    initTypes: ['@@INIT', '@@redux/INIT'],
    neverSkipReducer: true,
    syncFilter: true,
    debug: process.env.NODE_ENV === 'development',
};

export function createUndoableReducer<S>(
    reducer: Reducer<S, AnyAction>,
    options: UndoableOptions = {}
): Reducer<StateWithHistory<S>, AnyAction> {
    return undoable(reducer, {
        ...defaultUndoableOptions,
        ...options,
    });
} 
