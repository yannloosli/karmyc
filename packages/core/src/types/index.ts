/**
 * Types publics du module core
 * Ce fichier exporte tous les types publics du module
 */

// Les types seront implémentés et exportés ici au fur et à mesure
// de l'implémentation du système 

// Commented out unused re-exports based on ts-prune and usage analysis.
// Most types are imported directly from their source files elsewhere.
// export * from './area';
// export * from './areaTypes';
// export * from './image';
// export * from './actions';
// export * from './contextMenu';
// export * from './history';
// export * from './store';
// export * from './karmyc';
// export * from './math'; // Contains only Rect, imported via geometry.ts usually
// export * from './geometry'; // Contains Rect and Point
// export * from './state';
// export * from './diff';
// export * from './requestAction';
// export * from './toolbar';

// Export only types confirmed to be imported via this index file
export type { CardinalDirection } from './directions';
export * from './notificationTypes'; // Export notification types
// IntercardinalDirection from './directions' is unused according to ts-prune

// Keep local definition as it's used
/**
 * Définition d'un raccourci clavier
 */
export interface KeyboardShortcut {
    key: string;
    name: string;
    fn: (areaId: string, params: any) => void;
    modifierKeys?: string[];
    optionalModifierKeys?: string[];
    history?: boolean;
    shouldAddToStack?: (areaId: string, prevState: any, nextState: any) => boolean;
}

// Removed exports for MousePosition, HSLColor, RGBAColor, RGBColor as their source
// within this module is unclear and existing imports might be incorrect.
