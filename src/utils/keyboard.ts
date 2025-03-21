import { keyboardShortcutRegistry } from "../store/registries/keyboardShortcutRegistry";
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
 * Vérifie si un code clavier correspond à une touche spécifique
 */
export function isKeyCodeOf(key: string, keyCode: number): boolean {
    const mappedKey = keyCodeMap[keyCode];
    return mappedKey === key;
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
        console.log(`KeyDown - keyCode: ${e.keyCode}, key: ${e.key}, ctrl: ${e.ctrlKey}, shift: ${e.shiftKey}, alt: ${e.altKey}, meta: ${e.metaKey}`);

        // Gérer les modificateurs immédiatement
        if (e.ctrlKey) updateKeyState("Control", true);
        if (e.shiftKey) updateKeyState("Shift", true);
        if (e.altKey) updateKeyState("Alt", true);
        if (e.metaKey) updateKeyState("Command", true);

        // Récupérer la touche depuis le code ou le nom de la touche directement
        let key = getKeyFromKeyCode(e.keyCode);
        if (!key && e.key) {
            // Si getKeyFromKeyCode échoue, utiliser e.key
            key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        }

        if (key) {
            // Mettre à jour l'état
            updateKeyState(key, true);

            // Récupérer les modificateurs actifs
            const activeModifiers = new Set<ModifierKey>();
            if (e.ctrlKey) activeModifiers.add("Control");
            if (e.shiftKey) activeModifiers.add("Shift");
            if (e.altKey) activeModifiers.add("Alt");
            if (e.metaKey) activeModifiers.add("Command");

            console.log(`Touche détectée: ${key}, modificateurs:`, Array.from(activeModifiers));

            // Vérifier si on doit empêcher le comportement par défaut
            const shouldPreventDefault = checkShouldPreventDefault(key, activeModifiers);
            if (shouldPreventDefault) {
                console.log(`⛔ PRÉVENTION du comportement par défaut pour ${key} + ${Array.from(activeModifiers).join('+')}`);
                e.preventDefault();
                e.stopPropagation();
            }

            // Vérifier et exécuter les raccourcis correspondants
            checkAndExecuteShortcuts(key);
        }
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

    // S'assurer que nos gestionnaires sont exécutés en premier pour intercepter les événements
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    // Nettoyage lorsque le composant est démonté
    return () => {
        window.removeEventListener('keydown', handleKeyDown, { capture: true });
        window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
}

/**
 * Vérifie si on doit empêcher le comportement par défaut du navigateur
 * pour la combinaison de touches donnée
 */
function checkShouldPreventDefault(key: string, activeModifiers: Set<ModifierKey>): boolean {
    // Raccourcis à intercepter
    const shortcutsToIntercept = [
        { key: 'R', modifiers: ['Control'] },  // Ctrl+R (Refresh)
        { key: 'S', modifiers: ['Control'] },  // Ctrl+S (Save)
        { key: 'P', modifiers: ['Control'] },  // Ctrl+P (Print)
        { key: 'F', modifiers: ['Control'] },  // Ctrl+F (Find)
    ];

    console.log(`checkShouldPreventDefault - Touche: ${key}, Modificateurs:`, Array.from(activeModifiers));

    // Convertir key et modificateurs pour une comparaison insensible à la casse
    const lowerKey = key.toLowerCase();

    // Vérifier si la combinaison correspond à un raccourci à intercepter
    for (const shortcut of shortcutsToIntercept) {
        // Comparer les touches de manière insensible à la casse
        if (key === shortcut.key || lowerKey === shortcut.key.toLowerCase()) {
            console.log(`Match trouvé avec la touche ${shortcut.key}`);

            // Vérifier si tous les modificateurs requis sont actifs
            const requiredModifiers = new Set(shortcut.modifiers);
            let allModifiersMatch = true;

            // Vérifier que tous les modificateurs requis sont actifs
            for (const modKey of requiredModifiers) {
                if (!activeModifiers.has(modKey as ModifierKey)) {
                    console.log(`Modificateur manquant: ${modKey}`);
                    allModifiersMatch = false;
                    break;
                }
            }

            // Vérifier qu'il n'y a pas de modificateurs supplémentaires
            if (allModifiersMatch) {
                console.log(`Tous les modificateurs requis sont présents.`);

                // Permettre des modificateurs supplémentaires si nécessaire
                // (ex: Ctrl+Shift+S devrait aussi être intercepté si on veut intercepter Ctrl+S)
                return true;
            }
        }
    }

    return false;
}

/**
 * Vérifie et exécute les raccourcis clavier correspondant à la touche pressée
 */
function checkAndExecuteShortcuts(key: string): void {
    console.log(`Touche pressée: ${key}`);

    // Récupérer les modificateurs actifs
    const activeModifiers = new Set<ModifierKey>();
    for (const modKey of modifierKeys) {
        if (isKeyDown(modKey)) {
            activeModifiers.add(modKey);
            console.log(`Modificateur actif: ${modKey}`);
        }
    }

    // Récupérer l'ID de la zone active
    let activeAreaId = null;
    let activeAreaType = null;

    try {
        // Essayer d'accéder au store pour obtenir la zone active
        const store = (window as any).store;
        if (store && store.getState) {
            const state = store.getState();
            if (state && state.area) {
                activeAreaId = state.area.activeAreaId;
                if (activeAreaId && state.area.areas[activeAreaId]) {
                    activeAreaType = state.area.areas[activeAreaId].type;
                    console.log(`Zone active: ${activeAreaId}, Type: ${activeAreaType}`);
                }
            }
        } else {
            console.warn("Store non disponible pour les raccourcis clavier");
        }
    } catch (error) {
        console.error("Erreur lors de l'accès à la zone active:", error);
    }

    if (!activeAreaId || !activeAreaType) {
        console.log("Aucune zone active pour les raccourcis clavier");
        return;
    }

    // Récupérer les raccourcis pour ce type de zone
    const shortcuts = keyboardShortcutRegistry.getShortcuts(activeAreaType);

    console.log(`Raccourcis disponibles pour ${activeAreaType}:`,
        shortcuts ? shortcuts.map(s => `${s.key} (${s.modifierKeys?.join('+') || ''})`) : "Aucun");

    if (!shortcuts || shortcuts.length === 0) {
        return;
    }

    // Trouver le meilleur raccourci correspondant
    const bestShortcut = findBestShortcut(shortcuts, key, activeModifiers);

    if (bestShortcut) {
        console.log(`Exécution du raccourci: ${bestShortcut.name} sur la zone ${activeAreaId}`);
        // Exécuter la fonction du raccourci avec l'ID de la zone active
        try {
            bestShortcut.fn(activeAreaId, {});
        } catch (error) {
            console.error(`Erreur lors de l'exécution du raccourci ${bestShortcut.name}:`, error);
        }
    }
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
        const optionalModifiers = new Set<string>([]); // Si optionalModifierKeys n'existe pas, utiliser un ensemble vide

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
