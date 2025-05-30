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
    const functionCallId = Math.random().toString(36).substring(2, 7);
    console.log(`[CV START ${functionCallId}] computeAreaToViewport called. rootId:`, rootId, "Layout keys:", Object.keys(layout).join(', '));

    // If rootId is null, return an empty object
    if (!rootId) {
        return {};
    }
    const result: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

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

    console.log(`[CV DETAIL ${functionCallId}] Initial areaToViewport map (should be empty):`, JSON.parse(JSON.stringify(areaToViewport)));

    // Check the structure of areas
    Object.entries(mutableLayout).forEach(([id, area]) => {
        if (!area) {
            console.error(`Invalid area definition for id ${id}`, area);
        } else if (area.type === "area_row" && (!area.areas || !Array.isArray(area.areas))) {
            console.error(`Area row ${id} has invalid areas property`, area);
        }
    });

    function computeArea(area: AreaLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        console.log(`[CV DETAIL ${functionCallId}] computeArea entered for area '${area.id}', type: '${area.type}'. contentArea:`, JSON.parse(JSON.stringify(contentArea)));

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
            // Ne pas assigner de viewport si la taille reçue est invalide
            return;
        }

        visitedIds.add(area.id);
        console.log(`[CV DETAIL ${functionCallId}] computeArea (Leaf): Setting viewport for area '${area.id}'`, JSON.parse(JSON.stringify(contentArea)));
        areaToViewport[area.id] = { ...contentArea };
    }

    function computeRow(row: AreaRowLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        console.log(`[CV DETAIL ${functionCallId}] computeRow entered for row '${row.id}', orientation: '${row.orientation}'. contentArea:`, JSON.parse(JSON.stringify(contentArea)));

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
        console.log(`[CV DETAIL ${functionCallId}] computeRow: Setting viewport for PARENT ROW '${row.id}'`, JSON.parse(JSON.stringify(contentArea)));
        areaToViewport[row.id] = { ...contentArea };
        // console.log('[CV STATE ${functionCallId}] areaToViewport after setting for row ${row.id}: ', JSON.parse(JSON.stringify(areaToViewport)));

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
                    console.log(`[CV DETAIL ${functionCallId}] computeRow ('${row.id}'): Recursing for child area '${areaId}'`);
                    computeArea(layoutItem, nextAreaViewport);
                } else if (layoutItem.type === "area_row") {
                    console.log(`[CV DETAIL ${functionCallId}] computeRow ('${row.id}'): Recursing for child row '${layoutItem.id}'`);
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
        console.log(`[CV DETAIL ${functionCallId}] computeAreaToViewport: Calculating viewport for root area '${rootId}'`);
        computeArea(rootLayoutItem, viewport);
    } else if (rootLayoutItem.type === "area_row") {
        console.log(`[CV DETAIL ${functionCallId}] computeAreaToViewport: Calculating viewport for root row '${rootId}'`);
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

    console.log(`[CV END ${functionCallId}] computeAreaToViewport: FINAL map to be returned:`, JSON.parse(JSON.stringify(areaToViewport)));
    return areaToViewport;
}; 
