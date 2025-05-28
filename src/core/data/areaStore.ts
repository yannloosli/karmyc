import type { WritableDraft } from 'immer';
import { create, StateCreator } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { Vec2 } from '../utils';
import { TOOLBAR_HEIGHT } from '../utils/constants';
import { IArea, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types';
import { AreaTypeValue, AREA_ROLE } from '../types/actions';
import { computeAreaToParentRow } from '../utils/areaToParentRow';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getAreaToOpenPlacementInViewport, getHoveredAreaId, PlaceArea } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';
import { joinAreas as joinAreasUtil } from '../utils/joinArea';
import { validateArea } from '../../garbage/utils/validation';
import { devtools, persist } from 'zustand/middleware';
import { areaRegistry } from './registries/areaRegistry';



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
        [key: string]: IArea<AreaTypeValue>;
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
    lastLeadAreaId?: string | null;
    isDetached?: boolean; // Flag pour désactiver les manipulations dans les fenêtres détachées
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
    lastLeadAreaId: null,
};


// --- Define the FULL state structure for the Areas SLICE ---
// Includes data and actions/selectors signatures
export interface AreaSliceState extends AreaSliceStateData {
    // Actions (signatures only, implementation in createAreaSlice)
    addArea: (area: IArea<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<IArea<AreaTypeValue>> & { id: string }) => void;
    updateLayout: (layoutData: Partial<AreaRowLayout> & { id: string }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: (payload?: { targetId?: string; placement?: PlaceArea }) => void;
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
    getActiveArea: () => IArea<AreaTypeValue> | null;
    getAreaById: (id: string) => IArea<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, IArea<AreaTypeValue>>;
    getAreaErrors: () => string[];
    getLastLeadAreaId: () => string | null;
}

// --- Initial state for AreaSlice (Data + Dummy Actions/Selectors) ---
// Used for createInitialScreenState - actions/selectors replaced by createAreaSlice
const initialAreaSliceState: AreaSliceState = {
    // Data part
    _id: 0,
    rootId: null,
    updateLayout: () => { },
    errors: [],
    activeAreaId: null,
    joinPreview: null,
    layout: {},
    areas: {},
    viewports: {},
    areaToOpen: null,
    lastSplitResultData: null,
    lastLeadAreaId: null,
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
    getLastLeadAreaId: () => null,
};


// --- Define the state of a single Screen ---
interface ScreenState {
    // Use the full AreaSliceState (containing data part)
    areas: AreaSliceStateData;
    isDetached?: boolean;
    detachedFromAreaId?: string;
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
    windowId?: string;

    // --- Screen Management Actions ---
    addScreen: () => void;
    switchScreen: (screenId: string) => void;
    removeScreen: (screenId: string) => void;
    duplicateScreen: (screenId: string) => void;
    detachArea: (areaId: string) => void;

