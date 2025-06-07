import { useEffect } from "react";
import { KeyboardShortcut, keyboardShortcutRegistry } from "../store/registries/keyboardShortcutRegistry";


/**
 * Hook to register keyboard shortcuts for an area type
 */
export function useAreaKeyboardShortcuts(
    areaType: string,
    shortcuts: KeyboardShortcut[]
): void {
    useEffect(() => {
        // Ajouter le areaType à chaque raccourci
        const shortcutsWithAreaType = shortcuts.map(shortcut => ({
            ...shortcut,
            areaType: shortcut.isGlobal ? undefined : areaType
        }));

        // Enregistrer les raccourcis
        keyboardShortcutRegistry.registerShortcuts(areaType, shortcutsWithAreaType);

        // Nettoyer lors du démontage
        return () => {
            keyboardShortcutRegistry.unregisterShortcuts(areaType);
        };
    }, [areaType, shortcuts]);
} 
