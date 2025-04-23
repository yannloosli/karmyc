import { AnyAction } from '@reduxjs/toolkit';
import { IAction } from '../../types/actions';
import { ActionPriority } from '../priorities';

// List of action types that should be recorded in history
const HISTORY_ACTION_TYPES = [
    'area/addArea',
    'area/removeArea',
    'area/updateArea',
    // Other action types...
];

export const historyPlugin: IAction = {
    id: 'history',
    type: 'history',
    priority: ActionPriority.HIGH,
    actionTypes: HISTORY_ACTION_TYPES,
    handler: (action: AnyAction) => {
        // Logic to record the action in history
        // This logic will depend on the implementation of the history system
        console.log(`Action recorded in history: ${action.type}`);
    }
}; 
