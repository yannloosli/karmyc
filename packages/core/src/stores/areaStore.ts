import { temporal } from 'zundo';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AreaTypeValue } from '../constants';
import { Area, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types/geometry';
import { validateArea } from '../utils/validation';
import { performance } from './middleware/performanceMiddleware';

// Simplified validation function - NOW RETURNS ONLY DATA
function validateLoadedState(state: Partial<AreaState>): Omit<AreaState, 'addArea' | 'removeArea' | 'setActiveArea' | 'updateArea' | 'setAreaToOpen' | 'updateAreaToOpenPosition' | 'finalizeAreaPlacement' | 'cleanupTemporaryStates' | 'setViewports' | 'setRowSizes' | 'splitArea' | 'setJoinPreview' | 'joinOrMoveArea' | 'getLastSplitResult' | 'getActiveArea' | 'getAreaById' | 'getAllAreas' | 'getAreaErrors'> {
    // Default state DATA ONLY
    const defaultDataState = {
        _id: 0,
        errors: [],
        activeAreaId: null,
        layout: {},
        areas: {},
        viewports: {},
        joinPreview: null,
        rootId: null,
        areaToOpen: null,
        lastSplitResultData: null,
    };

    // Minimal validation: Check if essential parts exist and rootId is in layout
    if (state?.rootId && state.layout && typeof state.layout === 'object' && state.layout[state.rootId] && state.areas && typeof state.areas === 'object') {
        console.log("[validateLoadedState] Loaded state seems valid, merging with defaults.");
        // Merge loaded state with defaults to ensure all keys are present
        const mergedState = {
            ...defaultDataState, // Provides default data structure
            ...state,           // Overwrite with loaded values (might include functions if loaded state had them, but we strip them)
            // Ensure required fields have correct types or fallbacks
            _id: typeof state._id === 'number' ? state._id : defaultDataState._id,
            rootId: state.rootId, // Already checked existence
            layout: state.layout, // Already checked existence
            areas: state.areas,   // Already checked existence
            activeAreaId: state.activeAreaId ?? defaultDataState.activeAreaId,
            // Explicitly reset temporary/non-persisted states to null/empty
            errors: [],
            joinPreview: null,
            areaToOpen: null,
            viewports: {},
            lastSplitResultData: null,
        };
        // Strip potential functions that might have come from persistedState
        const {
            addArea, removeArea, setActiveArea, updateArea, setAreaToOpen, updateAreaToOpenPosition,
            finalizeAreaPlacement, cleanupTemporaryStates, setViewports, setRowSizes,
            splitArea, setJoinPreview, joinOrMoveArea, getLastSplitResult,
            getActiveArea, getAreaById, getAllAreas, getAreaErrors,
            ...dataOnly
        } = mergedState as any; // Cast to allow stripping
        return dataOnly;
    }

    // If validation fails, return the absolute default DATA
    console.warn("[validateLoadedState] Validation failed, returning default initial data state.");
    return defaultDataState;
}

// --- Define Join Preview State Type ---
export interface JoinPreviewState {
    areaId: string | null; // Target area ID
    movingInDirection: CardinalDirection | null;
    eligibleAreaIds: string[]; // IDs of areas that can be joined with
}

// --- Define Split Result Type ---
interface SplitResult {
    newRowId: string;
    separatorIndex: number;
}

export interface AreaState {
    _id: number;
    rootId: string | null;
    errors: string[];
    activeAreaId: string | null;
    // Use the defined type for joinPreview
    joinPreview: JoinPreviewState | null;
    layout: {
        [key: string]: AreaRowLayout | AreaLayout;
    };
    areas: {
        [key: string]: Area<AreaTypeValue>;
    };
    viewports: {
        [key: string]: Rect;
    };
    areaToOpen: null | {
        position: Point;
        area: {
            type: string;
            state: any;
        };
    };
    // Internal state to hold the result of the last split operation
    lastSplitResultData: SplitResult | null;

    // Actions
    addArea: (area: Area<AreaTypeValue>) => void;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<Area<AreaTypeValue>> & { id: string }) => void;
    setAreaToOpen: (payload: null | {
        position: Point;
        area: {
            type: string;
            state: any;
        };
    }) => void;
    updateAreaToOpenPosition: (position: Point) => void;
    finalizeAreaPlacement: () => void;
    cleanupTemporaryStates: () => void;
    setViewports: (viewports: Record<string, Rect>) => void;
    setRowSizes: (payload: { rowId: string; sizes: number[] }) => void;
    // NEW ACTIONS
    splitArea: (payload: {
        areaIdToSplit: string;
        parentRowId: string | null; // ID of the parent row, if exists
        horizontal: boolean; // Desired orientation of the split
        corner: IntercardinalDirection; // Corner dragged from (optional, might inform orientation)
    }) => SplitResult | null; // Returns result directly
    setJoinPreview: (payload: JoinPreviewState | null) => void;
    joinOrMoveArea: (payload: {
        sourceAreaId: string;
        targetAreaId: string;
        direction: CardinalDirection;
    }) => void; // Placeholder
    // Helper to get the last split result without making it part of the persisted state
    getLastSplitResult: () => SplitResult | null;

    // Sélecteurs
    getActiveArea: () => Area<AreaTypeValue> | null;
    getAreaById: (id: string) => Area<AreaTypeValue> | undefined;
    getAllAreas: () => Record<string, Area<AreaTypeValue>>;
    getAreaErrors: () => string[];
}

