import type { WritableDraft } from 'immer';
import { create, StateCreator } from 'zustand'; // Ensure StateCreator is imported
import { immer } from 'zustand/middleware/immer';
// Import Vec2 directly from source to match expected type in utils
import { Vec2 } from '../../../shared/src/math/vec2';
import { AreaTypeValue, TOOLBAR_HEIGHT } from '../constants';
import { Area, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types/geometry';
// ADD BACK Util imports
import { computeAreaToParentRow } from '../utils/areaToParentRow';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';
import { joinAreas as joinAreasUtil } from '../utils/joinArea';
import { validateArea } from '../utils/validation';
// import { performance } from './middleware/performanceMiddleware'; // Keep commented for now
import { devtools, persist } from 'zustand/middleware';



// --- Define Join Preview State Type (kept for AreaSliceStateData) ---
export interface JoinPreviewState {
    areaId: string | null;
    movingInDirection: CardinalDirection | null;
    eligibleAreaIds: string[];
}

// --- Define Split Result Type (kept for AreaSliceStateData) ---
interface SplitResult {
    newRowId: string;
    separatorIndex: number;
}

// --- Define the state structure for the Areas SLICE (Data only for now) ---
// This will hold the data previously managed by AreaState, per screen
export interface AreaSliceStateData {
    _id: number; // Unique ID counter *within* this slice for this screen
    rootId: string | null;
    errors: string[];
    activeAreaId: string | null; // Area focused *within* this screen
    joinPreview: JoinPreviewState | null;
    layout: {
        [key: string]: AreaRowLayout | AreaLayout;
    };
    areas: {
        [key: string]: Area<AreaTypeValue>;
    };
    viewports: { // Viewports are likely screen-specific
        [key: string]: Rect;
    };
    areaToOpen: null | {
        position: Point;
        area: {
            type: string;
            state: any & { sourceId?: string };
        };
    };
    lastSplitResultData: SplitResult | null;
}

// --- Define the initial DATA state for the Area slice ---
const initialAreaStateData: AreaSliceStateData = {
    _id: 0,
    rootId: null,
    errors: [],
    activeAreaId: null,
    joinPreview: null,
    layout: {},
    areas: {},
    viewports: {},
    areaToOpen: null,
    lastSplitResultData: null,
};


// --- Define the FULL state structure for the Areas SLICE ---
// Includes data and actions/selectors signatures
export interface AreaSliceState extends AreaSliceStateData {
    // Actions (signatures only, implementation in createAreaSlice)
    addArea: (area: Area<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<Area<AreaTypeValue>> & { id: string }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: () => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: { rowId: string; sizes: number[] }) => void;
    splitArea: (payload: {
        areaIdToSplit: string;
        parentRowId: string | null;
        horizontal: boolean;
        corner: IntercardinalDirection;
    }) => SplitResult | null;
    setJoinPreview: (payload: JoinPreviewState | null) => void;
    joinOrMoveArea: (payload: {
        sourceAreaId: string;
        targetAreaId: string;
        direction: CardinalDirection;
    }) => void;
    getLastSplitResult: () => SplitResult | null;

    // Selectors (signatures only, implementation in createAreaSlice)
    getActiveArea: () => Area<AreaTypeValue> | null;
    getAreaById: (id: string) => Area<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, Area<AreaTypeValue>>;
    getAreaErrors: () => string[];
}

// --- Initial state for AreaSlice (Data + Dummy Actions/Selectors) ---
// Used for createInitialScreenState - actions/selectors replaced by createAreaSlice
const initialAreaSliceState: AreaSliceState = {
    // Data part
    _id: 0,
    rootId: null,
    errors: [],
    activeAreaId: null,
    joinPreview: null,
    layout: {},
    areas: {},
    viewports: {},
    areaToOpen: null,
    lastSplitResultData: null,
    // Dummy implementations for type completeness (will be replaced by real slice)
    addArea: () => '',
    removeArea: () => { },
    setActiveArea: () => { },
    updateArea: () => { },
    setAreaToOpen: () => { },
    updateAreaToOpenPosition: () => { },
    finalizeAreaPlacement: () => { },
    cleanupTemporaryStates: () => { },
    setViewports: () => { },
    setRowSizes: () => { },
    splitArea: () => null,
    setJoinPreview: () => { },
    joinOrMoveArea: () => { },
    getLastSplitResult: () => null,
    getActiveArea: () => null,
    getAreaById: () => undefined,
    getAllAreas: () => ({}),
    getAreaErrors: () => [],
};


// --- Define the state of a single Screen ---
interface ScreenState {
    // Use the full AreaSliceState (containing data part)
    areas: AreaSliceStateData;
    // settings: SettingsSliceStateData; // Placeholder
    // history: HistorySliceStateData; // Placeholder
}

// --- Helper function to generate the initial state for a new screen ---
const createInitialScreenState = (): ScreenState => {
    // Deep copy only the DATA part for initialization
    return JSON.parse(JSON.stringify({
        areas: initialAreaSliceState, // Use the data part of the initial state
        // settings: initialSettingsStateData,
        // history: initialHistoryStateData,
    }));
};


// --- Define the New Root State Structure ---
interface RootState {
    screens: Record<string, ScreenState>;
    activeScreenId: string;
    nextScreenId: number;

    // --- Screen Management Actions ---
    addScreen: () => void;
    switchScreen: (screenId: string) => void;
    // removeScreen: (screenId: string) => void;

    // --- Expose Area Slice Actions/Selectors directly ---
    addArea: (area: Area<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<Area<AreaTypeValue>> & { id: string }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: () => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: { rowId: string; sizes: number[] }) => void;
    splitArea: (payload: {
        areaIdToSplit: string;
        parentRowId: string | null;
        horizontal: boolean;
        corner: IntercardinalDirection;
    }) => SplitResult | null;
    setJoinPreview: (payload: JoinPreviewState | null) => void;
    joinOrMoveArea: (payload: {
        sourceAreaId: string;
        targetAreaId: string;
        direction: CardinalDirection;
    }) => void;
    getLastSplitResult: () => SplitResult | null;
    getActiveArea: () => Area<AreaTypeValue> | null;
    getAreaById: (id: string) => Area<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, Area<AreaTypeValue>>;
    getAreaErrors: () => string[];
}

// --- ADD BACK HELPER FUNCTIONS (adapted for Immer drafts if needed) ---
// Note: These operate on ScreenState['areas'] data structures

function findParentRowAndIndices(layout: AreaSliceStateData['layout'], sourceAreaId: string, targetAreaId: string): { parentRow: AreaRowLayout | null; sourceIndex: number; targetIndex: number } {
    for (const layoutId in layout) {
        const item = layout[layoutId];
        if (item.type === 'area_row') {
            const row = item as AreaRowLayout;
            const sourceIndex = row.areas.findIndex(a => a.id === sourceAreaId);
            const targetIndex = row.areas.findIndex(a => a.id === targetAreaId);
            if (sourceIndex !== -1 && targetIndex !== -1 && Math.abs(sourceIndex - targetIndex) === 1) {
                return { parentRow: row, sourceIndex, targetIndex };
            }
        }
    }
    return { parentRow: null, sourceIndex: -1, targetIndex: -1 };
}

function findAllDescendantAreaIds(layout: AreaSliceStateData['layout'], itemId: string): Set<string> {
    const descendantIds = new Set<string>();
    const queue: string[] = [itemId];
    const visited = new Set<string>();
    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        const item = layout[currentId];
        if (!item) continue;
        if (item.type === 'area') {
            // It might be a layout item *referencing* an area, or the area data itself.
            // If layout stores area details: descendantIds.add(currentId);
            // If layout only stores refs: Need 'areas' map too.
            // Assuming layout keys *can* be area IDs directly for simplicity here.
            descendantIds.add(currentId);
        } else if (item.type === 'area_row') {
            const row = item as AreaRowLayout;
            if (row.areas && Array.isArray(row.areas)) {
                row.areas.forEach(areaRef => {
                    if (areaRef && areaRef.id) { // areaRef.id is the key to potentially another layout item or an area
                        queue.push(areaRef.id);
                        // Check if areaRef.id corresponds to an actual area or just a layout node
                        // For now, assume all referenced IDs could eventually lead to areas.
                    }
                });
            }
        }
    }
    // Add the initial item ID itself if it's potentially an area ID
    if (layout[itemId]?.type === 'area') {
        descendantIds.add(itemId);
    }
    // This function needs careful review based on exact layout structure (refs vs inline)
    return descendantIds;
}


