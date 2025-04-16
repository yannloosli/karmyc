import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

// Record viewport calculation history to help with debugging
const viewportCalculationHistory = {
    lastCalculation: 0,
    totalCalculations: 0,
    failedIds: new Set<string>(),
    reportedProblems: new Set<string>(),
    reset() {
        this.failedIds.clear();
        this.reportedProblems.clear();
    }
};

// Reset history every 60 seconds
setInterval(() => {
    const now = Date.now();
    if (now - viewportCalculationHistory.lastCalculation > 60000) {
        viewportCalculationHistory.reset();
    }
}, 60000);

// Helper function to check if an object is extensible
function isObjectExtensible(obj: any): boolean {
    try {
        // Try to add a temporary property
        const testKey = `__test_${Date.now()}`;
        obj[testKey] = true;
        delete obj[testKey];
        return true;
    } catch (e) {
        return false;
    }
}

// Helper function to safely clone a layout object
function safeCloneLayout(item: AreaLayout | AreaRowLayout): AreaLayout | AreaRowLayout {
    // Create a basic copy
    const baseClone = { ...item };

    // If it's a row, also clone its areas
    if (item.type === "area_row") {
        const rowItem = item as AreaRowLayout;
        const clonedAreas = rowItem.areas.map(area => {
            if (!area.id) {
                console.warn(`Area in row ${rowItem.id} has no ID`);
            }
            if (typeof area.size !== 'number' || isNaN(area.size)) {
                console.warn(`Area ${area.id} in row ${rowItem.id} has invalid size: ${area.size}`);
            }
            return { ...area };
        });
        return {
            ...baseClone,
            type: "area_row",
            id: rowItem.id,
            orientation: rowItem.orientation,
            areas: clonedAreas
        } as AreaRowLayout;
    }

    // If it's a simple area
    return {
        ...baseClone,
        type: "area",
        id: item.id,
    } as AreaLayout;
}

// Static variable to keep the last valid viewport dimensions
let lastValidViewportSize = { width: 0, height: 0 };

