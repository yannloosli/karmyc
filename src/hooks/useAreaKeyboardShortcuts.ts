import { useEffect } from "react";
import { keyboardShortcutRegistry } from "../store/registries/keyboardShortcutRegistry";

/**
 * Type pour définir un raccourci clavier
 */
interface KeyboardShortcut {
    key: string;
    modifierKeys?: string[];
    name: string;
    fn: (areaId: string, params: any) => void;
    history?: boolean;
}

/**
 * Hook pour enregistrer des raccourcis clavier pour un type de zone
 * 
 * @param areaType - Type de zone pour lequel enregistrer les raccourcis
 * @param shortcuts - Liste des raccourcis à enregistrer
 */
export function useAreaKeyboardShortcuts(
    areaType: string,
    shortcuts: KeyboardShortcut[]
): void {
    useEffect(() => {
        // Enregistrer les raccourcis dans le registre global
        keyboardShortcutRegistry.registerShortcuts(areaType, shortcuts);

        // Nettoyer les raccourcis au démontage
        return () => {
            keyboardShortcutRegistry.unregisterShortcuts(areaType);
        };
    }, [areaType, shortcuts]);
} 
