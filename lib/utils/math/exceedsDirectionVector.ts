import { Vec2 } from "./vec2";

export function exceedsDirectionVector(
    direction: { x: number; y: number },
    threshold: number,
    moveVec: Vec2,
): "x" | "y" | "" {
    // Normalize the direction vector
    const length = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
    const normalizedDir = {
        x: direction.x / length,
        y: direction.y / length
    };

    // Calculate the projection of the movement vector on the direction vector
    const dot = moveVec.x * normalizedDir.x + moveVec.y * normalizedDir.y;

    // Reduce the threshold for better sensitivity
    const adjustedThreshold = threshold * 0.5;

    // If the projection is larger than the adjusted threshold
    if (Math.abs(dot) > adjustedThreshold) {
        // Determine which axis has the largest movement
        const absX = Math.abs(moveVec.x);
        const absY = Math.abs(moveVec.y);

        return absX > absY ? "x" : "y";
    }

    return "";
}
