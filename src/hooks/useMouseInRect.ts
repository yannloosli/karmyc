import { useEffect, useState } from "react";
import { Rect } from "../types/geometry";

/**
 * Hook qui vérifie si la souris est à l'intérieur d'un rectangle spécifié
 * Utile pour déterminer si un raccourci clavier doit être activé dans une zone
 * 
 * @param rect Le rectangle à vérifier
 * @returns Un booléen indiquant si la souris est dans le rectangle
 */
export function useMouseInRect(rect: Rect) {
    const [isInRect, setIsInRect] = useState(false);

    useEffect(() => {
        // S'assurer que les propriétés right et bottom sont calculées
        const rectWithBounds = {
            ...rect,
            right: rect.right !== undefined ? rect.right : rect.left + rect.width,
            bottom: rect.bottom !== undefined ? rect.bottom : rect.top + rect.height
        };

        const handleMouseMove = (e: MouseEvent) => {
            const mousePosition = { x: e.clientX, y: e.clientY };

            // Utiliser right et bottom si disponibles, sinon calculer à partir de left, top, width, height
            const inRect = (
                mousePosition.x >= rectWithBounds.left &&
                mousePosition.x <= rectWithBounds.right &&
                mousePosition.y >= rectWithBounds.top &&
                mousePosition.y <= rectWithBounds.bottom
            );

            setIsInRect(inRect);
        };

        // Vérifier la position initiale de la souris
        if (typeof document !== 'undefined') {
            // Récupérer la position actuelle de la souris plutôt que de créer un événement artificiel
            try {
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: document.documentElement.scrollLeft,
                    clientY: document.documentElement.scrollTop
                });
                handleMouseMove(mouseEvent);
            } catch (error) {
                console.warn("Impossible de vérifier la position initiale de la souris", error);
            }
        }

        // Écouter les mouvements de souris
        window.addEventListener("mousemove", handleMouseMove);

        // Nettoyer l'écouteur d'événements lors du démontage
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [rect.left, rect.top, rect.width, rect.height, rect.right, rect.bottom]);

    return isInRect;
} 
