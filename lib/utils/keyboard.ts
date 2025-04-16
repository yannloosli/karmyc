import { keyboardShortcutRegistry } from "../store/registries/keyboardShortcutRegistry";
import { KeyboardShortcut } from "../types";

/**
 * List of supported modifier keys
 */
export const modifierKeys = ["Command", "Alt", "Shift", "Control"] as const;
export type ModifierKey = typeof modifierKeys[number];

/**
 * Mapping between key codes and key names
 * This list is partial and should be extended as needed
 */
const keyCodeMap: Record<number, string> = {
    // Letters
    65: "A", 66: "B", 67: "C", 68: "D", 69: "E", 70: "F", 71: "G", 72: "H",
    73: "I", 74: "J", 75: "K", 76: "L", 77: "M", 78: "N", 79: "O", 80: "P",
    81: "Q", 82: "R", 83: "S", 84: "T", 85: "U", 86: "V", 87: "W", 88: "X",
    89: "Y", 90: "Z",

    // Numbers
    48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6", 55: "7",
    56: "8", 57: "9",

    // Function keys
    112: "F1", 113: "F2", 114: "F3", 115: "F4", 116: "F5", 117: "F6",
    118: "F7", 119: "F8", 120: "F9", 121: "F10", 122: "F11", 123: "F12",

    // Navigation
    37: "ArrowLeft", 38: "ArrowUp", 39: "ArrowRight", 40: "ArrowDown",
    33: "PageUp", 34: "PageDown", 36: "Home", 35: "End",

    // Editing
    8: "Backspace", 9: "Tab", 13: "Enter", 27: "Escape", 32: "Space",
    46: "Delete", 45: "Insert",

    // Modifier keys
    16: "Shift", 17: "Control", 18: "Alt", 91: "Command", 93: "Command"
};

// Key state (to replace navigator.keyboard which is not available everywhere)
const keyState = new Map<string, boolean>();

/**
 * Converts a key code to a key name
 */
export function getKeyFromKeyCode(keyCode: number): string | null {
    return keyCodeMap[keyCode] || null;
}

/**
 * Checks if a key code corresponds to a specific key
 */
export function isKeyCodeOf(key: string, keyCode: number): boolean {
    const mappedKey = keyCodeMap[keyCode];
    return mappedKey === key;
}

/**
 * Updates the state of a key
 * This function should be called by global event handlers
 */
export function updateKeyState(key: string, isDown: boolean): void {
    keyState.set(key, isDown);
}

/**
 * Checks if a key is currently pressed
 */
export function isKeyDown(key: string): boolean {
    return keyState.get(key) || false;
}

/**
 * Sets up global keyboard event listeners
 * This function should be called at application startup
 */
export function setupKeyboardListeners(): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {

        // Handle modifiers immediately
        if (e.ctrlKey) updateKeyState("Control", true);
        if (e.shiftKey) updateKeyState("Shift", true);
        if (e.altKey) updateKeyState("Alt", true);
        if (e.metaKey) updateKeyState("Command", true);

        // Get the key from the code or directly from the key name
        let key = getKeyFromKeyCode(e.keyCode);
        if (!key && e.key) {
            // If getKeyFromKeyCode fails, use e.key
            key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
        }

        if (key) {
            // Update state
            updateKeyState(key, true);

            // Get active modifiers
            const activeModifiers = new Set<ModifierKey>();
            if (e.ctrlKey) activeModifiers.add("Control");
            if (e.shiftKey) activeModifiers.add("Shift");
            if (e.altKey) activeModifiers.add("Alt");
            if (e.metaKey) activeModifiers.add("Command");

            // Check if we should prevent default behavior
            const shouldPreventDefault = checkShouldPreventDefault(key, activeModifiers);
            if (shouldPreventDefault) {
                e.preventDefault();
                e.stopPropagation();
            }

            // Check and execute matching shortcuts
            checkAndExecuteShortcuts(key);
        }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
        const key = getKeyFromKeyCode(e.keyCode);
        if (key) {
            updateKeyState(key, false);
        }

        // Also handle modifiers
        if (!e.shiftKey) updateKeyState("Shift", false);
        if (!e.ctrlKey) updateKeyState("Control", false);
        if (!e.altKey) updateKeyState("Alt", false);
        if (!e.metaKey) updateKeyState("Command", false);
    };

    // Ensure our handlers are executed first to intercept events
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    window.addEventListener('keyup', handleKeyUp, { capture: true });

    // Cleanup when component is unmounted
    return () => {
        window.removeEventListener('keydown', handleKeyDown, { capture: true });
        window.removeEventListener('keyup', handleKeyUp, { capture: true });
    };
}

