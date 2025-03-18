import { Vec2 } from "./vec2";

export function exceedsDirectionVector(
    direction: { x: number; y: number },
    threshold: number,
    moveVec: Vec2,
): "x" | "y" | "" {
    // Normaliser le vecteur de direction
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDir = {
        x: direction.x / length,
        y: direction.y / length
    };

    // Calculer la projection du vecteur de mouvement sur le vecteur de direction
    const dot = moveVec.x * normalizedDir.x + moveVec.y * normalizedDir.y;

    // Réduire le seuil pour une meilleure sensibilité
    const adjustedThreshold = threshold * 0.5;

    // Si la projection est plus grande que le seuil ajusté
    if (Math.abs(dot) > adjustedThreshold) {
        // Déterminer quel axe a le plus grand mouvement
        const absX = Math.abs(moveVec.x);
        const absY = Math.abs(moveVec.y);

        console.log('Exceeds calculation:', {
            moveVec,
            direction,
            dot,
            adjustedThreshold,
            absX,
            absY
        });

        return absX > absY ? "x" : "y";
    }

    return "";
}
