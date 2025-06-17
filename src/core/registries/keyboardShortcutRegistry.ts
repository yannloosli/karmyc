/**
 * Registre des raccourcis clavier.
 */
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

    // Simplified methods for direct usage
    register: (shortcut: KeyboardShortcut) => string; // Returns a unique ID
    remove: (id: string) => boolean; // Returns true if the shortcut was found and removed

    // New method to get all shortcuts
    getAllShortcuts: () => KeyboardShortcut[];
}

// In-memory storage of shortcuts by area type
const shortcutsStorage = new Map<string, KeyboardShortcut[]>();

// Storage of global shortcuts with ID
const globalShortcuts = new Map<string, KeyboardShortcut>();
let nextId = 1;

export const keyboardShortcutRegistry: KeyboardShortcutRegistry = {
    registerShortcuts: (areaType, shortcuts) => {
        shortcutsStorage.set(areaType, shortcuts);
    },

    getShortcuts: (areaType) => {
        return shortcutsStorage.get(areaType) || [];
    },

    clearShortcuts: (areaType) => {
        shortcutsStorage.delete(areaType);
    },

    unregisterShortcuts: (areaType) => {
        shortcutsStorage.delete(areaType);
    },

    // Adding a global shortcut with ID generation
    register: (shortcut) => {
        const id = `kbd-${nextId++}`;
        globalShortcuts.set(id, shortcut);
        return id;
    },

    // Removing a shortcut by ID
    remove: (id) => {
        return globalShortcuts.delete(id);
    },

    // New method to get all shortcuts
    getAllShortcuts: () => {
        const allShortcuts: KeyboardShortcut[] = [];
        
        // Ajouter les raccourcis par type d'aire
        for (const shortcuts of shortcutsStorage.values()) {
            allShortcuts.push(...shortcuts);
        }
        
        // Ajouter les raccourcis globaux
        for (const shortcut of globalShortcuts.values()) {
            allShortcuts.push(shortcut);
        }
        
        return allShortcuts;
    }
}; 
