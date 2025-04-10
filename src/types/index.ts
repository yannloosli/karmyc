/**
 * Types publics du module core
 * Ce fichier exporte tous les types publics du module
 */

// Les types seront implémentés et exportés ici au fur et à mesure
// de l'implémentation du système 

// Types liés aux zones
export * from './area';
export * from './areaTypes';
export * from './image';

// Types liés aux actions
export * from './actions';

// Types liés aux menus contextuels
export * from './contextMenu';

// Types liés à l'historique
export * from './history';

// Types liés au store
export * from './store';

// Types liés au module core
export * from './karmyc';

// Types liés aux directions
export * from './directions';

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
