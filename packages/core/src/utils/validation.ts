import { Area } from '../types/areaTypes';
import { ContextMenuItem } from '../types/contextMenu';
import { IDiff } from '../types/diff';
import { IState } from '../types/state';
import { IToolbarItem } from '../types/toolbar';

// All validation functions commented out as they are unused according to ts-prune
// and the re-export in utils/index.ts has been commented out.
/*
// Area validation
export const validateArea = (area: Area<string>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!area.type) errors.push('Missing type');
    if (!area.state) errors.push('Missing state');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// State validation
export const validateState = (state: IState): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!state.id) errors.push('Missing ID');
    if (!state.type) errors.push('Missing type');
    if (!state.name) errors.push('Missing name');
    if (!state.transitions) errors.push('Missing transitions');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Diff validation
export const validateDiff = (diff: IDiff): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!diff.id) errors.push('Missing ID');
    if (!diff.type) errors.push('Missing type');
    if (!diff.changes) errors.push('Missing changes');
    if (!diff.timestamp) errors.push('Missing timestamp');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Toolbar item validation
export const validateToolbarItem = (item: IToolbarItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('Missing ID');
    if (!item.type) errors.push('Missing type');
    if (!item.label) errors.push('Missing label');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Context menu item validation
export const validateContextMenuItem = (item: ContextMenuItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('Missing ID');
    if (!item.label) errors.push('Missing label');
    if (!item.actionId) errors.push('Missing actionId');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Position validation
export const validatePosition = (position: { x: number; y: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (typeof position.x !== 'number') errors.push('Position X must be a number');
    if (typeof position.y !== 'number') errors.push('Position Y must be a number');
    if (isNaN(position.x)) errors.push('Position X is NaN');
    if (isNaN(position.y)) errors.push('Position Y is NaN');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Dimensions validation
export const validateDimensions = (dimensions: { width: number; height: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (dimensions.width <= 0) errors.push('Invalid width');
    if (dimensions.height <= 0) errors.push('Invalid height');

    return {
        isValid: errors.length === 0,
        errors,
    };
};
*/

// Restoring validation functions as they seem to be used directly

// Area validation
export const validateArea = (area: Area<string>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!area.type) errors.push('Missing type');
    if (!area.state) errors.push('Missing state');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// State validation
export const validateState = (state: IState): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!state.id) errors.push('Missing ID');
    if (!state.type) errors.push('Missing type');
    if (!state.name) errors.push('Missing name');
    if (!state.transitions) errors.push('Missing transitions');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Diff validation
export const validateDiff = (diff: IDiff): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!diff.id) errors.push('Missing ID');
    if (!diff.type) errors.push('Missing type');
    if (!diff.changes) errors.push('Missing changes');
    if (!diff.timestamp) errors.push('Missing timestamp');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Toolbar item validation
export const validateToolbarItem = (item: IToolbarItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('Missing ID');
    if (!item.type) errors.push('Missing type');
    if (!item.label) errors.push('Missing label');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Context menu item validation
export const validateContextMenuItem = (item: ContextMenuItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('Missing ID');
    if (!item.label) errors.push('Missing label');
    if (!item.actionId) errors.push('Missing actionId');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Position validation - MOVED TO @karmyc/shared
/*
export const validatePosition = (position: { x: number; y: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (typeof position.x !== 'number') errors.push('Position X must be a number');
    if (typeof position.y !== 'number') errors.push('Position Y must be a number');
    if (isNaN(position.x)) errors.push('Position X is NaN');
    if (isNaN(position.y)) errors.push('Position Y is NaN');

    return {
        isValid: errors.length === 0,
        errors,
    };
};
*/

// Dimensions validation - MOVED TO @karmyc/shared
/*
export const validateDimensions = (dimensions: { width: number; height: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (dimensions.width <= 0) errors.push('Invalid width');
    if (dimensions.height <= 0) errors.push('Invalid height');

    return {
        isValid: errors.length === 0,
        errors,
    };
};
*/
