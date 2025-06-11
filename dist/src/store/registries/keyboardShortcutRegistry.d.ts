export interface KeyboardShortcut {
    key: string;
    name: string;
    fn: (areaId: string, params: any) => void;
    modifierKeys?: string[];
    optionalModifierKeys?: string[];
    history?: boolean;
    shouldAddToStack?: (areaId: string, prevState: any, nextState: any) => boolean;
    isGlobal?: boolean;
    /**
     * Le type d'aire auquel ce raccourci est associé
     * Requis pour les raccourcis non-globaux
     */
    areaType?: string;
}
/**
 * Keyboard shortcuts registry for each area type
 * Allows registering, retrieving and removing shortcuts
 */
interface KeyboardShortcutRegistry {
    registerShortcuts: (areaType: string, shortcuts: KeyboardShortcut[]) => void;
    getShortcuts: (areaType: string) => KeyboardShortcut[];
    clearShortcuts: (areaType: string) => void;
    unregisterShortcuts: (areaType: string) => void;
    register: (shortcut: KeyboardShortcut) => string;
    remove: (id: string) => boolean;
    getAllShortcuts: () => KeyboardShortcut[];
}
export declare const keyboardShortcutRegistry: KeyboardShortcutRegistry;
export {};