function findAllDisconnectedAreas(layout: AreaSliceStateData['layout'], rootId: string | null): Set<string> {
    const allLayoutIds = new Set<string>(Object.keys(layout));
    const connectedLayoutIds = new Set<string>();

    if (rootId && layout[rootId]) {
        const queue: string[] = [rootId];
        const visited = new Set<string>();

        while (queue.length > 0) {
            const currentId = queue.shift()!;
            if (visited.has(currentId) || !layout[currentId]) continue;
            visited.add(currentId);
            connectedLayoutIds.add(currentId); // Add the layout ID itself

            const item = layout[currentId];
            if (item.type === 'area_row') {
                const row = item as AreaRowLayout;
                row.areas?.forEach(ref => {
                    if (ref?.id && !visited.has(ref.id)) {
                        queue.push(ref.id);
                    }
                });
            }
        }
    }

    const disconnectedLayoutIds = new Set<string>();
    allLayoutIds.forEach(id => {
        if (!connectedLayoutIds.has(id)) {
            disconnectedLayoutIds.add(id);
        }
    });

    // Return only IDs that correspond to actual areas (needs areas map access?)
    // For now, returning all disconnected layout IDs. Refinement needed.
    return disconnectedLayoutIds;
}


function simplifyLayoutNodeIfNeeded(state: WritableDraft<AreaSliceStateData>, rowId: string | null | undefined) {
    if (!rowId) return;
    const layoutNode = state.layout[rowId];
    if (!layoutNode || layoutNode.type !== 'area_row') return;

    const rowLayout = layoutNode as AreaRowLayout;
    if (rowLayout.areas.length !== 1) return;

    const survivingChildRef = rowLayout.areas[0];
    const survivingChildId = survivingChildRef.id;
    const areaToParentRowMap = computeAreaToParentRow(state.layout, state.rootId); // Compute within helper
    const grandParentRowId = areaToParentRowMap[rowId];

    if (grandParentRowId && state.layout[grandParentRowId]?.type === 'area_row') {
        const grandParentRow = state.layout[grandParentRowId] as AreaRowLayout;
        const rowIndexInGrandparent = grandParentRow.areas.findIndex(a => a.id === rowId);
        if (rowIndexInGrandparent !== -1) {
            const sizeToPreserve = grandParentRow.areas[rowIndexInGrandparent].size ?? survivingChildRef.size ?? 0.5;
            grandParentRow.areas[rowIndexInGrandparent] = { id: survivingChildId, size: sizeToPreserve };
        } else {
            console.error(`[simplifyLayoutNodeIfNeeded] Cleanup Error: Row ${rowId} not found in parent ${grandParentRowId}.`);
            return; // Stop simplification if parent relationship is broken
        }
    } else if (state.rootId === rowId) {
        state.rootId = survivingChildId;
    } else {
        // Orphaned row with single child - this indicates a potential issue elsewhere
        console.warn(`[simplifyLayoutNodeIfNeeded] Row ${rowId} has single child ${survivingChildId} but no parent and is not root. Removing row.`);
        // Proceed to delete the row, but the child is now potentially disconnected
        // This case might need more robust handling depending on desired behavior
    }

    // Delete the layout entry for the now-simplified (empty or handled) row
    delete state.layout[rowId];
}
// --- END HELPER FUNCTIONS ---


