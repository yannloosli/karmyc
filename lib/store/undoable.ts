import { AnyAction, Reducer } from '@reduxjs/toolkit';
import undoable, { StateWithHistory } from 'redux-undo';

export interface UndoableOptions {
    limit?: number;
    filter?: (action: AnyAction) => boolean;
    groupBy?: (action: AnyAction) => string | null;
    initTypes?: string[];
    neverSkipReducer?: boolean;
    syncFilter?: boolean;
    debug?: boolean;
}

export const defaultUndoableOptions: UndoableOptions = {
    limit: 50,
    filter: (action: AnyAction) => {
        // Don't include selection and activation actions in history
        return !action.type.includes('setSelected') &&
            !action.type.includes('setActive') &&
            !action.type.includes('setLoading') &&
            !action.type.includes('setError');
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