// Load and validate initial state DATA
let initialStateData: ReturnType<typeof validateLoadedState>;
try {
    const savedStateString = localStorage.getItem('areaState');
    console.log("Raw loaded state from localStorage:", savedStateString);
    const parsedData = savedStateString ? JSON.parse(savedStateString) : null;
    const stateToValidate = parsedData?.state ?? {};
    initialStateData = validateLoadedState(stateToValidate);
} catch (e) {
    console.error("Failed to parse or validate saved area state:", e);
    initialStateData = validateLoadedState({}); // Fallback to default data
}

// Helper function to find the parent row and indices within that row
// Note: This is a simplified helper and might need refinement based on the exact layout structure
function findParentRowAndIndices(layout: { [key: string]: AreaRowLayout | AreaLayout }, sourceAreaId: string, targetAreaId: string): { parentRow: AreaRowLayout | null; sourceIndex: number; targetIndex: number } {
    for (const layoutId in layout) {
        const item = layout[layoutId];
        if (item.type === 'area_row') {
            const row = item as AreaRowLayout;
            const sourceIndex = row.areas.findIndex(a => a.id === sourceAreaId);
            const targetIndex = row.areas.findIndex(a => a.id === targetAreaId);

            if (sourceIndex !== -1 && targetIndex !== -1) {
                // Ensure they are adjacent based on indices (more robust check might be needed depending on direction)
                if (Math.abs(sourceIndex - targetIndex) === 1) {
                    return { parentRow: row, sourceIndex, targetIndex };
                }
            }
        }
    }
    return { parentRow: null, sourceIndex: -1, targetIndex: -1 };
}

// Helper function to recursively find all descendant area IDs within a layout item (area or row)
function findAllDescendantAreaIds(layout: { [key: string]: AreaRowLayout | AreaLayout }, itemId: string): Set<string> {
    const descendantIds = new Set<string>();
    const queue: string[] = [itemId];
    const visited = new Set<string>(); // Prevent infinite loops in case of cyclic refs (shouldn't happen)

    while (queue.length > 0) {
        const currentId = queue.shift()!;
        if (visited.has(currentId)) continue;
        visited.add(currentId);

        const item = layout[currentId];
        if (!item) continue;

        // Add the item itself if it's an area ID (not just a layout ID)
        // Assuming area IDs exist in the layout map with type 'area' initially
        if (item.type === 'area') {
            descendantIds.add(currentId);
        } else if (item.type === 'area_row') {
            const row = item as AreaRowLayout;
            if (row.areas && Array.isArray(row.areas)) {
                row.areas.forEach(areaRef => {
                    if (areaRef && areaRef.id && !visited.has(areaRef.id)) {
                        queue.push(areaRef.id);
                        // Add the area ID referenced by the row
                        descendantIds.add(areaRef.id);
                    }
                });
            }
        }
    }
    return descendantIds;
}