// --- Define the Area Slice logic using StateCreator pattern ---
const createAreaSlice: StateCreator<
    RootState,
    [["zustand/immer", never]], // Define middleware used at the root
    [],
    AreaSliceState // The state slice this creator manages
> = (set, get) => {
    // Return the slice state and actions
    return {
        // --- Initial Data State (already defined in initialAreaSliceState) ---
        ...initialAreaSliceState,

        // --- ACTIONS (adapted to operate on active screen) ---
        addArea: (area) => {
            let generatedAreaId = '';
            set((state: WritableDraft<RootState>) => { // Ensure state is WritableDraft
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;

                const areaId = area.id || `area-${activeScreenAreas._id + 1}`;
                const areaWithId = { ...area, id: areaId };
                const validation = validateArea(areaWithId); // Use imported validateArea

                if (!validation.isValid) {
                    activeScreenAreas.errors = validation.errors;
                    console.error("Validation failed for area:", validation.errors);
                    // generatedAreaId remains ''
                } else {
                    activeScreenAreas.areas[areaId] = areaWithId;
                    // Layout entry created by finalizePlacement or initial setup
                    activeScreenAreas._id += 1;
                    activeScreenAreas.errors = [];
                    generatedAreaId = areaId;
                }
            });
            return generatedAreaId;
        },

        removeArea: (id) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;

            // TODO: More robust removal - requires updating layout refs, potentially simplifying parent rows.
            // This is a placeholder implementation.
            const areaToRemove = activeScreenAreas.areas[id];
            if (!areaToRemove) return; // Area doesn't exist

            // Find parent row
            const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
            const parentRowId = areaToParentRow[id];

            // 1. Delete from areas map
            delete activeScreenAreas.areas[id];

            // 2. Delete from layout map (if it has its own layout entry)
            delete activeScreenAreas.layout[id]; // Assuming areas might have direct layout entries

            // 3. Remove from parent row's areas array
            if (parentRowId && activeScreenAreas.layout[parentRowId]?.type === 'area_row') {
                const parentRow = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
                const originalLength = parentRow.areas.length;
                parentRow.areas = parentRow.areas.filter(a => a.id !== id);

                // 4. Normalize sizes of remaining siblings
                if (parentRow.areas.length > 0 && parentRow.areas.length < originalLength) {
                    const totalSize = parentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                    if (totalSize > 0) {
                        const factor = 1.0 / totalSize;
                        parentRow.areas.forEach(area => { area.size = (area.size || 0) * factor; });
                    }
                }
                // 5. Simplify parent row if it now has only one child
                simplifyLayoutNodeIfNeeded(activeScreenAreas, parentRowId); // Pass screenAreas state
            }

            // 6. Handle root case
            if (activeScreenAreas.rootId === id) {
                // If the root was removed, the layout is likely empty or invalid.
                // Setting rootId to null might be appropriate. Needs defined behavior.
                activeScreenAreas.rootId = null; // Or find remaining area?
                console.warn("Removed root area. Layout might be invalid.");
            }

            // 7. Update active area ID if it was removed
            if (activeScreenAreas.activeAreaId === id) {
                activeScreenAreas.activeAreaId = null; // Or set to another area?
            }
            activeScreenAreas.errors = [];

        }),

        setActiveArea: (id) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;
            if (id === null || activeScreenAreas.areas[id]) {
                activeScreenAreas.activeAreaId = id;
            } else {
                console.warn(`Attempted to set active area to non-existent ID: ${id}`);
            }
            activeScreenAreas.errors = [];
        }),

        updateArea: (areaData) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;
            const area = activeScreenAreas.areas[areaData.id];
            if (area) {
                const { id, ...changes } = areaData;
                // Validate changes if necessary
                activeScreenAreas.areas[id] = { ...area, ...changes };
                activeScreenAreas.errors = [];
            } else {
                activeScreenAreas.errors = [`Area with ID ${areaData.id} not found for update.`];
            }
        }),

        setAreaToOpen: (payload) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas) activeScreenAreas.areaToOpen = payload;
        }),

        updateAreaToOpenPosition: (position) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas?.areaToOpen) {
                activeScreenAreas.areaToOpen.position = position;
            }
        }),

        finalizeAreaPlacement: () => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas || !activeScreenAreas.areaToOpen) {
                console.warn('[areaStore] finalizeAreaPlacement - No active screen or areaToOpen data');
                return;
            }

            // Work directly on the draft 'activeScreenAreas'
            try {
                const { position, area } = activeScreenAreas.areaToOpen;
                const sourceAreaId = area.state?.sourceId; // ID of the area being moved (if any)
                const newAreaId = sourceAreaId || `area-${activeScreenAreas._id + 1}`; // Use screen's counter for new areas

                const adjustedPosition = new Vec2(position.x, position.y - TOOLBAR_HEIGHT);

                // 1. Add new area data if it's not a move
                if (!sourceAreaId) {
                    // Ensure ID is unique before adding
                    if (activeScreenAreas.areas[newAreaId]) {
                        console.error(`finalizeAreaPlacement: ID conflict for new area ${newAreaId}`);
                        // Potentially generate a different ID or handle error
                        activeScreenAreas.areaToOpen = null; // Clear temp state on error
                        return;
                    }
                    activeScreenAreas.areas[newAreaId] = { id: newAreaId, type: area.type, state: area.state };
                    // Layout entry added later based on placement
                    activeScreenAreas._id += 1; // Increment counter *only* for new area data creation
                } else if (sourceAreaId !== newAreaId) {
                    // This case (sourceId exists but != newAreaId) should ideally not happen with current ID logic.
                    // If it could, ensure the area data is correctly handled (e.g., update ID? copy data?)
                    console.warn(`finalizeAreaPlacement: Mismatch sourceAreaId ('${sourceAreaId}') and newAreaId ('${newAreaId}')`);
                }


                // 2. Compute viewports and find target
                // getAreaRootViewport might need context if root isn't window
                const rootViewport = getAreaRootViewport();
                const areaToViewport = computeAreaToViewport(
                    activeScreenAreas.layout,
                    activeScreenAreas.rootId || '', // Handle null rootId
                    rootViewport,
                );

                const detectionDimensions = new Vec2(300, 200);
                const targetAreaId = getHoveredAreaId(
                    adjustedPosition,
                    activeScreenAreas, // Pass the area state part
                    areaToViewport,
                    detectionDimensions
                );

                // 3. Handle no target / invalid drop
                if (!targetAreaId) {
                    // If a new area was created, clean it up
                    if (!sourceAreaId) {
                        delete activeScreenAreas.areas[newAreaId];
                        // Don't decrement _id, accept potential gaps
                    }
                    activeScreenAreas.areaToOpen = null; // Clear temp state
                    return;
                }

                // 4. Calculate placement and clear temporary state
                const viewport = areaToViewport[targetAreaId];
                if (!viewport) {
                    console.error(`finalizeAreaPlacement: Viewport not found for target ${targetAreaId}`);
                    // Clean up new area if created
                    if (!sourceAreaId) delete activeScreenAreas.areas[newAreaId];
                    activeScreenAreas.areaToOpen = null;
                    return;
                }
                const placement = getAreaToOpenPlacementInViewport(viewport, adjustedPosition);
                activeScreenAreas.areaToOpen = null; // Clear state *before* complex logic

                // 5. Handle source area removal (if it was a move)
                let sourceParentRowIdForCleanup: string | null = null;
                if (sourceAreaId) {
                    const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
                    const sourceParentRowId = areaToParentRow[sourceAreaId];
                    sourceParentRowIdForCleanup = sourceParentRowId; // Store for potential simplification later

                    if (sourceParentRowId && activeScreenAreas.layout[sourceParentRowId]?.type === 'area_row') {
                        const sourceParentRow = activeScreenAreas.layout[sourceParentRowId] as AreaRowLayout;
                        const areaIndex = sourceParentRow.areas.findIndex(a => a.id === sourceAreaId);

                        if (areaIndex !== -1) {
                            sourceParentRow.areas.splice(areaIndex, 1); // Remove source area ref

                            if (sourceParentRow.areas.length === 0) {
                                // Row is empty, remove it and potentially simplify its parent
                                delete activeScreenAreas.layout[sourceParentRowId];
                                const grandParentId = areaToParentRow[sourceParentRowId]; // Parent of the row being deleted
                                simplifyLayoutNodeIfNeeded(activeScreenAreas, grandParentId);
                            } else {
                                // Row not empty, normalize sizes and simplify if needed
                                const totalSize = sourceParentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                                if (totalSize > 0) {
                                    const factor = 1.0 / totalSize;
                                    sourceParentRow.areas.forEach(area => { area.size = (area.size || 0) * factor; });
                                }
                                // Check if the row itself needs simplification (e.g., went from 2 to 1 child)
                                simplifyLayoutNodeIfNeeded(activeScreenAreas, sourceParentRowId);
                            }
                        } else {
                            console.warn(`finalizeAreaPlacement: Source area ${sourceAreaId} not found in its supposed parent ${sourceParentRowId}`);
                        }
                    }
                    // If source area wasn't in a row (e.g., it was root or orphan), remove its direct layout entry if exists
                    else if (activeScreenAreas.layout[sourceAreaId]) {
                        delete activeScreenAreas.layout[sourceAreaId];
                    }
                    // Delete source area *data* only if it's truly a move (source != new ID potentially created)
                    if (sourceAreaId !== newAreaId) {
                        delete activeScreenAreas.areas[sourceAreaId];
                    }
                    // Check if root needs update
                    if (activeScreenAreas.rootId === sourceAreaId) {
                        activeScreenAreas.rootId = null; // Layout is likely broken, needs rebuild or clear
                        console.warn("Moved root area away. Root is now null.");
                    }
                }

                // 6. Handle placement logic
                let orientation: "horizontal" | "vertical" = placement === "replace" ? "horizontal" : (placement === "top" || placement === "bottom" ? "vertical" : "horizontal");

                if (placement === "replace") {
                    if (sourceAreaId === targetAreaId) {
                        // If a new area *data* was created unnecessarily (e.g. drag new item onto itself - unlikely), clean up.
                        if (!sourceAreaId && activeScreenAreas.areas[newAreaId]) {
                            delete activeScreenAreas.areas[newAreaId];
                        }
                        return;
                    }
                    // Replace target area's content/type with the source's
                    const sourceData = activeScreenAreas.areas[newAreaId]; // Get data from the (potentially newly created) source ID
                    if (!sourceData) {
                        console.error(`[finalizeAreaPlacement] Replace failed: Source data for ${newAreaId} not found.`);
                        return;
                    }
                    activeScreenAreas.areas[targetAreaId] = {
                        ...activeScreenAreas.areas[targetAreaId], // Keep target ID and state shell
                        type: sourceData.type, // Update type from source
                        state: { ...sourceData.state } // Update state from source (deep copy state?)
                    };

                    // If the source was a different ID (i.e., a move or new item drop), remove the source entry
                    if (newAreaId !== targetAreaId) {
                        delete activeScreenAreas.areas[newAreaId];
                        // Layout entry for newAreaId should have been handled by source removal logic above
                    }
                    // Simplify the original parent of the source if it was a move
                    simplifyLayoutNodeIfNeeded(activeScreenAreas, sourceParentRowIdForCleanup);
                    return; // End of 'replace' logic
                }

                // --- Logic for Top/Bottom/Left/Right placement ---
                const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
                const parentRowId = areaToParentRow[targetAreaId];
                const parentRow = parentRowId ? activeScreenAreas.layout[parentRowId] as AreaRowLayout : null;

                const newRowId = `row-${activeScreenAreas._id + 1}`; // ID for a potential new row

                // Ensure layout entry exists for the area being placed
                if (!activeScreenAreas.layout[newAreaId]) {
                    activeScreenAreas.layout[newAreaId] = { type: 'area', id: newAreaId };
                }


                if (parentRow && parentRow.type === 'area_row') { // Target is in a row
                    const targetIndex = parentRow.areas.findIndex(a => a.id === targetAreaId);
                    if (targetIndex === -1) {
                        console.error(`[finalizeAreaPlacement] Target ${targetAreaId} not found in parent ${parentRowId}`);
                        return; // Stop if layout inconsistent
                    }

                    if (parentRow.orientation === orientation) { // Same orientation: Add as sibling
                        const insertIndex = targetIndex + (placement === "bottom" || placement === "right" ? 1 : 0);
                        // Assign equal size initially
                        const newSize = 1 / (parentRow.areas.length + 1);
                        parentRow.areas.splice(insertIndex, 0, { id: newAreaId, size: newSize });
                        // Redistribute sizes
                        const factor = 1.0 / parentRow.areas.length;
                        parentRow.areas.forEach(area => { area.size = factor; });

                    } else { // Different orientation: Create new row
                        const newRow: AreaRowLayout = {
                            id: newRowId, type: "area_row", orientation,
                            areas: placement === "top" || placement === "left"
                                ? [{ id: newAreaId, size: 0.5 }, { id: targetAreaId, size: 0.5 }]
                                : [{ id: targetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                        };
                        activeScreenAreas.layout[newRowId] = newRow;
                        // Replace target area ref with new row ref in parent
                        parentRow.areas[targetIndex] = { ...parentRow.areas[targetIndex], id: newRowId }; // Keep size
                        activeScreenAreas._id += 1; // Increment counter for the new row layout item
                    }
                } else { // Target is the root or an orphan
                    const currentRootId = activeScreenAreas.rootId;
                    if (!currentRootId || currentRootId !== targetAreaId) {
                        console.error(`[finalizeAreaPlacement] Cannot place relative to target ${targetAreaId} which is not root or has no parent.`);
                        // Cleanup potentially created new area data
                        if (!sourceAreaId) delete activeScreenAreas.areas[newAreaId];
                        return;
                    }
                    // Create new root row
                    const newRow: AreaRowLayout = {
                        id: newRowId, type: "area_row", orientation,
                        areas: placement === "top" || placement === "left"
                            ? [{ id: newAreaId, size: 0.5 }, { id: targetAreaId, size: 0.5 }]
                            : [{ id: targetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                    };
                    activeScreenAreas.layout[newRowId] = newRow;
                    activeScreenAreas.rootId = newRowId; // New row becomes root
                    activeScreenAreas._id += 1; // Increment counter for the new row layout item
                }

                // 7. Final cleanup of disconnected areas (potentially caused by moves/simplifications)
                // TODO: Ensure findAllDisconnectedAreas correctly identifies layout IDs that are no longer reachable *and* represent areas
                // const disconnectedAreas = findAllDisconnectedAreas(activeScreenAreas.layout, activeScreenAreas.rootId);
                // disconnectedAreas.forEach(id => {
                //     delete activeScreenAreas.layout[id];
                //     // Only delete from areas map if it corresponds to an actual area
                //     if (activeScreenAreas.areas[id]) {
                //          delete activeScreenAreas.areas[id];
                //     }
                //     if (activeScreenAreas.viewports && activeScreenAreas.viewports[id]) {
                //         delete activeScreenAreas.viewports[id];
                //     }
                // });
                // if (activeScreenAreas.activeAreaId && disconnectedAreas.has(activeScreenAreas.activeAreaId)) {
                //     activeScreenAreas.activeAreaId = null;
                // }

            } catch (error) {
                console.error('[areaStore] finalizeAreaPlacement - Error during execution:', error);
                // Attempt cleanup of temp state even on error
                if (activeScreenAreas && activeScreenAreas.areaToOpen) { // Check if it exists (might be cleared already)
                    const { area } = activeScreenAreas.areaToOpen;
                    const sourceAreaId = area.state?.sourceId;
                    const newAreaId = sourceAreaId || `area-${activeScreenAreas._id + 1}`; // Reconstruct potential ID
                    // If a new area was created for this failed op, remove its data
                    if (!sourceAreaId && activeScreenAreas.areas[newAreaId]) {
                        delete activeScreenAreas.areas[newAreaId];
                    }
                    activeScreenAreas.areaToOpen = null; // Ensure cleared
                }
            }

        }),

        cleanupTemporaryStates: () => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas) {
                activeScreenAreas.joinPreview = null;
                activeScreenAreas.areaToOpen = null;
                activeScreenAreas.lastSplitResultData = null;
            }
        }),

        setViewports: (viewports) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas) activeScreenAreas.viewports = viewports;
        }),

        setRowSizes: (payload) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;
            const rowLayout = activeScreenAreas.layout[payload.rowId];
            if (rowLayout && rowLayout.type === 'area_row') {
                const typedRowLayout = rowLayout as AreaRowLayout;
                if (typedRowLayout.areas.length === payload.sizes.length) {
                    // Ensure total size is close to 1 after setting
                    let totalSize = payload.sizes.reduce((sum, size) => sum + size, 0);
                    if (Math.abs(totalSize - 1.0) > 0.001 && totalSize > 0) { // Normalize if needed
                        console.warn(`[areaStore] setRowSizes: Normalizing sizes for row ${payload.rowId}`);
                        const scale = 1.0 / totalSize;
                        typedRowLayout.areas.forEach((areaInfo, index) => {
                            if (areaInfo) areaInfo.size = payload.sizes[index] * scale;
                        });
                    } else { // Apply directly if sum is ~1 or 0
                        typedRowLayout.areas.forEach((areaInfo, index) => {
                            if (areaInfo) areaInfo.size = payload.sizes[index];
                        });
                    }
                } else {
                    console.warn(`[areaStore] setRowSizes: Mismatch count for row ${payload.rowId}`);
                }
            } else {
                console.warn(`[areaStore] setRowSizes: Row ${payload.rowId} not found or not a row.`);
            }
        }),

        splitArea: (payload) => {
            let result: SplitResult | null = null;
            set((state: WritableDraft<RootState>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;

                const { areaIdToSplit, parentRowId, horizontal } = payload; // Corner ignored for now
                const areaToSplit = activeScreenAreas.areas[areaIdToSplit];
                if (!areaToSplit) {
                    console.error(`splitArea: Area ${areaIdToSplit} not found.`);
                    return; // Exit mutation
                }

                const baseId = activeScreenAreas._id; // Use screen's counter
                const newAreaId = `area-${baseId + 1}`;
                const newRowId = `row-${baseId + 2}`;

                // 1. Create New Area Data & Layout Entry
                if (activeScreenAreas.areas[newAreaId] || activeScreenAreas.layout[newAreaId]) {
                    console.error(`splitArea: ID conflict for new area ${newAreaId}`); return;
                }
                activeScreenAreas.areas[newAreaId] = {
                    id: newAreaId,
                    type: areaToSplit.type, // Copy type from split area
                    state: {}, // Default/empty state for new area
                };
                activeScreenAreas.layout[newAreaId] = { type: 'area', id: newAreaId };

                // 2. Create New Row Layout Entry
                if (activeScreenAreas.layout[newRowId]) {
                    console.error(`splitArea: ID conflict for new row ${newRowId}`); return;
                }
                const newRow: AreaRowLayout = {
                    id: newRowId, type: 'area_row',
                    orientation: horizontal ? 'horizontal' : 'vertical',
                    areas: [ // Split 50/50 initially
                        { id: areaIdToSplit, size: 0.5 },
                        { id: newAreaId, size: 0.5 }
                    ]
                };
                activeScreenAreas.layout[newRowId] = newRow;

                // 3. Update Parent Row or Root ID
                let originalSize = 0.5; // Default size if parent lookup fails
                if (parentRowId) {
                    const parentRow = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
                    if (parentRow?.type === 'area_row') {
                        const index = parentRow.areas.findIndex(a => a.id === areaIdToSplit);
                        if (index !== -1) {
                            originalSize = parentRow.areas[index].size ?? 0.5; // Store original size
                            // Replace the old area ref with the new row ref, preserving size
                            parentRow.areas[index] = { id: newRowId, size: originalSize };
                        } else {
                            console.error(`splitArea Error: Area ${areaIdToSplit} not in parent ${parentRowId}.`);
                            // Rollback? For now, proceed with potential inconsistency.
                        }
                    } else {
                        console.error(`splitArea Error: Parent ${parentRowId} not found or not row.`);
                    }
                } else if (activeScreenAreas.rootId === areaIdToSplit) {
                    activeScreenAreas.rootId = newRowId; // New row becomes root
                } else {
                    // Area has no parent and isn't root - orphan?
                    console.error(`splitArea Error: Area ${areaIdToSplit} has no parent and is not root.`);
                    // If areaToSplit had its own layout entry, remove it?
                    // delete activeScreenAreas.layout[areaIdToSplit]; // Risky without clear definition
                }

                // 4. Increment ID counter AFTER using baseId+1 and baseId+2
                activeScreenAreas._id = baseId + 2;

                // 5. Set result
                result = { newRowId: newRowId, separatorIndex: 1 }; // Index is between the two areas
                activeScreenAreas.lastSplitResultData = result;

            });
            return result; // Return result captured outside 'set'
        },

        setJoinPreview: (payload) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas) activeScreenAreas.joinPreview = payload;
        }),

        joinOrMoveArea: (payload) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;

            const { sourceAreaId, targetAreaId, direction } = payload;
            const { parentRow, sourceIndex, targetIndex } = findParentRowAndIndices(
                activeScreenAreas.layout, sourceAreaId, targetAreaId
            );

            if (!parentRow || parentRow.type !== 'area_row') {
                activeScreenAreas.errors = [`Could not find adjacent areas ${sourceAreaId}/${targetAreaId} in the same row.`];
                activeScreenAreas.joinPreview = null;
                return;
            }

            // Store original parent row ID and get grandparent ID *before* mutation
            const originalParentRowId = parentRow.id;
            const areaToParentMapBefore = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
            const grandParentId = areaToParentMapBefore[originalParentRowId];

            // Create a deep copy for the utility function
            const parentRowCopy = JSON.parse(JSON.stringify(parentRow));

            const mergeIntoDirection = targetIndex > sourceIndex ? 1 : -1;
            const areaIndexToRemove = sourceIndex;

            try {
                const joinResult = joinAreasUtil(parentRowCopy, areaIndexToRemove, mergeIntoDirection);
                const { area: resultingLayoutItem, removedAreaId } = joinResult;

                // 1. Cleanup removed area and its descendants
                const allRemovedIds = findAllDescendantAreaIds(activeScreenAreas.layout, removedAreaId);
                allRemovedIds.add(removedAreaId);
                allRemovedIds.forEach(id => {
                    delete activeScreenAreas.areas[id];
                    delete activeScreenAreas.layout[id];
                });

                // 2. Update the layout based on the result
                if (resultingLayoutItem.id === originalParentRowId && resultingLayoutItem.type === 'area_row') {
                    // Row still exists (same ID), update its layout entry
                    const updatedRow = resultingLayoutItem as AreaRowLayout;
                    activeScreenAreas.layout[originalParentRowId] = updatedRow;
                    // Normalize sizes (important after potential merges)
                    if (updatedRow.areas) {
                        const totalSize = updatedRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                        if (totalSize > 0) {
                            const factor = 1.0 / totalSize;
                            updatedRow.areas.forEach(area => { area.size = (area.size || 0) * factor; });
                        }
                    }
                    // Check if simplification is needed *now*
                    if (updatedRow.areas?.length === 1) {
                        simplifyLayoutNodeIfNeeded(activeScreenAreas, originalParentRowId);
                    }
                } else {
                    // Row collapsed into a single area or the resulting item has a different ID.
                    // The original parentRow layout entry should be removed.
                    delete activeScreenAreas.layout[originalParentRowId];

                    // Ensure the resulting item has a layout entry if it doesn't exist
                    if (!activeScreenAreas.layout[resultingLayoutItem.id]) {
                        // Assuming it's now an area if type isn't area_row
                        if (resultingLayoutItem.type !== 'area_row') {
                            activeScreenAreas.layout[resultingLayoutItem.id] = { type: 'area', id: resultingLayoutItem.id };
                        } else {
                            // It's a row with a new ID? Should be handled by joinAreasUtil returning correct structure
                            // If joinAreasUtil could return a new row structure, add it here.
                            // activeScreenAreas.layout[resultingLayoutItem.id] = resultingLayoutItem as AreaRowLayout;
                            console.warn(`[joinOrMoveArea] Resulting item has new row ID ${resultingLayoutItem.id} but wasn't added to layout?`);
                        }
                    }

                    // Update Grandparent or Root
                    if (grandParentId && activeScreenAreas.layout[grandParentId]?.type === 'area_row') {
                        const grandParentRow = activeScreenAreas.layout[grandParentId] as AreaRowLayout;
                        const rowIndexInGrandparent = grandParentRow.areas.findIndex(a => a.id === originalParentRowId);
                        if (rowIndexInGrandparent !== -1) {
                            // Replace the ref to the old row with the ref to the new item (area or new row)
                            const sizeToPreserve = grandParentRow.areas[rowIndexInGrandparent].size ?? 0.5;
                            grandParentRow.areas[rowIndexInGrandparent] = { id: resultingLayoutItem.id, size: sizeToPreserve };
                            // No need to call simplify on grandparent here, handled by subsequent joins/removals
                        } else {
                            console.error(`[joinOrMoveArea] Cleanup Error: Row ${originalParentRowId} not found in grandparent ${grandParentId}.`);
                        }
                    } else if (activeScreenAreas.rootId === originalParentRowId) {
                        // The collapsed row was the root, promote the result to be the new root
                        activeScreenAreas.rootId = resultingLayoutItem.id;
                    } else {
                        // Grandparent doesn't exist or isn't a row, and it wasn't root.
                        // This might indicate an orphaned structure before the join.
                        console.warn(`[joinOrMoveArea] Row ${originalParentRowId} collapsed but had no valid grandparent and wasn't root.`);
                    }
                }

                // 3. Update active area if it was removed
                if (activeScreenAreas.activeAreaId && allRemovedIds.has(activeScreenAreas.activeAreaId)) {
                    // Set active to the surviving area? Or null?
                    // If resultingLayoutItem is the surviving area ID:
                    if (resultingLayoutItem.type === 'area') {
                        activeScreenAreas.activeAreaId = resultingLayoutItem.id;
                    } else {
                        activeScreenAreas.activeAreaId = null; // Or find first child of resulting row?
                    }
                }

                activeScreenAreas.errors = [];
                activeScreenAreas.joinPreview = null;

            } catch (error) {
                console.error('Error during joinOrMoveArea:', error);
                activeScreenAreas.errors = [(error instanceof Error ? error.message : String(error))];
                activeScreenAreas.joinPreview = null;
            }
        }),

        getLastSplitResult: () => {
            // Selector needs access to active screen state via get()
            const activeScreenAreas = get().screens[get().activeScreenId]?.areas;
            return activeScreenAreas ? activeScreenAreas.lastSplitResultData : null;
        },


        // --- SELECTORS (adapted to operate on active screen) ---
        getActiveArea: () => {
            const state = get(); // Get root state
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            return activeScreenAreas && activeScreenAreas.activeAreaId
                ? activeScreenAreas.areas[activeScreenAreas.activeAreaId]
                : null;
        },
        getAreaById: (id) => {
            const state = get();
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            return activeScreenAreas ? activeScreenAreas.areas[id] : undefined;
        },
        getAllAreas: () => {
            const state = get();
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            return activeScreenAreas ? activeScreenAreas.areas : {};
        },
        getAreaErrors: () => {
            const state = get();
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            return activeScreenAreas ? activeScreenAreas.errors : [];
        },
    };
};


