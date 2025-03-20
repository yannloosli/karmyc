import { useEffect, useRef } from "react";
import { AreaType } from "../constants";
import { keyboardShortcutRegistry } from "../store/registries/keyboardShortcutRegistry";
import { Rect } from "../types/geometry";
import { findBestShortcut, getKeyFromKeyCode, isKeyDown, modifierKeys, setupKeyboardListeners } from "../utils/keyboard";
import { requestAction, ShouldAddToStackFn } from "../utils/requestAction";
import { useMouseInRect } from "./useMouseInRect";

/**
 * Hook pour gérer les raccourcis clavier dans une zone spécifique
 * Adapté de la version originale pour fonctionner avec la nouvelle architecture
 * 
 * @param areaId ID de la zone
 * @param areaType Type de la zone
 * @param viewport Rectangle de la zone visible
 */
export const useAreaKeyboardShortcuts = (areaId: string, areaType: AreaType, viewport: Rect) => {
    // Garder une référence à jour du viewport
    const viewportRef = useRef(viewport);
    viewportRef.current = viewport;

    // Vérifier si la souris est dans le viewport
    const isMouseInRect = useMouseInRect(viewport);

    // Ref pour les actions en cours d'exécution (éviter les conflits)
    const isActionInProgressRef = useRef(false);

    useEffect(() => {
        // Récupérer les raccourcis du registre
        const keyboardShortcuts = keyboardShortcutRegistry.getShortcuts(areaType);

        // Configuration des écouteurs de clavier globaux
        const cleanupKeyboardListeners = setupKeyboardListeners();

        // Fonction de gestionnaire de clavier
        const handleKeyDown = (e: KeyboardEvent) => {
            // Si une action est déjà en cours ou si la souris n'est pas dans la zone, ignorer
            if (isActionInProgressRef.current || !isMouseInRect) return;

            const key = getKeyFromKeyCode(e.keyCode);
            if (!key) return;

            // Déterminer les modificateurs actifs
            const activeModifiers = new Set(
                modifierKeys.filter(mod => isKeyDown(mod))
            );

            // Trouver le meilleur raccourci correspondant
            const shortcut = findBestShortcut(keyboardShortcuts, key, activeModifiers);
            if (!shortcut) return;

            // Empêcher le comportement par défaut du navigateur
            e.preventDefault();
            e.stopPropagation();

            const { history = true } = shortcut;

            // Configuration de la fonction shouldAddToStack si nécessaire
            let shouldAddToStack: ShouldAddToStackFn | undefined;

            if (shortcut.shouldAddToStack) {
                shouldAddToStack = (prevState, nextState) => {
                    return shortcut.shouldAddToStack!(areaId, prevState, nextState);
                };
            }

            // Marquer qu'une action est en cours
            isActionInProgressRef.current = true;

            // Exécuter l'action avec la gestion de l'historique
            requestAction({ history, shouldAddToStack }, (params) => {
                try {
                    shortcut.fn(areaId, params);
                    params.submitAction(shortcut.name);
                } catch (error) {
                    console.error(`Erreur lors de l'exécution du raccourci clavier: ${shortcut.name}`, error);
                    params.cancelAction();
                } finally {
                    // Réinitialiser le flag après l'exécution de l'action
                    setTimeout(() => {
                        isActionInProgressRef.current = false;
                    }, 50); // Petit délai pour éviter les déclenchements multiples
                }
            });
        };

        // Ajouter l'écouteur d'événements clavier
        window.addEventListener("keydown", handleKeyDown, { capture: true });

        // Nettoyer les écouteurs lors du démontage
        return () => {
            window.removeEventListener("keydown", handleKeyDown, { capture: true });
            cleanupKeyboardListeners();
        };
    }, [areaId, areaType, isMouseInRect]);
}; 
