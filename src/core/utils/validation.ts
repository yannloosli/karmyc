import { IContextMenuItem } from '../types/contextMenu';
import { IArea, IDiff, IProject, IState, IToolbarItem } from '../types/core';

// Validation des zones
export const validateArea = (area: IArea): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!area.id) errors.push('ID manquant');
  if (!area.name) errors.push('Nom manquant');
  if (!area.type) errors.push('Type manquant');
  if (area.width < 0) errors.push('Largeur invalide');
  if (area.height < 0) errors.push('Hauteur invalide');
  if (area.x < 0) errors.push('Position X invalide');
  if (area.y < 0) errors.push('Position Y invalide');

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
  if (!project.type) errors.push('Type manquant');
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
export const validateContextMenuItem = (item: IContextMenuItem): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!item.id) errors.push('ID manquant');
  if (!item.label) errors.push('Label manquant');
  if (!item.action) errors.push('Action manquante');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// Validation des positions
export const validatePosition = (position: { x: number; y: number }): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (position.x < 0) errors.push('Position X invalide');
  if (position.y < 0) errors.push('Position Y invalide');

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
