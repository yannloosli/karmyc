import { KeyboardShortcut } from "../types";

/**
 * Liste des touches modificatrices prises en charge
 */
export const modifierKeys = ["Command", "Alt", "Shift", "Control"] as const;
export type ModifierKey = typeof modifierKeys[number];

/**
 * Correspondance entre codes clavier et noms de touches
 * Cette liste est partielle et doit être étendue selon les besoins
 */
const keyCodeMap: Record<number, string> = {
    // Lettres
    65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F", 71: "G", 72: "H",
    73: "I", 74: "J", 75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P",
    81: "Q", 82: "R", 83: "S", 84: "T", 85: "U", 86: "V", 87: "W", 88: "X",
    89: "Y", 90: "Z",

    // Chiffres
    48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7",
    56: "8", 57: "9",

    // Touches fonction
    112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6",
    118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12",

    // Navigation
    37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown",
    33: "PageUp", 34: "PageDown", 36: "Home", 35: "End",

    // Édition
    8: "Backspace", 9: "Tab", 13: "Enter", 27: "Escape", 32: "Space",
    46: "Delete", 45: "Insert",

    // Touches modificatrices
    16: "Shift", 17: "Control", 18: "Alt", 91: "Command", 93: "Command"
};

// État des touches (pour remplacer navigator.keyboard qui n'est pas disponible partout)
const keyState = new Map<string, boolean>();

/**
 * Convertit un code clavier en nom de touche
 */
export function getKeyFromKeyCode(keyCode: number): string | null {
    return keyCodeMap[keyCode] || null;
}

/**
 * Met à jour l'état d'une touche
 * Cette fonction doit être appelée par des gestionnaires d'événements globaux
 */
export function updateKeyState(key: string, isDown: boolean): void {
    keyState.set(key, isDown);
}

/**
 * Vérifie si une touche est actuellement enfoncée
 */
export function isKeyDown(key: string): boolean {
    return keyState.get(key) || false;
}

/**
 * Configure les écouteurs d'événements clavier globaux
 * Cette fonction doit être appelée au démarrage de l'application
 */
export function setupKeyboardListeners(): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
        const key = getKeyFromKeyCode(e.keyCode);
        if (key) {
            updateKeyState(key, true);
        }

        // Gérer également les modificateurs
        if (e.shiftKey) updateKeyState("Shift", true);
        if (e.ctrlKey) updateKeyState("Control", true);
        if (e.altKey) updateKeyState("Alt", true);
        if (e.metaKey) updateKeyState("Command", true);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        const key = getKeyFromKeyCode(e.keyCode);
        if (key) {
            updateKeyState(key, false);
        }

        // Gérer également les modificateurs
        if (!e.shiftKey) updateKeyState("Shift", false);
        if (!e.ctrlKey) updateKeyState("Control", false);
        if (!e.altKey) updateKeyState("Alt", false);
        if (!e.metaKey) updateKeyState("Command", false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Nettoyage lorsque le composant est démonté
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
}

/**
 * Trouve le meilleur raccourci clavier correspondant à la touche et aux modificateurs actifs
 * "Meilleur" signifie celui avec le plus grand nombre de modificateurs
 */
export function findBestShortcut(
    shortcuts: KeyboardShortcut[],
    key: string,
    activeModifiers: Set<ModifierKey>
): KeyboardShortcut | null {
    let bestShortcut: KeyboardShortcut | null = null;
    let nModifierKeys = -1;

    for (const shortcut of shortcuts) {
        if (shortcut.key !== key) {
            continue;
        }

        // Vérifier que tous les modificateurs requis sont actifs
        if (shortcut.modifierKeys) {
            const requiredModifiers = new Set(shortcut.modifierKeys);
            let allModifiersDown = true;

            for (const modKey of requiredModifiers) {
                if (!activeModifiers.has(modKey as ModifierKey)) {
                    allModifiersDown = false;
                    break;
                }
            }

            if (!allModifiersDown) continue;
        }

        // Vérifier qu'il n'y a pas de modificateurs supplémentaires actifs
        // sauf s'ils sont dans optionalModifierKeys
        const optionalModifiers = new Set(shortcut.optionalModifierKeys || []);
        let hasExtraModifiers = false;

        for (const activeModKey of activeModifiers) {
            if (
                !(shortcut.modifierKeys || []).includes(activeModKey) &&
                !optionalModifiers.has(activeModKey)
            ) {
                hasExtraModifiers = true;
                break;
            }
        }

        if (hasExtraModifiers) continue;

        // Raccourci valide, vérifier s'il est meilleur (plus de modificateurs)
        const currNModifierKeys = (shortcut.modifierKeys || []).length;
        if (currNModifierKeys > nModifierKeys) {
            bestShortcut = shortcut;
            nModifierKeys = currNModifierKeys;
        }
    }

    return bestShortcut;
} 