// --- Define the core state logic with immer (structure + area slice) ---
const rootStoreCreator: StateCreator<
    RootState,
    // Define middleware signatures: immer -> persist -> devtools
    [["zustand/immer", never],
        ["zustand/persist", unknown],
        ["zustand/devtools", never]]
> = (set, get) => {

    // --- Create the Area Slice instance ---
    const areaSlice = createAreaSlice(set, get, {} as any);

    return {
        // --- Initial Root State ---
        screens: {
            '1': createInitialScreenState() // Laisser l'initialisation de base ici
            // Le KarmycInitializer s'occupera de remplir l'écran '1' si nécessaire
        },
        activeScreenId: '1',
        nextScreenId: 2,

        // --- Root Level Screen Management Actions ---
        addScreen: () => set((state: WritableDraft<RootState>) => {
            const newScreenId = state.nextScreenId.toString();

            // 1. Créer l'écran avec un état initial vide (ou basé sur createInitialScreenState)
            state.screens[newScreenId] = createInitialScreenState();

            // 2. Ajouter une zone par défaut et configurer le layout pour ce nouvel écran
            const defaultAreaId = `area-default-${newScreenId}-0`; // ID unique pour la zone par défaut
            const newScreenAreasState = state.screens[newScreenId].areas;

            // Ajouter la zone par défaut
            newScreenAreasState.areas[defaultAreaId] = {
                id: defaultAreaId,
                type: 'text-note', // Ou un autre type par défaut
                state: { content: 'New Screen' } // Contenu initial
            };

            // Configurer le layout et rootId pour cette seule zone
            newScreenAreasState.layout = {
                [defaultAreaId]: { type: 'area', id: defaultAreaId } // Layout simple pour la zone
            };
            newScreenAreasState.rootId = defaultAreaId; // La zone est la racine
            newScreenAreasState._id = 1; // Le compteur interne de cet écran est à 1
            newScreenAreasState.activeAreaId = defaultAreaId; // Rendre la zone active par défaut

            // 3. Mettre à jour le compteur d'ID d'écran et l'écran actif
            state.nextScreenId += 1;
            state.activeScreenId = newScreenId;
        }),

        switchScreen: (screenId) => set((state: WritableDraft<RootState>) => {
            if (state.screens[screenId]) {
                state.activeScreenId = screenId;
            } else {
                console.warn(`Attempted to switch to non-existent screen ID: ${screenId}`);
            }
        }),

        // --- Expose Area Slice Actions/Selectors directly ---
        addArea: areaSlice.addArea,
        removeArea: areaSlice.removeArea,
        setActiveArea: areaSlice.setActiveArea,
        updateArea: areaSlice.updateArea,
        setAreaToOpen: areaSlice.setAreaToOpen,
        updateAreaToOpenPosition: areaSlice.updateAreaToOpenPosition,
        finalizeAreaPlacement: areaSlice.finalizeAreaPlacement,
        cleanupTemporaryStates: areaSlice.cleanupTemporaryStates,
        setViewports: areaSlice.setViewports,
        setRowSizes: areaSlice.setRowSizes,
        splitArea: areaSlice.splitArea,
        setJoinPreview: areaSlice.setJoinPreview,
        joinOrMoveArea: areaSlice.joinOrMoveArea,
        getLastSplitResult: areaSlice.getLastSplitResult,
        getActiveArea: areaSlice.getActiveArea,
        getAreaById: areaSlice.getAreaById,
        getAllAreas: areaSlice.getAllAreas,
        getAreaErrors: areaSlice.getAreaErrors,
    };
};


