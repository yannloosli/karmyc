import { Rect, AreaLayout, AreaRowLayout } from "../types";

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
    // Create a deep mutable copy of the layout with type assertion
    const mutableLayout = JSON.parse(JSON.stringify(layout)) as { [key: string]: AreaLayout | AreaRowLayout };

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
            // Do not assign a viewport if the received size is invalid
            return;
        }

        visitedIds.add(area.id);
        areaToViewport[area.id] = { ...contentArea };
    }

    function computeRow(row: AreaRowLayout, contentArea: { left: number; top: number; width: number; height: number }) {

        if (!row || !contentArea || visitedIds.has(row.id)) {
            // Simplified initial checks
            if (row && visitedIds.has(row.id)) return; // Already processed
            if (!row) { console.error("computeRow: Invalid row"); return; }
            if (!contentArea) { console.error("computeRow: Invalid contentArea for row", row.id); return; }
            // Continue validation...
        }
        visitedIds.add(row.id);

        // Additional check for areas array
        if (!row.areas || !Array.isArray(row.areas)) {
            console.error("Row without proper areas array in computeRow", { rowId: row.id, areas: row.areas });
            row.areas = [];
        }

        // Check contentArea size validity
        if (contentArea.width <= 0 || contentArea.height <= 0) {
            console.error("ContentArea with invalid dimensions in computeRow", { rowId: row.id, contentArea });
            // Attempt recovery or return
            contentArea = {
                ...contentArea,
                width: Math.max(contentArea.width, 10), // Min width 10
                height: Math.max(contentArea.height, 10) // Min height 10
            };
            console.warn("Corrected contentArea to minimum size for row", row.id, contentArea);
        }

        if (row.areas.length === 0) {
            console.warn("Row with empty areas array in computeRow, skipping children but assigning viewport", { rowId: row.id });
            areaToViewport[row.id] = { ...contentArea };
            return;
        }

        // Assign the full viewport to the parent row itself *before* calculating children
        areaToViewport[row.id] = { ...contentArea };

        // Check in advance for missing IDs in the layout to avoid problems
        const missingAreaIds = row.areas
            .map(area => area.id)
            .filter(id => !mutableLayout[id]);

        if (missingAreaIds.length > 0) {
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
        // @ts-expect-error - hasInvalidSizes is used in the next line
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

        let currentLeft = contentArea.left;
        let currentTop = contentArea.top;
        let totalAllocatedWidth = 0;
        let totalAllocatedHeight = 0;


        for (let i = 0; i < row.areas.length; i++) {
            const areaInfo = row.areas[i];
            // Check if areaInfo and its id are valid
            if (!areaInfo || !areaInfo.id) {
                continue; // Skip this iteration
            }
            const areaId = areaInfo.id;
            const layoutItem = mutableLayout[areaId];
            const isLastArea = i === row.areas.length - 1;

            if (!layoutItem) {
                continue;
            }

            let areaWidth: number;
            let areaHeight: number;

            if (row.orientation === "horizontal") {
                areaHeight = contentArea.height;
                if (isLastArea) {
                    areaWidth = Math.max(0, contentArea.width - totalAllocatedWidth);
                } else {
                    areaWidth = Math.max(0, Math.floor(areaInfo.size * contentArea.width));
                    totalAllocatedWidth += areaWidth;
                }
            } else { // Vertical
                areaWidth = contentArea.width;
                if (isLastArea) {
                    areaHeight = Math.max(0, contentArea.height - totalAllocatedHeight);
                } else {
                    areaHeight = Math.max(0, Math.floor(areaInfo.size * contentArea.height));
                    totalAllocatedHeight += areaHeight;
                }
            }

            const nextAreaViewport: Rect = {
                left: currentLeft,
                top: currentTop,
                width: areaWidth,
                height: areaHeight
            };

            // Recursive call
            try {
                if (layoutItem.type === "area") {
                    computeArea(layoutItem, nextAreaViewport);
                } else if (layoutItem.type === "area_row") {
                    computeRow(layoutItem, nextAreaViewport);
                }
            } catch (error) {
                console.error(`[computeRow RECURSE_ERROR ${i}] Error computing viewport for area ${areaId}:`, error);
            }

            // Update position for the next iteration
            if (row.orientation === "horizontal") {
                currentLeft += areaWidth;
            } else { // Vertical
                currentTop += areaHeight;
            }
        }
    }

    // Calculate the initial viewport for the root
    const rootLayoutItem = mutableLayout[rootId];
    if (rootLayoutItem.type === "area") {
        computeArea(rootLayoutItem, viewport);
    } else if (rootLayoutItem.type === "area_row") {
        computeRow(rootLayoutItem, viewport);
    }

    // Get all missing IDs
    const idsWithoutViewport = Object.keys(mutableLayout).filter(id => !areaToViewport[id]);

    // If IDs are missing in viewports, we can try one last calculation pass
    if (idsWithoutViewport.length > 0) {
        // Try to calculate again using alternative parent-child relationships
        idsWithoutViewport.forEach(id => {
            // If no viewport was calculated, use a default viewport
            if (!areaToViewport[id]) {
                viewportCalculationHistory.failedIds.add(id);
                areaToViewport[id] = {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 100
                };
            }
        });
    }

    return areaToViewport;
}; 
