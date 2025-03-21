import { KeyboardShortcut } from "../../types";

/**
 * Registre des raccourcis clavier pour chaque type de zone
 * Permet d'enregistrer, récupérer et supprimer des raccourcis
 */
interface KeyboardShortcutRegistry {
    registerShortcuts: (areaType: string, shortcuts: KeyboardShortcut[]) => void;
    getShortcuts: (areaType: string) => KeyboardShortcut[];
    clearShortcuts: (areaType: string) => void;
    unregisterShortcuts: (areaType: string) => void;

    // Méthodes simplifiées pour utilisation directe
    register: (shortcut: KeyboardShortcut) => string; // Retourne un ID unique
    remove: (id: string) => boolean; // Retourne true si le raccourci a été trouvé et supprimé
}

// Stockage en mémoire des raccourcis par type de zone
const shortcutsStorage = new Map<string, KeyboardShortcut[]>();

// Stockage des raccourcis globaux avec id
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

    // Ajout d'un raccourci global avec génération d'ID
    register: (shortcut) => {
        const id = `kbd-${nextId++}`;
        globalShortcuts.set(id, shortcut);
        return id;
    },

    // Suppression d'un raccourci par ID
    remove: (id) => {
        return globalShortcuts.delete(id);
    }
}; 
