type DirectionVector = { x: number; y: number };

const isNegative = (n: number) => n < 0;

/**
 * The `vec` exceeds the `DirectionVector` if it travels at least `distance`
 * in the direction of the `DirectionVector`.
 *
 * Exceeding meaning greater than or equal.
 */
export const exceedsDirectionVector = (
    directionVec: DirectionVector,
    distance: number,
    vec: Vec2,
): "x" | "y" | "" => {
    // Vérifier l'axe X si le vecteur de direction a une composante X
    if (directionVec.x !== 0) {
        // Pour un mouvement vers la droite (directionVec.x > 0), vec.x doit être positif
        // Pour un mouvement vers la gauche (directionVec.x < 0), vec.x doit être négatif
        if (Math.abs(vec.x) >= distance && Math.sign(vec.x) === Math.sign(directionVec.x)) {
            return "x";
        }
    }

    // Vérifier l'axe Y si le vecteur de direction a une composante Y
    if (directionVec.y !== 0) {
        // Pour un mouvement vers le bas (directionVec.y > 0), vec.y doit être positif
        // Pour un mouvement vers le haut (directionVec.y < 0), vec.y doit être négatif
        if (Math.abs(vec.y) >= distance && Math.sign(vec.y) === Math.sign(directionVec.y)) {
            return "y";
        }
    }

    return "";
};