// --- Store Creation (applying middlewares) ---
export const useKarmycStore = create<RootState>()(
    devtools( // 3. Apply devtools (outermost for action naming)
        persist( // 2. Apply persist
            immer(rootStoreCreator), // 1. Apply immer (innermost)
            // Persist configuration
            {
                name: 'karmycRootState', // Storage key
                partialize: (state: RootState): Partial<RootState> => {
                    // Persist only essential data
                    const persistedScreens: Record<string, ScreenState> = {};
                    for (const screenId in state.screens) {
                        const screen = state.screens[screenId];
                        if (screen) {
                            persistedScreens[screenId] = {
                                areas: {
                                    _id: screen.areas._id,
                                    rootId: screen.areas.rootId,
                                    layout: screen.areas.layout,
                                    areas: screen.areas.areas,
                                    errors: [],
                                    activeAreaId: null,
                                    joinPreview: null,
                                    viewports: {},
                                    areaToOpen: null,
                                    lastSplitResultData: null
                                }
                            };
                        }
                    }
                    return {
                        screens: persistedScreens,
                        activeScreenId: state.activeScreenId,
                        nextScreenId: state.nextScreenId,
                    };
                },
                onRehydrateStorage: () => (state, error) => {
                    // Handle hydration results
                    if (error) {
                        console.error('[karmycRootState persist] Hydration failed:', error);
                    } else {
                        console.log('[karmycRootState persist] Hydration successful.');
                        // Post-hydration validation/migration (optional)
                        if (state && (!state.screens || Object.keys(state.screens).length === 0)) {
                            console.warn('[karmycRootState persist] Rehydrated state has no screens, initializing default screen.');
                            state.screens = { '1': createInitialScreenState() };
                            state.activeScreenId = '1';
                            state.nextScreenId = 2;
                        }
                        if (state?.screens && !state.screens[state.activeScreenId]) {
                            console.warn(`[karmycRootState persist] Rehydrated activeScreenId '${state.activeScreenId}' is invalid, resetting.`);
                            state.activeScreenId = Object.keys(state.screens)[0] || '1';
                        }
                    }
                },
                skipHydration: false, // Allow default hydration
            }
        ),
        { name: 'KarmycRootStore' } // Devtools configuration
    )
);

