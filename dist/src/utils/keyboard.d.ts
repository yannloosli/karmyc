import { KeyboardShortcut } from "../store/registries/keyboardShortcutRegistry";
/**
 * List of supported modifier keys
 */
export declare const modifierKeys: readonly ["Command", "Alt", "Shift", "Control"];
export type ModifierKey = typeof modifierKeys[number];
/**
 * Converts a key code to a key name
 */
export declare function getKeyFromKeyCode(keyCode: number): string | null;
/**
 * Updates the state of a key
 * This function should be called by global event handlers
 */
export declare function updateKeyState(key: string, isDown: boolean): void;
/**
 * Checks if a key is currently pressed
 */
export declare function isKeyDown(key: string): boolean;
/**
 * Checks if we should prevent the browser's default behavior
 * for the given key combination
 */
export declare function checkShouldPreventDefault(key: string, activeModifiers: Set<ModifierKey>): boolean;
/**
 * Checks and executes keyboard shortcuts matching the pressed key
 */
export declare function checkAndExecuteShortcuts(key: string): void;
/**
 * Finds the best keyboard shortcut matching the key and active modifiers
 * "Best" means the one with the highest number of modifiers
 */
export declare function findBestShortcut(shortcuts: KeyboardShortcut[], key: string, activeModifiers: Set<ModifierKey>): KeyboardShortcut | null;