    // --- Expose Area Slice Actions/Selectors directly ---
    addArea: (area: IArea<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<IArea<AreaTypeValue>> & { id: string }) => void;
    updateLayout: (layoutData: Partial<AreaRowLayout> & { id: string }) => void;
    setAreaToOpen: (payload: AreaSliceStateData['areaToOpen']) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: (payload?: { targetId?: string; placement?: PlaceArea }) => void;
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
    getActiveArea: () => IArea<AreaTypeValue> | null;
    getAreaById: (id: string) => IArea<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, IArea<AreaTypeValue>>;
    getAreaErrors: () => string[];
    findParentRowAndIndices: (layout: AreaSliceStateData['layout'], sourceAreaId: string, targetAreaId: string) => { parentRow: AreaRowLayout | null; sourceIndex: number; targetIndex: number };
}

// --- ADD BACK HELPER FUNCTIONS (adapted for Immer drafts if needed) ---
// Note: These operate on ScreenState['areas'] data structures

export function findParentRowAndIndices(layout: AreaSliceStateData['layout'], sourceAreaId: string, targetAreaId: string): { parentRow: AreaRowLayout | null; sourceIndex: number; targetIndex: number } {
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

// Fonction utilitaire pour trouver la première area enfant d'un row (descente récursive)
function findFirstAreaId(layout: any, id: string): string | null {
    const item = layout[id];
    if (!item) return null;
    if (item.type === 'area') return id;
    if (item.type === 'area_row' && item.areas.length > 0) {
        return findFirstAreaId(layout, item.areas[0].id);
    }
    return null;
}

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
            set((state: WritableDraft<RootState>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;

                const areaId = area.id || `area-${activeScreenAreas._id + 1}`;
                let role = undefined;
                if (area.type) {
                    const _roleMap = (areaRegistry as any)._roleMap || {};
                    role = _roleMap[area.type];
                }
                // Initialisation de zoom/pan par défaut si non fournis
                const areaWithId = {
                    ...area,
                    id: areaId,
                    role,
                    zoom: area.zoom ?? 1,
                    pan: area.pan ?? { x: 0, y: 0 },
                };
                const validation = validateArea(areaWithId);
                if (!validation.isValid) {
                    activeScreenAreas.errors = validation.errors;
                    console.error("Validation failed for area:", validation.errors);
                } else {
                    activeScreenAreas.areas[areaId] = areaWithId;
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
                if (id && activeScreenAreas.areas[id]?.role === AREA_ROLE.LEAD) {
                    activeScreenAreas.lastLeadAreaId = id;
                }
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
                // Si le type change ou si le rôle est absent, recalculer le rôle
                const newType = areaData.type || area.type;
                let newRole = area.role;
                if (!newRole || (areaData.type && areaData.type !== area.type)) {
                    const _roleMap = (areaRegistry as any)._roleMap || {};
                    newRole = _roleMap[newType];
                }
                Object.assign(area, areaData, { role: newRole });
                activeScreenAreas.errors = [];
            } else {
                activeScreenAreas.errors = [`Area with ID ${areaData.id} not found for update.`];
            }
        }),

        updateLayout: (layoutData) => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas) return;
            const layout = activeScreenAreas.layout[layoutData.id];
            if (layout && layout.type === 'area_row') {
                Object.assign(layout, layoutData);
                activeScreenAreas.errors = [];
            } else {
                activeScreenAreas.errors = [`Layout with ID ${layoutData.id} not found or not a row.`];
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

        finalizeAreaPlacement: (payload) => set((state: WritableDraft<RootState>) => {
            console.log('[areaStore] finalizeAreaPlacement: Called with payload', payload);
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (!activeScreenAreas || !activeScreenAreas.areaToOpen) {
                console.warn('[areaStore] finalizeAreaPlacement - No active screen or areaToOpen data. AreaToOpen:', activeScreenAreas?.areaToOpen);
                return;
            }

            // Work directly on the draft 'activeScreenAreas'
            try {
                const { position, area } = activeScreenAreas.areaToOpen;
                console.log('[areaStore] finalizeAreaPlacement: areaToOpen data', { position, area });
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

                let determinedTargetAreaId = payload?.targetId;
                let determinedPlacement = payload?.placement;
                console.log('[areaStore] finalizeAreaPlacement: Initial determinedTargetAreaId from payload', determinedTargetAreaId);
                console.log('[areaStore] finalizeAreaPlacement: Initial determinedPlacement from payload', determinedPlacement);

                if (!determinedTargetAreaId) {
                    console.log('[areaStore] finalizeAreaPlacement: No targetId in payload, calculating using getHoveredAreaId...');
                    const detectionDimensions = new Vec2(300, 200);
                    determinedTargetAreaId = getHoveredAreaId(
                        adjustedPosition,
                        activeScreenAreas, // Pass the area state part
                        areaToViewport,
                        detectionDimensions
                    );
                    console.log('[areaStore] finalizeAreaPlacement: Calculated targetAreaId with getHoveredAreaId', determinedTargetAreaId);
                }

                // 3. Handle no target / invalid drop
                if (!determinedTargetAreaId) {
                    console.warn('[areaStore] finalizeAreaPlacement: No targetAreaId after check/calculation. Cleaning up.');
                    // If a new area was created, clean it up
                    if (!sourceAreaId) {
                        delete activeScreenAreas.areas[newAreaId];
                        // Don't decrement _id, accept potential gaps
                    }
                    activeScreenAreas.areaToOpen = null; // Clear temp state
                    return;
                }

                // 4. Calculate placement and clear temporary state
                const viewport = areaToViewport[determinedTargetAreaId];
                if (!viewport) {
                    console.error(`[areaStore] finalizeAreaPlacement: Viewport not found for target ${determinedTargetAreaId}. Bailing out.`);
                    // Clean up new area if created
                    if (!sourceAreaId) delete activeScreenAreas.areas[newAreaId];
                    activeScreenAreas.areaToOpen = null;
                    return;
                }
                if (!determinedPlacement) {
                    console.log('[areaStore] finalizeAreaPlacement: No placement in payload, calculating using getAreaToOpenPlacementInViewport...');
                    determinedPlacement = getAreaToOpenPlacementInViewport(viewport, adjustedPosition);
                    console.log('[areaStore] finalizeAreaPlacement: Calculated placement', determinedPlacement);
                }
                console.log('[areaStore] finalizeAreaPlacement: Final target and placement', { determinedTargetAreaId, determinedPlacement });
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
                let orientation: "horizontal" | "vertical" = determinedPlacement === "replace" ? "horizontal" : (determinedPlacement === "top" || determinedPlacement === "bottom" ? "vertical" : "horizontal");

                if (determinedPlacement === "replace") {
                    // On veut stacker deux areas, pas des rows
                    // Si la cible est un row, on descend jusqu'à la première area enfant
                    let targetAreaId = determinedTargetAreaId;
                    let targetArea = activeScreenAreas.areas[targetAreaId];
                    let replacedRowId: string | null = null;

                    // Si la cible est un area_row avec orientation stack, on le traite comme un area simple
                    if (activeScreenAreas.layout[targetAreaId]?.type === 'area_row' && 
                        (activeScreenAreas.layout[targetAreaId] as AreaRowLayout).orientation === 'stack') {
                        targetArea = activeScreenAreas.areas[targetAreaId];
                    } else if (!targetArea && activeScreenAreas.layout[targetAreaId]?.type === 'area_row') {
                        const found = findFirstAreaId(activeScreenAreas.layout, targetAreaId);
                        if (found) {
                            replacedRowId = targetAreaId;
                            targetAreaId = found;
                            targetArea = activeScreenAreas.areas[targetAreaId];
                        }
                    }

                    const sourceData = activeScreenAreas.areas[newAreaId];
                    if (!sourceData || !targetArea) {
                        console.error(`[finalizeAreaPlacement] Stack creation failed: Source or target area not found.`);
                        return;
                    }

                    // Créer le nouveau stack
                    const newStackId = `row-${activeScreenAreas._id + 1}`;
                    activeScreenAreas._id += 1;

                    // Créer le nouveau stack dans le layout
                    const newStack: AreaRowLayout = {
                        type: 'area_row',
                        id: newStackId,
                        orientation: 'stack',
                        areas: [
                            { id: targetAreaId, size: 0.5 },
                            { id: newAreaId, size: 0.5 }
                        ],
                        activeTabId: targetAreaId // L'area cible est active par défaut
                    };

                    // Trouver le parent row de l'area cible
                    const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
                    const parentRowId = areaToParentRow[targetAreaId];

                    if (parentRowId && activeScreenAreas.layout[parentRowId]?.type === 'area_row') {
                        // Si l'area cible a un parent row, on remplace sa référence dans ce parent
                        const parentRow = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
                        const targetIndex = parentRow.areas.findIndex(a => a.id === targetAreaId);
                        if (targetIndex !== -1) {
                            const originalSize = parentRow.areas[targetIndex].size;
                            parentRow.areas[targetIndex] = { id: newStackId, size: originalSize };
                        }
                    } else if (activeScreenAreas.rootId === targetAreaId) {
                        // Si l'area cible est la racine, on met le stack comme nouvelle racine
                        activeScreenAreas.rootId = newStackId;
                    }

                    // Ajouter le stack au layout
                    activeScreenAreas.layout[newStackId] = newStack;

                    // Mettre à jour l'area active
                    activeScreenAreas.activeAreaId = targetAreaId;
                } else {
                    // --- Logic for Top/Bottom/Left/Right placement ---
                    const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
                    const parentRowId = areaToParentRow[determinedTargetAreaId];
                    const parentRow = parentRowId ? activeScreenAreas.layout[parentRowId] as AreaRowLayout : null;

                    const newRowId = `row-${activeScreenAreas._id + 1}`; // ID for a potential new row

                    // Ensure layout entry exists for the area being placed
                    if (!activeScreenAreas.layout[newAreaId]) {
                        activeScreenAreas.layout[newAreaId] = { type: 'area', id: newAreaId };
                    }

                    if (parentRow && parentRow.type === 'area_row') { // Target is in a row
                        const targetIndex = parentRow.areas.findIndex(a => a.id === determinedTargetAreaId);
                        if (targetIndex === -1) {
                            console.error(`[finalizeAreaPlacement] Target ${determinedTargetAreaId} not found in parent ${parentRowId}`);
                            return; // Stop if layout inconsistent
                        }

                        if (parentRow.orientation === orientation) { // Same orientation: Add as sibling
                            const insertIndex = targetIndex + (determinedPlacement === "bottom" || determinedPlacement === "right" ? 1 : 0);
                            // Assign equal size initially
                            const newSize = 1 / (parentRow.areas.length + 1);
                            parentRow.areas.splice(insertIndex, 0, { id: newAreaId, size: newSize });
                            // Normalize sizes
                            parentRow.areas.forEach(area => area.size = 1 / parentRow.areas.length);

                        } else { // Different orientation: Create new nested row
                            activeScreenAreas._id += 1; // Increment for newRowId
                            const newNestedRow: AreaRowLayout = {
                                type: 'area_row',
                                id: newRowId,
                                orientation: orientation,
                                areas: determinedPlacement === "bottom" || determinedPlacement === "right"
                                    ? [{ id: determinedTargetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                                    : [{ id: newAreaId, size: 0.5 }, { id: determinedTargetAreaId, size: 0.5 }],
                            };
                            activeScreenAreas.layout[newRowId] = newNestedRow;
                            parentRow.areas[targetIndex] = { id: newRowId, size: parentRow.areas[targetIndex].size }; // Replace target with new row ref
                        }
                    } else { // Target is root or an orphan (no parentRow)
                        if (activeScreenAreas.rootId !== determinedTargetAreaId && activeScreenAreas.layout[determinedTargetAreaId]) {
                            console.warn(`[finalizeAreaPlacement] Target ${determinedTargetAreaId} is not root but has no parent row. This might be an orphaned area or a direct child of a non-row root.`);
                        }

                        activeScreenAreas._id += 1; // Increment for newRowId
                        const newRootRow: AreaRowLayout = {
                            type: 'area_row',
                            id: newRowId,
                            orientation: orientation,
                            areas: determinedPlacement === "bottom" || determinedPlacement === "right"
                                ? [{ id: determinedTargetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                                : [{ id: newAreaId, size: 0.5 }, { id: determinedTargetAreaId, size: 0.5 }]
                        };
                        activeScreenAreas.layout[newRowId] = newRootRow;
                        activeScreenAreas.rootId = newRowId;
                        // Ensure the old root (now a child) and newAreaId are in the layout map if they weren't already rows
                        if (!activeScreenAreas.layout[determinedTargetAreaId]) {
                            activeScreenAreas.layout[determinedTargetAreaId] = { type: 'area', id: determinedTargetAreaId };
                        }
                    }
                }

                // Update active area to the new/moved area
                if (activeScreenAreas.areas[newAreaId]) { // Ensure area data exists
                    state.screens[state.activeScreenId].areas.activeAreaId = newAreaId;
                    if (activeScreenAreas.areas[newAreaId].role === AREA_ROLE.LEAD) {
                        state.screens[state.activeScreenId].areas.lastLeadAreaId = newAreaId;
                    }
                }

                console.log('[areaStore] finalizeAreaPlacement: layout after finalize', activeScreenAreas.layout);
                console.log('[areaStore] finalizeAreaPlacement: areaToOpen after finalize', activeScreenAreas.areaToOpen);

            } catch (error) {
                console.error('[areaStore] Error during finalizeAreaPlacement:', error);
                // Attempt to clean up temporary state on error
                if (activeScreenAreas) {
                    activeScreenAreas.areaToOpen = null;
                }
            }
        }),

        cleanupTemporaryStates: () => set((state: WritableDraft<RootState>) => {
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            if (activeScreenAreas) {
                console.log('[areaStore] cleanupTemporaryStates called');
                activeScreenAreas.joinPreview = null;
                activeScreenAreas.areaToOpen = null;
                activeScreenAreas.lastSplitResultData = null;
                console.log('[areaStore] cleanupTemporaryStates: areaToOpen after cleanup', activeScreenAreas.areaToOpen);
            }
        }),

        setViewports: (viewports) => set((state: WritableDraft<RootState>) => {
            console.log('[areaStore] setViewports called with:', viewports);
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

                const { areaIdToSplit, parentRowId, horizontal } = payload;
                const areaToSplit = activeScreenAreas.layout[areaIdToSplit];

                // Si c'est un area_row avec orientation stack, on le traite comme un stack à dupliquer
                if (areaToSplit.type === 'area_row' && areaToSplit.orientation === 'stack') {
                    console.log('SPLIT STACK BRANCH', areaIdToSplit, parentRowId, areaToSplit);
                    // Dupliquer tous les enfants (areas) de la stack d'origine
                    const originalAreas = areaToSplit.areas;
                    const duplicatedAreas = [];
                    for (const child of originalAreas) {
                        const originalArea = activeScreenAreas.areas[child.id];
                        if (!originalArea) continue;
                        const newAreaId = `area-${activeScreenAreas._id + 1}`;
                        activeScreenAreas._id += 1;
                        // Copier type et state
                        activeScreenAreas.areas[newAreaId] = {
                            id: newAreaId,
                            type: originalArea.type,
                            state: { ...originalArea.state }
                        };
                        activeScreenAreas.layout[newAreaId] = { type: 'area', id: newAreaId };
                        duplicatedAreas.push({ id: newAreaId, size: child.size });
                    }
                    // Créer une nouvelle stack avec les duplicatas
                    const newStackId = `row-${activeScreenAreas._id + 1}`;
                    activeScreenAreas._id += 1;
                    const newStack: AreaRowLayout = {
                        id: newStackId,
                        type: 'area_row',
                        orientation: 'stack',
                        areas: duplicatedAreas,
                        activeTabId: duplicatedAreas[0]?.id
                    };
                    activeScreenAreas.layout[newStackId] = newStack;
                    // Créer un nouveau row horizontal/vertical pour contenir les deux stacks
                    const newRowId = `row-${activeScreenAreas._id + 1}`;
                    activeScreenAreas._id += 1;
                    const newRow: AreaRowLayout = {
                        id: newRowId,
                        type: 'area_row',
                        orientation: horizontal ? 'horizontal' : 'vertical',
                        areas: [
                            { id: areaIdToSplit, size: 0.5 },
                            { id: newStackId, size: 0.5 }
                        ]
                    };
                    activeScreenAreas.layout[newRowId] = newRow;
                    // Si le stack d'origine a un parent, remplacer la référence dans le parent par le nouveau row
                    if (parentRowId) {
                        const parentRow = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
                        if (parentRow?.type === 'area_row') {
                            const index = parentRow.areas.findIndex(a => a.id === areaIdToSplit);
                            if (index !== -1) {
                                const originalSize = parentRow.areas[index].size ?? 0.5;
                                parentRow.areas[index] = { id: newRowId, size: originalSize };
                            }
                        }
                    } else {
                        // Sinon, le nouveau row devient root
                        activeScreenAreas.rootId = newRowId;
                    }
                    result = { newRowId: newRowId, separatorIndex: 1 };
                    return;
                }

                // Comportement existant pour les autres types d'area
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

                            // Si l'orientation du parent est la même que celle du nouveau row, on simplifie la structure
                            if (parentRow.orientation === newRow.orientation) {
                                console.log(`Simplifying layout: parent row ${parentRowId} has same orientation as new row ${newRowId}`);
                                // Au lieu de remplacer par le nouveau row, on ajoute directement les areas
                                const areasToAdd = newRow.areas.map(area => ({
                                    id: area.id,
                                    size: (area.size ?? 0.5) * originalSize // Ajuster la taille en fonction de la taille originale
                                }));
                                parentRow.areas.splice(index, 1, ...areasToAdd);

                                // Mettre à jour le résultat pour refléter la nouvelle structure
                                result = {
                                    newRowId: parentRowId,
                                    separatorIndex: index + 1 // L'index du séparateur est après la première area
                                };
                            } else {
                                // Si les orientations sont différentes, on garde la structure actuelle
                                parentRow.areas[index] = { id: newRowId, size: originalSize };
                                result = { newRowId: newRowId, separatorIndex: 1 };
                            }
                        } else {
                            console.error(`splitArea Error: Area ${areaIdToSplit} not in parent ${parentRowId}.`);
                        }
                    } else {
                        console.error(`splitArea Error: Parent ${parentRowId} not found or not row.`);
                    }
                } else if (activeScreenAreas.rootId === areaIdToSplit) {
                    activeScreenAreas.rootId = newRowId; // New row becomes root
                    result = { newRowId: newRowId, separatorIndex: 1 };
                } else {
                    // Area has no parent and isn't root - orphan?
                    console.error(`splitArea Error: Area ${areaIdToSplit} has no parent and is not root.`);
                }

                // 4. Increment ID counter AFTER using baseId+1 and baseId+2
                activeScreenAreas._id = baseId + 2;

                // 5. Set result
                activeScreenAreas.lastSplitResultData = result;

                // 6. Simplification récursive de la structure après split
                function simplifyRecursively(rowId: string | null | undefined) {
                    if (!rowId) return;
                    let currentId = rowId;
                    while (currentId) {
                        const before = activeScreenAreas.layout[currentId];
                        simplifyLayoutNodeIfNeeded(activeScreenAreas, currentId);
                        // Si le node a été supprimé, on remonte au parent
                        const areaToParentRowMap = computeAreaToParentRow(activeScreenAreas.layout, activeScreenAreas.rootId);
                        currentId = areaToParentRowMap[currentId];
                        if (before && !activeScreenAreas.layout[before.id]) {
                            continue;
                        } else {
                            break;
                        }
                    }
                }
                // Fonction pour fusionner les rows de même orientation
                function mergeRowsOfSameOrientation(rowId: string | null | undefined, parentId: string | null = null) {
                    if (!rowId) return;
                    const row = activeScreenAreas.layout[rowId];
                    if (!row || row.type !== 'area_row') return;
                    let changed = false;
                    for (let i = 0; i < row.areas.length;) {
                        const childId = row.areas[i].id;
                        const child = activeScreenAreas.layout[childId];
                        if (child && child.type === 'area_row' && child.orientation === row.orientation) {
                            // Fusionner les enfants du row enfant dans le row parent
                            const childRow = child;
                            const parentSize = row.areas[i].size ?? 1 / row.areas.length;
                            const totalChildSize = childRow.areas.reduce((acc, a) => acc + (a.size ?? 0), 0) || 1;
                            const newAreas = childRow.areas.map(a => ({
                                id: a.id,
                                size: (a.size ?? 1 / childRow.areas.length) * parentSize / totalChildSize
                            }));
                            // On remplace le row enfant par ses propres enfants (en évitant les doublons)
                            row.areas.splice(i, 1, ...newAreas.filter(na => !row.areas.some(a => a.id === na.id)));
                            // On supprime le row enfant de la layout
                            delete activeScreenAreas.layout[childId];
                            changed = true;
                            // On ne fait pas i++ car on a remplacé l'élément courant par plusieurs
                        } else {
                            i++;
                        }
                    }
                    // Appel récursif sur les enfants restants
                    for (const area of row.areas) {
                        mergeRowsOfSameOrientation(area.id, rowId);
                    }
                    // Si on a changé la structure, on peut relancer la fusion sur ce row
                    if (changed) {
                        mergeRowsOfSameOrientation(rowId, parentId);
                    }
                }
                // Fonction pour nettoyer les rows orphelins (non référencés par un parent ni root)
                function cleanOrphanRows() {
                    const referenced = new Set<string>();
                    // On marque tous les rows référencés par le root
                    function mark(id: string | null | undefined) {
                        if (!id || referenced.has(id)) return;
                        referenced.add(id);
                        const node = activeScreenAreas.layout[id];
                        if (node && node.type === 'area_row') {
                            for (const area of node.areas) {
                                mark(area.id);
                            }
                        }
                    }
                    mark(activeScreenAreas.rootId);
                    // On supprime tous les rows non référencés
                    for (const id in activeScreenAreas.layout) {
                        const node = activeScreenAreas.layout[id];
                        if (node && node.type === 'area_row' && !referenced.has(id)) {
                            delete activeScreenAreas.layout[id];
                        }
                    }
                }
                // On simplifie à partir du parent direct
                simplifyRecursively(parentRowId);
                // On fusionne les rows de même orientation à partir du root
                mergeRowsOfSameOrientation(activeScreenAreas.rootId);
                // On nettoie les rows orphelins
                cleanOrphanRows();

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
            return activeScreenAreas ? activeScreenAreas.areas[id] || activeScreenAreas.layout[id] : undefined;
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
        getLastLeadAreaId: () => {
            const state = get();
            const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
            return activeScreenAreas?.lastLeadAreaId || null;
        },
        findParentRowAndIndices: findParentRowAndIndices,
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

        removeScreen: (screenId) => set((state: WritableDraft<RootState>) => {
            // Vérifier s'il reste plus d'un écran classique
            const classicIds = Object.keys(state.screens).filter(id => !state.screens[id]?.isDetached);
            if (classicIds.length <= 1 && !state.screens[screenId]?.isDetached) {
                console.warn('Cannot remove the last classic screen');
                return;
            }

            if (!state.screens[screenId]) {
                console.warn(`Attempted to remove non-existent screen ID: ${screenId}`);
                return;
            }

            // Supprimer l'écran
            delete state.screens[screenId];

            // Mettre à jour le compteur d'ID d'écran (max des classiques + 1)
            state.nextScreenId = Object.keys(state.screens)
                .filter(id => !id.startsWith('detached-'))
                .reduce((max, id) => Math.max(max, parseInt(id)), 0) + 1;

            // Si l'écran supprimé était actif, basculer vers le plus petit ID classique restant
            if (state.activeScreenId === screenId) {
                const classicIdsLeft = Object.keys(state.screens)
                    .filter(id => !state.screens[id]?.isDetached)
                    .sort((a, b) => parseInt(a) - parseInt(b));
                state.activeScreenId = classicIdsLeft[0] || Object.keys(state.screens)[0] || '1';
            }

            // Mettre à jour l'URL si nécessaire
            const url = new URL(window.location.href);
            if (url.searchParams.get('screen') === screenId) {
                url.searchParams.set('screen', state.activeScreenId);
                window.history.replaceState({}, '', url.toString());
            }
        }),

        duplicateScreen: (screenId) => set((state: WritableDraft<RootState>) => {
            if (!state.screens[screenId]) {
                console.warn(`Attempted to duplicate non-existent screen ID: ${screenId}`);
                return;
            }

            const newScreenId = state.nextScreenId.toString();
            const sourceScreen = state.screens[screenId];

            // Créer une copie profonde de l'écran source
            state.screens[newScreenId] = JSON.parse(JSON.stringify(sourceScreen));

            // Mettre à jour le compteur d'ID d'écran et l'écran actif
            state.nextScreenId += 1;
            state.activeScreenId = newScreenId;
        }),

        detachArea: (areaId) => set((state: WritableDraft<RootState>) => {
            const area = state.getAreaById(areaId);
            if (!area) {
                console.warn(`Area ${areaId} not found`);
                return;
            }

            const newScreenId = `detached-${state.nextScreenId}`;
            state.nextScreenId += 1;

            // Créer un nouveau screen détaché
            state.screens[newScreenId] = {
                ...createInitialScreenState(),
                areas: {
                    ...createInitialScreenState().areas
                },
                isDetached: true,
                detachedFromAreaId: areaId
            };

            // Copier l'area dans le nouveau screen
            const newScreenAreasState = state.screens[newScreenId].areas;
            newScreenAreasState.areas[areaId] = { ...area };
            newScreenAreasState.layout = {
                [areaId]: { type: 'area', id: areaId }
            };
            newScreenAreasState.rootId = areaId;
            newScreenAreasState.activeAreaId = areaId;

            // Supprimer l'area du screen d'origine (areas et layout)
            const originScreen = state.screens[state.activeScreenId];
            if (originScreen) {
                // Supprimer l'area de la map
                delete originScreen.areas.areas[areaId];
                // Supprimer la référence dans le layout
                for (const key in originScreen.areas.layout) {
                    const item = originScreen.areas.layout[key];
                    if (item.type === 'area_row') {
                        item.areas = item.areas.filter(a => a.id !== areaId);
                    }
                }
                // Supprimer l'entrée de layout si c'est un node direct
                delete originScreen.areas.layout[areaId];
                // Nettoyer le rootId si besoin
                if (originScreen.areas.rootId === areaId) {
                    originScreen.areas.rootId = null;
                }
                // (Optionnel) : simplifier le layout si des rows sont devenues vides
            }

            // Ouvrir dans une nouvelle fenêtre sans navigation
            const features = [
                'width=800',
                'height=600',
                'menubar=no',
                'toolbar=no',
                'location=no',
                'status=no',
                'scrollbars=yes',
                'resizable=yes'
            ].join(',');
            window.open(`?screen=${newScreenId}`, newScreenId, features);
        }),

        // --- Expose Area Slice Actions/Selectors directly ---
        addArea: areaSlice.addArea,
        removeArea: areaSlice.removeArea,
        setActiveArea: areaSlice.setActiveArea,
        updateArea: areaSlice.updateArea,
        updateLayout: areaSlice.updateLayout,
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
        findParentRowAndIndices: findParentRowAndIndices,
    };
};


// --- Store Creation (applying middlewares) ---
// Générer un ID unique pour chaque fenêtre
const windowId = Math.random().toString(36).slice(2);
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
                                },
                                isDetached: screen.isDetached,
                                detachedFromAreaId: screen.detachedFromAreaId
                            };
                        }
                    }
                    return {
                        screens: persistedScreens,
                        activeScreenId: state.activeScreenId,
                        nextScreenId: state.nextScreenId,
                        windowId // Ajout du windowId à l'objet persisté
                    };
                },
                onRehydrateStorage: () => (state, error) => {
                    // Handle hydration results
                    if (error) {
                        console.error('[karmycRootState persist] Hydration failed:', error);
                    } else {
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
        // Vérifier si nous sommes dans un environnement navigateur
        if (typeof window === 'undefined') {
            return;
        }

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

// Synchronisation inter-fenêtres : ignorer l'event storage si c'est la même fenêtre
if (typeof window !== 'undefined') {
    window.addEventListener('storage', (event) => {
      if (event.key === 'karmycRootState') {
        const local = localStorage.getItem('karmycRootState');
        if (!local) return;
        const parsed = JSON.parse(local);
        if (parsed?.state?.windowId === windowId) return;
        
        // Récupérer l'état actuel du store
        const currentState = useKarmycStore.getState();
        const localScreens = parsed?.state?.screens || {};
        
        // Vérifier si l'état local est différent de l'état reçu
        const hasChanges = Object.keys(localScreens).some(screenId => {
          const localScreen = localScreens[screenId];
          const currentScreen = currentState.screens[screenId];
          return !currentScreen || JSON.stringify(localScreen) !== JSON.stringify(currentScreen);
        });

        // Ne mettre à jour que si des changements sont détectés
        if (hasChanges) {
          useKarmycStore.setState((state) => ({
            ...state,
            screens: localScreens
          }));
        }
      }
    });
  }
  
