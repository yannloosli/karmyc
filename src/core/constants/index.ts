/**
 * Constantes publiques du module core
 * Ce fichier exporte toutes les constantes publiques du module
 */

// Les constantes seront implémentées et exportées ici au fur et à mesure
// de l'implémentation du système 

// Types d'actions
export * from './actionTypes';

export const DEFAULT_AREA_TYPES = ['text', 'image', 'video', 'shape'] as const;

export const AREA_MIN_SIZE = {
  width: 50,
  height: 50,
};

export const AREA_MAX_SIZE = {
  width: 1920,
  height: 1080,
};

export const HISTORY_LIMIT = 50;

export const ACTION_PRIORITIES = {
  HIGH: 100,
  MEDIUM: 50,
  LOW: 0,
} as const;

export const STORAGE_KEYS = {
  PROJECT: 'project',
  SETTINGS: 'settings',
} as const;

export const ERROR_MESSAGES = {
  INVALID_AREA_SIZE: 'La taille de la zone est invalide',
  INVALID_AREA_TYPE: 'Le type de zone est invalide',
  AREA_NOT_FOUND: 'La zone n\'a pas été trouvée',
  PROJECT_NOT_FOUND: 'Le projet n\'a pas été trouvé',
  INVALID_ACTION: 'L\'action est invalide',
} as const;