// --- Optional: Migration from old state ---
// (Keep the tryMigrateOldState function as previously defined)
const tryMigrateOldState = () => {
    const oldStateKey = 'areaState';
    const newStateKey = 'karmycRootState';
    try {
        const oldStateString = localStorage.getItem(oldStateKey);
        const newStateString = localStorage.getItem(newStateKey);

        if (oldStateString && !newStateString) {
            const oldParsed = JSON.parse(oldStateString);
            const oldStateData = oldParsed?.state;

            if (oldStateData && oldStateData.layout && oldStateData.areas) {
                // Create the structure expected by the new store
                const migratedScreen: ScreenState = {
                    areas: {
                        _id: oldStateData._id ?? 0,
                        rootId: oldStateData.rootId ?? null,
                        layout: oldStateData.layout,
                        areas: oldStateData.areas,
                        // Initialize non-persisted fields to defaults
                        errors: [],
                        activeAreaId: null,
                        joinPreview: null,
                        viewports: {},
                        areaToOpen: null,
                        lastSplitResultData: null,
                    }
                };
                // Create the partial root state to be persisted
                const migratedRootState: Partial<RootState> = {
                    screens: { '1': migratedScreen },
                    activeScreenId: '1',
                    nextScreenId: 2
                };

                // Set the new state in localStorage (structure matches persist middleware)
                localStorage.setItem(newStateKey, JSON.stringify({ state: migratedRootState, version: 0 }));
                // Remove old key? Maybe keep for safety initially.
                // localStorage.removeItem(oldStateKey);

                // Trigger rehydration (if store is already initialized)
                useKarmycStore.persist.rehydrate();

            } else {
                console.warn(`[karmycRootState Migration] Old state '${oldStateKey}' found but invalid. Skipping.`);
            }
        }
    } catch (error) {
        console.error(`[karmycRootState Migration] Error during migration:`, error);
    }
};
// Run migration attempt on load
tryMigrateOldState();

// Export useAreaStore alias for backward compatibility
export const useAreaStore = useKarmycStore;
