import { useDispatch } from "react-redux";
import { areaSlice, updateArea } from "../store/slices/areaSlice";
import { CardinalDirection } from "../types/directions";

type Corner = "ne" | "nw" | "se" | "sw";

const cornerToDirections: Record<Corner, [CardinalDirection, CardinalDirection]> = {
    ne: ["n", "e"],
    nw: ["n", "w"],
    se: ["s", "e"],
    sw: ["s", "w"]
};

export const handleAreaDragFromCorner = (
    e: React.MouseEvent,
    corner: Corner,
    id: string,
    viewport: { left: number; top: number; width: number; height: number }
) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;
    const startLeft = viewport.left;
    const startTop = viewport.top;
    const startWidth = viewport.width;
    const startHeight = viewport.height;
    const directionParts = cornerToDirections[corner];
    const dispatch = useDispatch();

    const handleMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        // Si le mouvement dépasse un certain seuil, créer une nouvelle zone
        if (Math.abs(deltaX) > 50 || Math.abs(deltaY) > 50) {
            const horizontal = Math.abs(deltaX) > Math.abs(deltaY);
            dispatch(areaSlice.actions.convertAreaToRow({
                areaId: id,
                cornerParts: directionParts,
                horizontal
            }));
            return;
        }

        let changes: any = {};

        switch (corner) {
        case "ne":
            changes = {
                width: startWidth + deltaX,
                height: startHeight - deltaY,
                top: startTop + deltaY,
            };
            break;
        case "nw":
            changes = {
                width: startWidth - deltaX,
                height: startHeight - deltaY,
                left: startLeft + deltaX,
                top: startTop + deltaY,
            };
            break;
        case "se":
            changes = {
                width: startWidth + deltaX,
                height: startHeight + deltaY,
            };
            break;
        case "sw":
            changes = {
                width: startWidth - deltaX,
                height: startHeight + deltaY,
                left: startLeft + deltaX,
            };
            break;
        }

        // Appliquer les changements avec des limites minimales
        if (changes.width && changes.width < 100) changes.width = 100;
        if (changes.height && changes.height < 100) changes.height = 100;

        dispatch(updateArea({ id, changes }));
    };

    const handleMouseUp = () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
}; 
