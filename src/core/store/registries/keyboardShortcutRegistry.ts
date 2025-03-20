import { AreaType } from "../../constants";
import { KeyboardShortcut } from "../../types";

/**
 * Registre des raccourcis clavier pour chaque type de zone
 * Permet d'enregistrer, récupérer et supprimer des raccourcis
 */
interface KeyboardShortcutRegistry {
    registerShortcuts: (areaType: AreaType, shortcuts: KeyboardShortcut[]) => void;
    getShortcuts: (areaType: AreaType) => KeyboardShortcut[];
    clearShortcuts: (areaType: AreaType) => void;
}

// Stockage en mémoire des raccourcis par type de zone
const shortcutsStorage = new Map<AreaType, KeyboardShortcut[]>();

export const keyboardShortcutRegistry: KeyboardShortcutRegistry = {
    registerShortcuts: (areaType, shortcuts) => {
        shortcutsStorage.set(areaType, shortcuts);
    },

    getShortcuts: (areaType) => {
        return shortcutsStorage.get(areaType) || [];
    },

    clearShortcuts: (areaType) => {
        shortcutsStorage.delete(areaType);
    }
}; 
