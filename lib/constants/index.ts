/**
 * Public constants for the core module
 * This file exports all public constants of the module
 */

// Action types
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

export const keys = {
    Backspace: 8,
    Tab: 9,
    Enter: 13,
    Shift: 16,
    Control: 17,
    Alt: 18,
    Esc: 27,
    Space: 32,
    Delete: 46,
    A: 65,
    B: 66,
    C: 67,
    F: 70,
    G: 71,
    I: 73,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    U: 85,
    V: 86,
    X: 88,
    Z: 90,
    Command: 91,
    F1: 112,
    F2: 113,
    F3: 114,
    F4: 115,
    F5: 116,
    F6: 117,
    F7: 118,
    F8: 119,
    F9: 120,
    F10: 121,
    F11: 122,
    F12: 123,
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
    INVALID_AREA_SIZE: 'Invalid area size',
    INVALID_AREA_TYPE: 'Invalid area type',
    AREA_NOT_FOUND: 'Area not found',
    PROJECT_NOT_FOUND: 'Project not found',
    INVALID_ACTION: 'Invalid action',
} as const;

export const AREA_PLACEMENT_TRESHOLD = 0.25;
export const AREA_BORDER_WIDTH = 2;
export const TOOLBAR_HEIGHT = 30;
export const AREA_MIN_CONTENT_WIDTH = 32;

// Utility type to facilitate input and validation of area types
export type AreaTypeValue = string;

export const DEFAULT_CONTEXT_MENU_WIDTH = 180;
export const CONTEXT_MENU_OPTION_HEIGHT = 20;
export const CONTEXT_MENU_OPTION_PADDING_LEFT = 32;
export const CONTEXT_MENU_OPTION_PADDING_RIGHT = 16;
