import { useEffect } from "react";
import { keyboardShortcutRegistry } from "../actions/keyboardShortcutRegistry";

/**
 * Type for defining a keyboard shortcut
 */
interface KeyboardShortcut {
    key: string;
    modifierKeys?: string[];
    name: string;
    fn: (areaId: string, params: any) => void;
    history?: boolean;
}

/**
 * Hook to register keyboard shortcuts for an area type
 */
export function useAreaKeyboardShortcuts(
    areaType: string,
    shortcuts: KeyboardShortcut[]
): void {
    useEffect(() => {
        // Register shortcuts in the global registry
        keyboardShortcutRegistry.registerShortcuts(areaType, shortcuts);

        // Clean up shortcuts on unmount
        return () => {
            keyboardShortcutRegistry.unregisterShortcuts(areaType);
        };
    }, [areaType, shortcuts]);
} 