export const computeAreaToViewport = (
    layout: { [key: string]: AreaLayout | AreaRowLayout },
    rootId: string | null,
    viewport: { left: number; top: number; width: number; height: number }
) => {
    // If rootId is null, return an empty object
    if (!rootId) {
        return {};
    }

    const result: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

    // Create a mutable copy of the layout to avoid modifying the original
    const mutableLayout: { [key: string]: AreaLayout | AreaRowLayout } = {};

    // Clone all layout elements to avoid modifying non-extensible objects
    Object.entries(layout).forEach(([id, item]) => {
        mutableLayout[id] = safeCloneLayout(item);
    });

    // Mark the beginning of the calculation
    viewportCalculationHistory.lastCalculation = Date.now();
    viewportCalculationHistory.totalCalculations++;

    // Initial validation of the viewport
    if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
        console.error("Invalid viewport dimensions", viewport);

        // Use the last valid dimensions if available
        if (lastValidViewportSize.width > 0 && lastValidViewportSize.height > 0) {
            console.warn("Using last valid viewport dimensions");
            viewport = {
                ...viewport,
                width: lastValidViewportSize.width,
                height: lastValidViewportSize.height
            };
        } else {
            return {};
        }
    } else {
        // Store valid dimensions
        lastValidViewportSize = { width: viewport.width, height: viewport.height };
    }

    // Layout validation
    if (!layout || Object.keys(layout).length === 0) {
        console.error("Empty layout provided to computeAreaToViewport");
        return {};
    }

    // RootId validation
    if (!rootId || !mutableLayout[rootId]) {
        console.error(`Invalid rootId: ${rootId} - not found in layout`, layout);
        return {};
    }

    const areaToViewport: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

    // List to track visited IDs to avoid infinite loops
    const visitedIds = new Set<string>();
    // List of already reported problematic layouts to avoid duplicate logs
    const reportedProblems = viewportCalculationHistory.reportedProblems;

    // Debug log for the current calculation
    console.debug(`Viewport calculation: rootId=${rootId}, viewportSize=${viewport.width}x${viewport.height}, layoutSize=${Object.keys(mutableLayout).length}`);

    // Check the structure of areas
    Object.entries(mutableLayout).forEach(([id, area]) => {
        if (!area) {
            console.error(`Invalid area definition for id ${id}`, area);
        } else if (area.type === "area_row" && (!area.areas || !Array.isArray(area.areas))) {
            console.error(`Area row ${id} has invalid areas property`, area);
        }
    });

    function computeArea(area: AreaLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        if (!area || !contentArea) {
            console.error("Invalid area or contentArea in computeArea", { area, contentArea });
            return;
        }

        // Avoid recalculating a viewport already visited
        if (visitedIds.has(area.id)) {
            console.debug(`Skipping already visited area ${area.id}`);
            return;
        }

        // Check if the area has a valid type
        if (!area.type) {
            console.warn(`Area ${area.id} has no type, defaulting to 'area'`);
            area.type = 'area';
        }

        // Check if the area has a valid size
        if (contentArea.width <= 0 || contentArea.height <= 0) {
            console.warn(`Area ${area.id} has invalid content area size: ${contentArea.width}x${contentArea.height}`);
            return;
        }

        visitedIds.add(area.id);

        // Ensure dimensions are valid
        const validContentArea = {
            ...contentArea,
            width: Math.max(contentArea.width, 200),
            height: Math.max(contentArea.height, 200)
        };

        areaToViewport[area.id] = { ...validContentArea };
    }

    function computeRow(row: AreaRowLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        if (!row || !contentArea) {
            console.error("Invalid row or contentArea in computeRow", { row, contentArea });
            return;
        }

        // Additional check to ensure the row has a valid ID
        if (!row.id) {
            console.error("Row without ID in computeRow", row);
            return;
        }

        // Additional check for areas
        if (!row.areas || !Array.isArray(row.areas)) {
            console.error("Row without proper areas array in computeRow", { rowId: row.id, areas: row.areas });
            row.areas = []; // Initialize with an empty array to avoid downstream errors
        }

        // Check that the contentArea size is valid
        if (contentArea.width <= 0 || contentArea.height <= 0) {
            console.error("ContentArea with invalid dimensions in computeRow", { rowId: row.id, contentArea });
            // Use a minimum size to avoid downstream errors
            contentArea = {
                ...contentArea,
                width: Math.max(contentArea.width, 200),
                height: Math.max(contentArea.height, 200)
            };
        }

        // If after corrections, there are still no areas, stop here but without error
        if (row.areas.length === 0) {
            console.warn("Row with empty areas array in computeRow, skipping", { rowId: row.id });
            areaToViewport[row.id] = { ...contentArea }; // Still add the viewport for the row
            return;
        }

        // Avoid recalculating a viewport already visited
        if (visitedIds.has(row.id)) {
            return;
        }
        visitedIds.add(row.id);

        // Ensure dimensions are valid and stable
        const validContentArea = {
            ...contentArea,
            width: Math.max(contentArea.width, 200),
            height: Math.max(contentArea.height, 200)
        };

        // Assign the full viewport to the parent row before calculating children
        areaToViewport[row.id] = { ...validContentArea };

        // Check in advance for missing IDs in the layout to avoid problems
        const missingAreaIds = row.areas
            .map(area => area.id)
            .filter(id => !mutableLayout[id]);

        if (missingAreaIds.length > 0) {
            console.debug(`Areas referenced in row ${row.id} but not in layout: ${missingAreaIds.join(', ')}`);

            // Auto-create entries for these missing areas
            missingAreaIds.forEach(id => {
                if (!reportedProblems.has(`auto_creating_${id}`)) {
                    console.warn(`Auto-creating area ${id} referenced in row ${row.id}`);
                    reportedProblems.add(`auto_creating_${id}`);
                }

                mutableLayout[id] = {
                    type: "area",
                    id: id
                };
            });
        }

        // Check and fix invalid sizes
        const MIN_AREA_SIZE = 0.05; // Minimum size of 5% for an area
        let hasInvalidSizes = false;
        let zeroSizeCount = 0;

        // First pass: detect areas with zero or invalid size
        row.areas.forEach((area, i) => {
            // Convert percentage sizes to normalized sizes if needed
            if (area.size > 1) {
                area.size = area.size / 100;
            }

            if (typeof area.size !== 'number' || isNaN(area.size) || area.size <= 0) {
                hasInvalidSizes = true;
                if (area.size === 0) {
                    zeroSizeCount++;
                }
                if (!reportedProblems.has(`${row.id}_${i}_size`)) {
                    console.warn(`Invalid size for area ${area.id}: ${area.size}, defaulting to 1/${row.areas.length}`);
                    reportedProblems.add(`${row.id}_${i}_size`);
                }
                area.size = 1 / row.areas.length;
            } else if (area.size < MIN_AREA_SIZE) {
                // Ensure each area has a minimum size
                if (!reportedProblems.has(`${row.id}_${i}_min_size`)) {
                    console.warn(`Area ${area.id} has very small size: ${area.size}, setting to minimum ${MIN_AREA_SIZE}`);
                    reportedProblems.add(`${row.id}_${i}_min_size`);
                }
                area.size = MIN_AREA_SIZE;
                hasInvalidSizes = true;
            }
        });

        // Ensure the sum of sizes equals exactly 1.0
        const totalArea = row.areas.reduce((acc, area) => acc + (area.size || 0), 0);

        // If all areas have zero size, set equal sizes
        if (totalArea === 0 || zeroSizeCount === row.areas.length) {
            console.warn(`All areas in row ${row.id} have zero size, setting equal distribution`);
            const equalSize = 1.0 / row.areas.length;
            row.areas.forEach(area => {
                area.size = equalSize;
            });
        }
        // If the total is too far from 1.0, normalize the values
        else if (Math.abs(totalArea - 1.0) > 0.001) {
            console.debug(`Normalizing sizes in row ${row.id}: total=${totalArea}, expected=1.0`);
            const normalizationFactor = 1.0 / totalArea;
            row.areas.forEach(area => {
                area.size = area.size * normalizationFactor;
            });
        }

        // Final size check
        const finalTotal = row.areas.reduce((acc, area) => acc + (area.size || 0), 0);
        if (Math.abs(finalTotal - 1.0) > 0.001) {
            console.error(`Failed to normalize sizes in row ${row.id}: final total=${finalTotal}`);
            // In case of failure, use equal distribution
            const equalSize = 1.0 / row.areas.length;
            row.areas.forEach(area => {
                area.size = equalSize;
            });
        }

        let left = validContentArea.left;
        let top = validContentArea.top;
        let remainingWidth = validContentArea.width;
        let remainingHeight = validContentArea.height;

        // Calculate exact positions and dimensions for each area
        for (let i = 0; i < row.areas.length; i++) {
            const area = row.areas[i];
            const layoutItem = mutableLayout[area.id];

            if (!layoutItem) {
                console.warn(`Area ${area.id} not found in layout, skipping`);
                continue;
            }

            // Calculate dimensions based on orientation
            let areaWidth, areaHeight;

            if (row.orientation === "horizontal") {
                areaWidth = Math.max(0, Math.floor(area.size * validContentArea.width));
                areaHeight = validContentArea.height;
            } else {
                areaWidth = validContentArea.width;
                areaHeight = Math.max(0, Math.floor(area.size * validContentArea.height));
            }

            // Ensure we don't exceed the remaining space
            areaWidth = Math.min(areaWidth, remainingWidth);
            areaHeight = Math.min(areaHeight, remainingHeight);

            // Ensure we have minimum dimensions
            areaWidth = Math.max(areaWidth, 10);
            areaHeight = Math.max(areaHeight, 10);

            // If dimensions are invalid, use a default size
            if (areaWidth <= 0 || areaHeight <= 0) {
                console.warn(`Invalid dimensions for area ${area.id}: ${areaWidth}x${areaHeight}, using default size`);
                areaWidth = Math.max(10, Math.floor(validContentArea.width / row.areas.length));
                areaHeight = Math.max(10, validContentArea.height);
            }

            const nextArea = {
                left,
                top,
                width: areaWidth,
                height: areaHeight
            };

            // Update position for the next area
            if (row.orientation === "horizontal") {
                left += areaWidth;
                remainingWidth -= areaWidth;
            } else {
                top += areaHeight;
                remainingHeight -= areaHeight;
            }

            // Recursively calculate viewports for children
            try {
                if (layoutItem.type === "area") {
                    computeArea(layoutItem, nextArea);
                } else if (layoutItem.type === "area_row") {
                    computeRow(layoutItem, nextArea);
                }
            } catch (error) {
                console.error(`Error computing viewport for area ${area.id}:`, error);
            }
        }
    }

    // Calculate the initial viewport for the root
    const rootLayout = mutableLayout[rootId];
    if (rootLayout.type === "area") {
        computeArea(rootLayout, viewport);
    } else if (rootLayout.type === "area_row") {
        computeRow(rootLayout, viewport);
    }

    // Get all missing IDs
    const idsWithoutViewport = Object.keys(mutableLayout).filter(id => !areaToViewport[id]);

    // If IDs are missing in viewports, we can try one last calculation pass
    if (idsWithoutViewport.length > 0) {
        console.debug(`Missing viewports for ${idsWithoutViewport.length} areas, checking for parent relationship`);

        // Try to calculate again using alternative parent-child relationships
        idsWithoutViewport.forEach(id => {
            const layoutItem = mutableLayout[id];

            // Check if we can use the parent-child relationship from computeAreaToParentRow
            // For now, we ignore this case, as parentId doesn't exist in our structure
            // Note: parentId was removed to avoid linter errors
            /* 
            if (layoutItem && layoutItem.parentId && areaToViewport[layoutItem.parentId]) {
                console.debug(`Using parent viewport for ${id} from ${layoutItem.parentId}`);
                areaToViewport[id] = { ...areaToViewport[layoutItem.parentId] };
            }
            */

            // If no viewport was calculated, use a default viewport
            if (!areaToViewport[id]) {
                viewportCalculationHistory.failedIds.add(id);
                areaToViewport[id] = {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 100
                };
                console.debug(`Using default viewport for ${id}`);
            }
        });
    }

    return areaToViewport;
}; 
