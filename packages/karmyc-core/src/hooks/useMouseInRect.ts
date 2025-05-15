import { useEffect, useState } from "react";
import { Rect } from "../types/geometry";

/**
 * Hook that checks if the mouse is inside a specified rectangle
 * Useful for determining if a keyboard shortcut should be activated in an area
 */
export function useMouseInRect(rect: Rect) {
    const [isInRect, setIsInRect] = useState(false);

    useEffect(() => {
        // Ensure right and bottom properties are calculated
        const rectWithBounds = {
            ...rect,
            right: rect.right !== undefined ? rect.right : rect.left + rect.width,
            bottom: rect.bottom !== undefined ? rect.bottom : rect.top + rect.height
        };

        const handleMouseMove = (e: MouseEvent) => {
            const mousePosition = { x: e.clientX, y: e.clientY };

            // Use right and bottom if available, otherwise calculate from left, top, width, height
            const inRect = (
                mousePosition.x >= rectWithBounds.left &&
                mousePosition.x <= rectWithBounds.right &&
                mousePosition.y >= rectWithBounds.top &&
                mousePosition.y <= rectWithBounds.bottom
            );

            setIsInRect(inRect);
        };

        // Check initial mouse position
        if (typeof document !== 'undefined') {
            // Get current mouse position rather than creating an artificial event
            try {
                const mouseEvent = new MouseEvent('mousemove', {
                    clientX: document.documentElement.scrollLeft,
                    clientY: document.documentElement.scrollTop
                });
                handleMouseMove(mouseEvent);
            } catch (error) {
                console.warn("Unable to check initial mouse position", error);
            }
        }

        // Listen to mouse movements
        window.addEventListener("mousemove", handleMouseMove);

        // Clean up event listener on unmount
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, [rect.left, rect.top, rect.width, rect.height, rect.right, rect.bottom]);

    return isInRect;
} 