// Define the core state logic with immer first
const immerConfig = immer<AreaState>((set, get) => {
    console.log('[areaStore] Initializing immer state logic with initial data:', initialStateData);
    return {
        ...initialStateData, // Start with validated initial data

        // Actions with logs
        addArea: (area) => {
            console.log('[areaStore] addArea called', area);
            const validation = validateArea(area);
            if (!validation.isValid) {
                set(state => {
                    console.log('[areaStore] set (addArea - validation error)');
                    state.errors = validation.errors;
                });
                console.error("Validation failed for area:", validation.errors);
                return;
            }
            set(state => {
                console.log('[areaStore] set (addArea - success)');
                state.areas[area.id] = area;
                state.layout[area.id] = { type: 'area', id: area.id }; // Simplified layout entry
                if (!state.rootId) state.rootId = area.id; // Set root if first area
                state._id += 1; // Assuming this counts areas added
                state.errors = [];
            });
        },

        removeArea: (id) => {
            console.log('[areaStore] removeArea called', id);
            // TODO: Implement robust removal logic (updating layout, handling root, etc.)
            set(state => {
                console.log('[areaStore] set (removeArea)');
                delete state.areas[id];
                delete state.layout[id];
                // Placeholder: Needs proper layout cleanup
                if (state.activeAreaId === id) {
                    state.activeAreaId = null;
                }
                if (state.rootId === id) {
                    // Find a new root or set to null
                    state.rootId = Object.keys(state.areas)[0] || null;
                }
                state.errors = [];
            });
        },

        setActiveArea: (id) => {
            console.log('[areaStore] setActiveArea called', id);
            set(state => {
                console.log('[areaStore] set (setActiveArea)');
                if (id === null || state.areas[id]) {
                    state.activeAreaId = id;
                } else {
                    console.warn(`Attempted to set active area to non-existent ID: ${id}`);
                }
                state.errors = [];
            });
        },

        updateArea: (areaData) => {
            console.log('[areaStore] updateArea called', areaData);
            set(state => {
                const area = state.areas[areaData.id];
                if (area) {
                    const { id, ...changes } = areaData;
                    // Add validation if needed before update
                    console.log('[areaStore] set (updateArea - success)');
                    state.areas[id] = { ...area, ...changes };
                    state.errors = [];
                } else {
                    console.log('[areaStore] set (updateArea - not found)');
                    state.errors = [`Area with ID ${areaData.id} not found for update.`];
                    console.error("Update failed:", state.errors);
                }
            });
        },

        setAreaToOpen: (payload) => {
            console.log('[areaStore] setAreaToOpen called', payload);
            set(state => {
                console.log('[areaStore] set (setAreaToOpen)');
                state.areaToOpen = payload;
            });
        },

        updateAreaToOpenPosition: (position) => {
            console.log('[areaStore] updateAreaToOpenPosition called', position);
            set(state => {
                if (state.areaToOpen) {
                    console.log('[areaStore] set (updateAreaToOpenPosition)');
                    state.areaToOpen.position = position;
                }
            });
        },

        finalizeAreaPlacement: () => {
            console.log('[areaStore] finalizeAreaPlacement called');
            // Placeholder: Actual logic to place the area based on areaToOpen
            // This would likely involve calling addArea or updateArea/layout
            set(state => {
                console.log('[areaStore] set (finalizeAreaPlacement) - Placeholder');
                // Example: Clear areaToOpen after placement
                state.areaToOpen = null;
            });
        },

        cleanupTemporaryStates: () => {
            console.log('[areaStore] cleanupTemporaryStates called');
            set(state => {
                console.log('[areaStore] set (cleanupTemporaryStates)');
                state.joinPreview = null;
                state.areaToOpen = null;
                state.lastSplitResultData = null;
            });
        },

        setViewports: (viewports) => {
            console.log('[areaStore] setViewports called', viewports);
            set(state => {
                console.log('[areaStore] set (setViewports)');
                state.viewports = viewports;
            });
        },

        setRowSizes: (payload) => {
            console.log('[areaStore] setRowSizes called', payload);
            set(state => {
                const rowLayout = state.layout[payload.rowId];
                if (rowLayout && rowLayout.type === 'area_row') {
                    const typedRowLayout = rowLayout as AreaRowLayout; // Cast for type safety
                    if (typedRowLayout.areas.length === payload.sizes.length) {
                        console.log('[areaStore] set (setRowSizes) applying sizes');
                        typedRowLayout.areas.forEach((areaInfo, index) => {
                            if (areaInfo) { // Check if areaInfo is defined
                                areaInfo.size = payload.sizes[index];
                            }
                        });
                        // Optional: Normalize sizes after assignment if needed
                        const totalSize = typedRowLayout.areas.reduce((sum, areaInfo) => sum + (areaInfo?.size ?? 0), 0);
                        if (totalSize > 0 && Math.abs(totalSize - 1.0) > 0.001) { // Check if normalization is needed
                            console.warn(`[areaStore] setRowSizes: Normalizing sizes for row ${payload.rowId}`);
                            const scale = 1.0 / totalSize;
                            typedRowLayout.areas.forEach(areaInfo => {
                                if (areaInfo) {
                                    areaInfo.size *= scale;
                                }
                            });
                        }
                    } else {
                        console.warn(`[areaStore] setRowSizes: Mismatch between areas count (${typedRowLayout.areas.length}) and sizes count (${payload.sizes.length}) for row ${payload.rowId}.`);
                    }
                } else {
                    console.warn(`[areaStore] setRowSizes: Row with ID ${payload.rowId} not found or not a row layout.`);
                }
            });
        },

        splitArea: (payload) => {
            console.log('[areaStore] splitArea called', payload);
            // Placeholder: Actual split logic needed here
            // Should return SplitResult | null
            const result: SplitResult | null = null; // Placeholder
            set(state => {
                console.log('[areaStore] set (splitArea) - Placeholder');
                state.lastSplitResultData = result;
                // ... update layout and areas ...
            });
            return result;
        },

        setJoinPreview: (payload) => {
            console.log('[areaStore] setJoinPreview called', payload);
            set(state => {
                console.log('[areaStore] set (setJoinPreview)');
                state.joinPreview = payload;
            });
        },

        joinOrMoveArea: (payload) => {
            console.log('[areaStore] joinOrMoveArea called', payload);
            // Placeholder: Actual join/move logic
            set(state => {
                console.log('[areaStore] set (joinOrMoveArea) - Placeholder');
                // ... update layout and areas ...
                state.joinPreview = null; // Clear preview after operation
            });
        },

        getLastSplitResult: () => {
            console.log('[areaStore] getLastSplitResult called');
            return get().lastSplitResultData;
        },

        // Sélecteurs
        getActiveArea: () => {
            const state = get();
            return state.activeAreaId ? state.areas[state.activeAreaId] : null;
        },
        getAreaById: (id) => get().areas[id],
        getAllAreas: () => get().areas,
        getAreaErrors: () => get().errors,
    };
});

