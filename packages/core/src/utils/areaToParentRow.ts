// Import AreaState from the correct store if needed, or just specific types
// import { AreaState } from "../store/slices/areaSlice"; // REMOVE Redux import
import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

// Updated function signature to accept layout and rootId directly
export function computeAreaToParentRow(
    layout: { [key: string]: AreaRowLayout | AreaLayout },
    rootId: string | null // Keep rootId in case needed for traversal logic later, though unused now
): { [key: string]: string } {
    const areaToParentRow: { [key: string]: string } = {};

    // Add a guard clause to handle null or undefined layout
    if (!layout) {
        console.error("computeAreaToParentRow received null or undefined layout.");
        return {}; // Return an empty map if layout is invalid
    }

    // Use Object.keys directly on the layout object
    const keys = Object.keys(layout);
    for (let i = 0; i < keys.length; i += 1) {
        const layoutItem = layout[keys[i]];

        // Check if the layout item itself is valid before accessing type
        if (!layoutItem || layoutItem.type !== "area_row") {
            continue;
        }

        // Cast to AreaRowLayout after checking type
        const rowLayout = layoutItem as AreaRowLayout;

        // Check if areas array exists and is an array
        if (rowLayout.areas && Array.isArray(rowLayout.areas)) {
            for (let j = 0; j < rowLayout.areas.length; j += 1) {
                // Check if area info and id exist
                if (rowLayout.areas[j] && rowLayout.areas[j].id) {
                    areaToParentRow[rowLayout.areas[j].id] = rowLayout.id;
                }
            }
        }
    }

    return areaToParentRow;
} 
