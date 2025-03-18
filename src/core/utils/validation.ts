import { AreaType } from '../constants';
import { Area } from '../types/areaTypes';
import { ContextMenuItem } from '../types/contextMenu';
import { IProject } from '../types/core';
import { IDiff } from '../types/diff';
import { IState } from '../types/state';
import { IToolbarItem } from '../types/toolbar';

// Validation des zones
export const validateArea = (area: Area<AreaType>): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!area.type) errors.push('Type manquant');
    if (!area.state) errors.push('État manquant');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des projets
export const validateProject = (project: IProject): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!project.id) errors.push('ID manquant');
    if (!project.name) errors.push('Nom manquant');
    if (!project.createdAt) errors.push('Date de création manquante');
    if (!project.updatedAt) errors.push('Date de mise à jour manquante');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des états
export const validateState = (state: IState): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!state.id) errors.push('ID manquant');
    if (!state.type) errors.push('Type manquant');
    if (!state.name) errors.push('Nom manquant');
    if (!state.transitions) errors.push('Transitions manquantes');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des diffs
export const validateDiff = (diff: IDiff): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!diff.id) errors.push('ID manquant');
    if (!diff.type) errors.push('Type manquant');
    if (!diff.changes) errors.push('Changements manquants');
    if (!diff.timestamp) errors.push('Timestamp manquant');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des items de toolbar
export const validateToolbarItem = (item: IToolbarItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('ID manquant');
    if (!item.type) errors.push('Type manquant');
    if (!item.label) errors.push('Label manquant');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des items de menu contextuel
export const validateContextMenuItem = (item: ContextMenuItem): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!item.id) errors.push('ID manquant');
    if (!item.label) errors.push('Label manquant');
    if (!item.actionId) errors.push('ActionId manquant');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des positions
export const validatePosition = (position: { x: number; y: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (typeof position.x !== 'number') errors.push('Position X doit être un nombre');
    if (typeof position.y !== 'number') errors.push('Position Y doit être un nombre');
    if (isNaN(position.x)) errors.push('Position X est NaN');
    if (isNaN(position.y)) errors.push('Position Y est NaN');

    return {
        isValid: errors.length === 0,
        errors,
    };
};

// Validation des dimensions
export const validateDimensions = (dimensions: { width: number; height: number }): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (dimensions.width <= 0) errors.push('Largeur invalide');
    if (dimensions.height <= 0) errors.push('Hauteur invalide');

    return {
        isValid: errors.length === 0,
        errors,
    };
}; 