// Wrap with performance middleware
// Assuming performanceMiddleware is correctly typed to handle immer
const performanceConfig = performance(immerConfig);

// Wrap with temporal
const temporalConfig = temporal(performanceConfig, {
    partialize: (state: AreaState): Partial<AreaState> => {
        // Define what parts of the state should be tracked by undo/redo
        const { _id, rootId, layout, areas, activeAreaId } = state;
        console.log('[areaStore temporal] Partialize called, tracking:', { _id, rootId, layout, areas, activeAreaId });
        return { _id, rootId, layout, areas, activeAreaId };
    },
    onSave: (pastState: AreaState, currentState: AreaState) => {
        console.log('[areaStore temporal] onSave called', { pastState, currentState });
    },
    // limit: 50 // Example limit
});

// Wrap with persist
const persistConfig = persist(temporalConfig, {
    name: 'areaState', // Storage key
    partialize: (state: AreaState) => {
        // Use the validated data structure for persistence
        const validatedData = validateLoadedState(state);
        // console.log('[areaStore persist] Partialize called, persisting validated data:', validatedData);
        return validatedData;
    },
    // storage: createJSONStorage(() => localStorage), // Default is localStorage
    onRehydrateStorage: (state) => {
        console.log('[areaStore persist] Hydration starts');
        return (state, error) => {
            if (error) {
                console.error('[areaStore persist] Hydration failed:', error);
            } else {
                console.log('[areaStore persist] Hydration finished', state);
            }
        };
    },
    skipHydration: true, // Skip initial hydration, we handle it manually with initialStateData
});

// Finally, wrap with devtools and create the store
export const useAreaStore = create<AreaState>()(
    devtools(persistConfig, { name: 'AreaStore' })
);

// Manual hydration after store creation
useAreaStore.persist.rehydrate();
console.log('[areaStore] Manual rehydration triggered.');