/**
 * Checks if we should prevent the browser's default behavior
 * for the given key combination
 */
function checkShouldPreventDefault(key: string, activeModifiers: Set<ModifierKey>): boolean {
    // Shortcuts to intercept
    const shortcutsToIntercept = [
        { key: 'R', modifiers: ['Control'] },  // Ctrl+R (Refresh)
        { key: 'S', modifiers: ['Control'] },  // Ctrl+S (Save)
        { key: 'P', modifiers: ['Control'] },  // Ctrl+P (Print)
        { key: 'F', modifiers: ['Control'] },  // Ctrl+F (Find)
    ];

    // Convert key and modifiers for case-insensitive comparison
    const lowerKey = key.toLowerCase();

    // Check if the combination matches a shortcut to intercept
    for (const shortcut of shortcutsToIntercept) {
        // Compare keys case-insensitively
        if (key === shortcut.key || lowerKey === shortcut.key.toLowerCase()) {

            // Check if all required modifiers are active
            const requiredModifiers = new Set(shortcut.modifiers);
            let allModifiersMatch = true;

            // Verify that all required modifiers are active
            for (const modKey of requiredModifiers) {
                if (!activeModifiers.has(modKey as ModifierKey)) {
                    allModifiersMatch = false;
                    break;
                }
            }

            // Check that there are no additional modifiers
            if (allModifiersMatch) {
                // Allow additional modifiers if needed
                // (e.g. Ctrl+Shift+S should also be intercepted if we want to intercept Ctrl+S)
                return true;
            }
        }
    }

    return false;
}

/**
 * Checks and executes keyboard shortcuts matching the pressed key
 */
function checkAndExecuteShortcuts(key: string): void {
    // Get active modifiers
    const activeModifiers = new Set<ModifierKey>();
    for (const modKey of modifierKeys) {
        if (isKeyDown(modKey)) {
            activeModifiers.add(modKey);
        }
    }

    // Get the active area ID
    let activeAreaId = null;
    let activeAreaType = null;

    try {
        // Try to access the store to get the active area
        const store = (window as any).store;
        if (store && store.getState) {
            const state = store.getState();
            if (state && state.area) {
                activeAreaId = state.area.activeAreaId;
                if (activeAreaId && state.area.areas[activeAreaId]) {
                    activeAreaType = state.area.areas[activeAreaId].type;
                }
            }
        } else {
            console.warn("Store not available for keyboard shortcuts");
        }
    } catch (error) {
        console.error("Error accessing active area:", error);
    }

    if (!activeAreaId || !activeAreaType) {
        return;
    }

    // Get shortcuts for this area type
    const shortcuts = keyboardShortcutRegistry.getShortcuts(activeAreaType);

    shortcuts ? shortcuts.map(s => `${s.key} (${s.modifierKeys?.join('+') || ''})`) : "None";

    if (!shortcuts || shortcuts.length === 0) {
        return;
    }

    // Find the best matching shortcut
    const bestShortcut = findBestShortcut(shortcuts, key, activeModifiers);

    if (bestShortcut) {
        // Execute the shortcut function with the active area ID
        try {
            bestShortcut.fn(activeAreaId, {});
        } catch (error) {
            console.error(`Error executing shortcut ${bestShortcut.name}:`, error);
        }
    }
}

/**
 * Finds the best keyboard shortcut matching the key and active modifiers
 * "Best" means the one with the highest number of modifiers
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

        // Check that all required modifiers are active
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

        // Check that there are no additional active modifiers
        // unless they are in optionalModifierKeys
        const optionalModifiers = new Set<string>([]); // If optionalModifierKeys doesn't exist, use an empty set

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

        // Valid shortcut, check if it's better (more modifiers)
        const currNModifierKeys = (shortcut.modifierKeys || []).length;
        if (currNModifierKeys > nModifierKeys) {
            bestShortcut = shortcut;
            nModifierKeys = currNModifierKeys;
        }
    }

    return bestShortcut;
} 
