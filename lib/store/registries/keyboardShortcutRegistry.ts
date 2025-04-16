import { KeyboardShortcut } from "../../types";

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
    }
}; 
