import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AreaTypeValue } from '../constants';
import { Area, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types/geometry';
import { validateArea } from '../utils/validation';

// Simplified validation function
function validateLoadedState(state: Partial<AreaState>): AreaState {
    const defaultState: Omit<AreaState, 'splitArea' | 'setJoinPreview' | 'joinOrMoveArea' | 'getLastSplitResult'> & Pick<AreaState, 'splitArea' | 'setJoinPreview' | 'joinOrMoveArea' | 'getLastSplitResult'> = {
        _id: 0,
        errors: [],
        activeAreaId: null,
        layout: {},
        areas: {},
        viewports: {},
        joinPreview: null,
        rootId: null,
        areaToOpen: null,
        lastSplitResultData: null, // Add storage for split result
        // Actions - provide dummy implementations for default
        addArea: () => { console.warn("Default addArea called"); },
        removeArea: () => { console.warn("Default removeArea called"); },
        setActiveArea: () => { console.warn("Default setActiveArea called"); },
        updateArea: () => { console.warn("Default updateArea called"); },
        setAreaToOpen: () => { console.warn("Default setAreaToOpen called"); },
        updateAreaToOpenPosition: () => { console.warn("Default updateAreaToOpenPosition called"); },
        finalizeAreaPlacement: () => { console.warn("Default finalizeAreaPlacement called"); },
        cleanupTemporaryStates: () => { console.warn("Default cleanupTemporaryStates called"); },
        setViewports: () => { console.warn("Default setViewports called"); },
        setRowSizes: () => { console.warn("Default setRowSizes called"); },
        // NEW ACTIONS
        splitArea: () => { console.warn("Default splitArea called"); return null; },
        setJoinPreview: () => { console.warn("Default setJoinPreview called"); },
        joinOrMoveArea: () => { console.warn("Default joinOrMoveArea called"); },
        getLastSplitResult: () => null,
        // Sélecteurs
        getActiveArea: () => null,
        getAreaById: () => undefined,
        getAllAreas: () => ({}),
        getAreaErrors: () => []
    };

    // Minimal validation: Check if essential parts exist and rootId is in layout
    if (state?.rootId && state.layout && typeof state.layout === 'object' && state.layout[state.rootId] && state.areas && typeof state.areas === 'object') {
        console.log("Loaded state seems valid, merging with defaults.");
        // Merge loaded state with defaults to ensure all functions/keys are present
        const mergedState = {
            ...defaultState, // Provides default functions and initial values
            ...state,        // Overwrite with loaded values
            // Ensure required fields have correct types or fallbacks
            _id: typeof state._id === 'number' ? state._id : 0,
            rootId: state.rootId, // Already checked existence
            layout: state.layout, // Already checked existence
            areas: state.areas,   // Already checked existence
            activeAreaId: state.activeAreaId ?? null,
            // Explicitly reset temporary/non-persisted states to null/empty
            errors: [],
            joinPreview: null,
            areaToOpen: null,
            viewports: {},
            lastSplitResultData: null, // Ensure reset on load
        };
        return mergedState as AreaState; // Cast needed because of Omit/Pick trick
    }

    // If validation fails, return the absolute default
    console.warn("Validation failed on loaded state, returning default initial state.");
    return defaultState as AreaState; // Cast needed
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

// Load and validate initial state
let initialState: AreaState;
try {
    const savedStateString = localStorage.getItem('areaState'); // Use the correct key 'areaState'
    console.log("Raw loaded state from localStorage:", savedStateString);
    const parsedData = savedStateString ? JSON.parse(savedStateString) : null;

    // Extract the actual state object if the parsed data has the { state: ..., version: ... } structure
    const stateToValidate = parsedData?.state ?? {}; // Use parsedData.state if it exists, otherwise empty object

    // Pass the extracted state to the validator
    // initialState = savedState ? validateLoadedState(JSON.parse(savedState)) : validateLoadedState({}); // Remplacé
    initialState = validateLoadedState(stateToValidate);

} catch (e) {
    console.error("Failed to parse or validate saved area state:", e);
    initialState = validateLoadedState({}); // Fallback to default
}

export const useAreaStore = create<AreaState>()(
    devtools(
        persist(
            immer((set, get) => ({
                ...initialState,
                lastSplitResultData: null, // Ensure it's not persisted

                // Actions
                addArea: (area: Area<AreaTypeValue>) => {
                    const validation = validateArea(area);
                    if (!validation.isValid) {
                        set(state => {
                            state.errors = validation.errors;
                        });
                        console.error("Validation échouée pour la zone:", validation.errors);
                        return;
                    }

                    const areaId = area.id || `area-${++get()._id}`;

                    set(state => {
                        state.areas[areaId] = {
                            ...area,
                            id: areaId,
                            state: area.state,
                        };

                        if (!state.rootId) {
                            // First area added, becomes root
                            state.rootId = areaId;
                            state.layout[areaId] = { type: 'area', id: areaId };
                        } else {
                            // Subsequent areas added
                            const oldRootId = state.rootId;
                            const rootLayout = state.layout[oldRootId];

                            if (rootLayout && rootLayout.type === 'area') {
                                // Generate rowId using the counter
                                const rowId = `row-${++state._id}`;
                                state.layout[rowId] = {
                                    type: 'area_row',
                                    id: rowId,
                                    orientation: 'horizontal',
                                    areas: [
                                        { id: oldRootId, size: 70 },
                                        { id: areaId, size: 30 }
                                    ]
                                };
                                state.layout[oldRootId] = { type: 'area', id: oldRootId };
                                state.layout[areaId] = { type: 'area', id: areaId };
                                state.rootId = rowId;
                            } else if (rootLayout && rootLayout.type === 'area_row') {
                                // If root is already a row, add the new area to it
                                state.layout[areaId] = { type: 'area', id: areaId };
                                const rowLayout = rootLayout as AreaRowLayout;
                                if (rowLayout.areas) {
                                    // Use let for newZoneSize as it might be reassigned
                                    let newZoneSize = 30; // Example size, maybe should be smarter?
                                    const currentTotalSize = rowLayout.areas.reduce((sum, a) => sum + (a?.size || 0), 0);

                                    // Ensure sizes are normalized (0-100 scale initially?)
                                    if (currentTotalSize > 0) {
                                        const scaleFactor = (100 - newZoneSize) / currentTotalSize;
                                        rowLayout.areas.forEach(a => {
                                            if (a) a.size = (a.size || 0) * scaleFactor;
                                        });
                                    } else {
                                        // If current total is 0, distribute space equally among existing + new
                                        const numAreas = rowLayout.areas.length;
                                        const equalSize = 100 / (numAreas + 1);
                                        rowLayout.areas.forEach(a => { if (a) a.size = equalSize; });
                                        newZoneSize = equalSize; // Reassign newZoneSize
                                    }

                                    // Add the new area
                                    rowLayout.areas.push({ id: areaId, size: newZoneSize });

                                    // Final normalization pass to ensure sum is exactly 100
                                    const finalTotalSize = rowLayout.areas.reduce((sum, a) => sum + (a?.size || 0), 0);
                                    if (finalTotalSize > 0 && Math.abs(finalTotalSize - 100) > 0.01) {
                                        const finalScale = 100 / finalTotalSize;
                                        rowLayout.areas.forEach(a => { if (a) a.size = (a.size || 0) * finalScale; });
                                    }
                                }
                                // rootId remains the same row
                            }
                        }
                        state.errors = [];
                    });
                },

                removeArea: (idToRemove: string) => {
                    set(state => {
                        // Simple removal from areas
                        if (state.areas[idToRemove]) {
                            delete state.areas[idToRemove];
                        } else {
                            console.warn(`Attempted to remove non-existent area with id: ${idToRemove}`);
                            // Optionally add error to state.errors or just return
                        }

                        // More complex: Remove from layout and handle potential rootId change
                        // Helper function defined inside the mutation logic
                        function removeNodeFromLayout(currentId: string | null): string | null {
                            if (!currentId || !state.layout[currentId]) return currentId;

                            const currentLayout = state.layout[currentId];

                            if (currentLayout.id === idToRemove) {
                                delete state.layout[idToRemove];
                                return null;
                            }

                            if (currentLayout.type === 'area_row') {
                                const rowLayout = currentLayout as AreaRowLayout;
                                const originalLength = rowLayout.areas?.length || 0;
                                rowLayout.areas = rowLayout.areas?.filter(a => a.id !== idToRemove);
                                const newLength = rowLayout.areas?.length || 0;

                                if (newLength < originalLength) {
                                    if (newLength === 0) {
                                        delete state.layout[currentId];
                                        return null;
                                    } else if (newLength === 1) {
                                        const remainingAreaId = rowLayout.areas[0].id;
                                        delete state.layout[currentId];
                                        return remainingAreaId;
                                    } else {
                                        const totalSize = rowLayout.areas.reduce((sum, a) => sum + (a?.size || 0), 0);
                                        if (totalSize > 0) {
                                            const scaleFactor = 100 / totalSize;
                                            rowLayout.areas.forEach(a => { if (a) a.size = (a.size || 0) * scaleFactor; });
                                        }
                                    }
                                }

                                // Recursively process children
                                let needsRecheck = false;
                                const updatedAreas = rowLayout.areas?.map(areaInfo => {
                                    if (!areaInfo) return null;
                                    const resultId = removeNodeFromLayout(areaInfo.id);
                                    if (resultId !== areaInfo.id) needsRecheck = true; // Mark if a child structure changed
                                    return resultId ? { ...areaInfo, id: resultId } : null;
                                }).filter(a => a !== null);

                                state.layout[currentId] = { ...rowLayout, areas: updatedAreas as typeof rowLayout.areas }; // Update layout with filtered/processed children

                                // Re-check if the row became empty/single after child processing
                                // This check needs to happen after the map/filter potentially modifies the array
                                const finalChildren = (state.layout[currentId] as AreaRowLayout).areas;
                                if (finalChildren?.length === 0) {
                                    delete state.layout[currentId];
                                    return null;
                                } else if (finalChildren?.length === 1) {
                                    const promotedId = finalChildren[0].id;
                                    delete state.layout[currentId];
                                    return promotedId;
                                }
                            }
                            return currentId;
                        }

                        // Start removal from the root
                        const newRootId = removeNodeFromLayout(state.rootId);
                        state.rootId = newRootId;

                        // Cleanup dangling elements - Commented out for now as findConnectedIds was removed
                        /*
                        const connectedIds = findConnectedIds(state.layout, state.rootId);
                        Object.keys(state.areas).forEach(areaId => {
                            if (!connectedIds.has(areaId)) {
                                delete state.areas[areaId];
                            }
                        });
                        Object.keys(state.layout).forEach(layoutId => {
                            if (!connectedIds.has(layoutId)) {
                                delete state.layout[layoutId];
                            }
                        });
                        */

                        // Reset active area if it was the one removed
                        if (state.activeAreaId === idToRemove) {
                            state.activeAreaId = null;
                        }
                        state.errors = [];
                    }); // End of the main set call for removeArea
                },

                setActiveArea: (id: string | null) => {
                    set(state => {
                        state.activeAreaId = id;
                    });
                },

                updateArea: (areaData: Partial<Area<AreaTypeValue>> & { id: string }) => {
                    set(state => {
                        if (state.areas[areaData.id]) {
                            state.areas[areaData.id] = {
                                ...state.areas[areaData.id],
                                ...areaData,
                            };
                        }
                    });
                },

                setAreaToOpen: (payload) => {
                    set(state => {
                        state.areaToOpen = payload;
                    });
                },

                updateAreaToOpenPosition: (position) => {
                    set(state => {
                        if (!state.areaToOpen) {
                            // Initialiser si null (comportement de l'ancien slice)
                            state.areaToOpen = {
                                position: position,
                                area: { type: 'unknown', state: {} } // Type par défaut?
                            };
                        } else {
                            state.areaToOpen.position = position;
                        }
                    });
                },

                finalizeAreaPlacement: () => {
                    // TODO: Implémenter la logique complexe de placement/modification du layout
                    console.warn("Action finalizeAreaPlacement non implémentée dans Zustand");
                    // Simplement nettoyer areaToOpen pour l'instant
                    set(state => {
                        state.areaToOpen = null;
                    });
                },

                cleanupTemporaryStates: () => {
                    set(state => {
                        state.joinPreview = null;
                        state.areaToOpen = null;
                        state.errors = [];
                    });
                },

                setViewports: (viewports) => {
                    // Note: Le viewport est géré localement dans AreaRoot actuellement.
                    // Cette action pourrait être utilisée si on change d'approche.
                    console.warn("Action setViewports appelée mais non implémentée pour affecter l'état Zustand");
                    // set(state => { state.viewports = viewports; }); // Si on ajoute viewports à l'état
                },

                setRowSizes: (payload) => {
                    // TODO: Implémenter la logique de mise à jour des tailles dans le layout
                    console.warn("Action setRowSizes non implémentée dans Zustand");
                    set(state => {
                        const row = state.layout[payload.rowId] as AreaRowLayout;
                        if (row && row.areas.length === payload.sizes.length) {
                            row.areas = row.areas.map((area, i) => ({ ...area, size: payload.sizes[i] }));
                        } else {
                            console.error("setRowSizes: Ligne non trouvée ou tailles incohérentes");
                        }
                    });
                },

                // NEW ACTIONS IMPLEMENTATION

                splitArea: (payload) => {
                    const { areaIdToSplit, parentRowId, horizontal } = payload;
                    let splitResult: SplitResult | null = null;

                    set(state => {
                        const areaToSplit = state.areas[areaIdToSplit];
                        if (!areaToSplit) {
                            console.error(`splitArea: Area to split (${areaIdToSplit}) not found.`);
                            state.lastSplitResultData = null;
                            return; // Exit mutation
                        }

                        // 1. Create the new area (copying type/state from original)
                        const newAreaId = `area-${++state._id}`;
                        state.areas[newAreaId] = {
                            ...areaToSplit, // Copy properties
                            id: newAreaId,
                            // state: {} // Or maybe deep clone state? For now, fresh state
                            state: JSON.parse(JSON.stringify(areaToSplit.state || {})),
                        };
                        state.layout[newAreaId] = { type: 'area', id: newAreaId };

                        const desiredOrientation = horizontal ? 'horizontal' : 'vertical';
                        let targetRowId: string | null = null;
                        let newSeparatorIndex: number | undefined = undefined;

                        // 2. Determine where to insert the new area in the layout
                        const parentLayout = parentRowId ? state.layout[parentRowId] : null;

                        if (parentLayout && parentLayout.type === 'area_row' && parentLayout.orientation === desiredOrientation) {
                            // Case A: Add to existing parent row with matching orientation
                            targetRowId = parentRowId!;
                            const parentRow = parentLayout as AreaRowLayout;
                            const originalIndex = parentRow.areas.findIndex(a => a.id === areaIdToSplit);

                            if (originalIndex === -1) {
                                console.error(`splitArea: Area ${areaIdToSplit} not found in parent row ${targetRowId}.`);
                                // Cleanup the newly created area? Or handle error differently?
                                delete state.areas[newAreaId];
                                delete state.layout[newAreaId];
                                state.lastSplitResultData = null;
                                return;
                            }

                            const originalSize = parentRow.areas[originalIndex].size;
                            const newSize = originalSize / 2;

                            // Insert new area layout entry after the original
                            parentRow.areas.splice(originalIndex + 1, 0, { id: newAreaId, size: newSize });

                            // Update original area size
                            parentRow.areas[originalIndex].size = newSize;

                            // Normalize sizes for the row
                            const totalSize = parentRow.areas.reduce((sum, a) => sum + a.size, 0);
                            if (totalSize > 0) {
                                const scale = 1.0 / totalSize;
                                parentRow.areas.forEach(a => a.size *= scale);
                            }
                            newSeparatorIndex = originalIndex + 1; // Separator is AFTER the original area

                        } else {
                            // Case B: Convert the area itself into a new row
                            const newRowId = `row-${++state._id}`;
                            targetRowId = newRowId;
                            const currentLayoutEntry = state.layout[areaIdToSplit]; // Should be {type: 'area', id: areaIdToSplit}

                            // Decide insertion order based on corner? (Simplified: original first)
                            const newRowAreas = [
                                { id: areaIdToSplit, size: 0.5 },
                                { id: newAreaId, size: 0.5 }
                            ];

                            const newRowLayout: AreaRowLayout = {
                                type: 'area_row',
                                id: newRowId,
                                orientation: desiredOrientation,
                                areas: newRowAreas,
                            };

                            // Replace the original area's layout entry with the new row layout
                            state.layout[newRowId] = newRowLayout;

                            // Update parent layout if exists
                            if (parentLayout && parentLayout.type === 'area_row') {
                                const parentRow = parentLayout as AreaRowLayout;
                                const areaIndexInParent = parentRow.areas.findIndex(a => a.id === areaIdToSplit);
                                if (areaIndexInParent !== -1) {
                                    // Replace the area reference with the new row reference
                                    parentRow.areas[areaIndexInParent].id = newRowId;
                                    // Size remains the same initially
                                } else {
                                    console.warn(`splitArea: Couldn't find ${areaIdToSplit} in parent ${parentRowId} to replace with new row ${newRowId}.`);
                                }
                            } else if (state.rootId === areaIdToSplit) {
                                // If the split area was the root, the new row becomes the root
                                state.rootId = newRowId;
                            } else {
                                console.warn(`splitArea: Area ${areaIdToSplit} has no parent row and wasn't root? Layout might be inconsistent.`);
                                // Attempt to remove the now-dangling original layout entry if it wasn't the one replaced by the row
                                if (state.layout[areaIdToSplit] === currentLayoutEntry) {
                                    delete state.layout[areaIdToSplit];
                                }
                            }
                            // Ensure the individual areas still have their simple layout entries
                            state.layout[areaIdToSplit] = { type: 'area', id: areaIdToSplit };
                            state.layout[newAreaId] = { type: 'area', id: newAreaId };

                            newSeparatorIndex = 1; // Separator is between the first and second element
                        }

                        // Store result for retrieval by getLastSplitResult
                        if (targetRowId && newSeparatorIndex !== undefined) {
                            splitResult = { newRowId: targetRowId, separatorIndex: newSeparatorIndex };
                            state.lastSplitResultData = splitResult;
                            console.log("splitArea successful:", splitResult);
                        } else {
                            console.error("splitArea: Failed to determine targetRowId or separatorIndex.");
                            state.lastSplitResultData = null;
                        }
                    }); // End set(produce(...))

                    // Return the result directly (or null if failed)
                    // This relies on the set state completing before return, which should be the case
                    return get().lastSplitResultData; // Return the stored result
                },

                getLastSplitResult: () => {
                    // Simple getter for the transient result
                    return get().lastSplitResultData;
                },

                setJoinPreview: (payload: JoinPreviewState | null) => {
                    set(state => {
                        state.joinPreview = payload;
                    });
                },

                joinOrMoveArea: (payload) => {
                    console.warn("joinOrMoveArea action not implemented yet.", payload);
                    // TODO: Implement the complex logic for merging areas and updating layout
                    set(state => {
                        // Example: Find source/target, modify layout, cleanup joinPreview
                        state.joinPreview = null; // Clean up preview after attempt
                    });
                },

                // Sélecteurs
                getActiveArea: () => {
                    const state = get();
                    return state.activeAreaId ? state.areas[state.activeAreaId] : null;
                },

                getAreaById: (id: string) => {
                    return get().areas[id];
                },

                getAllAreas: () => {
                    return get().areas;
                },

                getAreaErrors: () => {
                    return get().errors;
                }
            })),
            {
                name: 'areaState',
                // Exclude transient state from persistence
                partialize: (state) => {
                    const { lastSplitResultData, joinPreview, errors, areaToOpen, viewports, ...rest } = state;
                    return rest;
                },
            }
        )
    )
); 
