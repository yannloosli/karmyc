import { Vec2 } from '@gamesberry/karmyc-shared';
import type { WritableDraft } from 'immer';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { AreaTypeValue, TOOLBAR_HEIGHT } from '../constants';
import { Area, AreaLayout, AreaRowLayout } from '../types/areaTypes';
import { CardinalDirection, IntercardinalDirection } from '../types/directions';
import { Point, Rect } from '../types/geometry';
import { computeAreaToParentRow } from '../utils/areaToParentRow';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';
import { joinAreas as joinAreasUtil } from '../utils/joinArea';
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
            state: any & { sourceId?: string };
        };
    };
    lastSplitResultData: SplitResult | null;

    // Actions
    addArea: (area: Area<AreaTypeValue>) => string;
    removeArea: (id: string) => void;
    setActiveArea: (id: string | null) => void;
    updateArea: (areaData: Partial<Area<AreaTypeValue>> & { id: string }) => void;
    setAreaToOpen: (payload: AreaState['areaToOpen']) => void;
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

// Helper function to find all disconnected areas that are not accessible from the root
function findAllDisconnectedAreas(layout: { [key: string]: AreaRowLayout | AreaLayout }, rootId: string | null): Set<string> {
    const allAreaIds = new Set<string>();
    const connectedAreaIds = new Set<string>();

    // Collect all area IDs from the layout
    Object.keys(layout).forEach(id => {
        allAreaIds.add(id);
    });

    // If we have a root, find all areas connected to it
    if (rootId && layout[rootId]) {
        const descendantIds = findAllDescendantAreaIds(layout, rootId);
        descendantIds.forEach(id => {
            connectedAreaIds.add(id);
        });
        connectedAreaIds.add(rootId); // Add the root itself
    }

    // The difference between all areas and connected areas are the disconnected ones
    const disconnectedAreas = new Set<string>();
    allAreaIds.forEach(id => {
        if (!connectedAreaIds.has(id)) {
            disconnectedAreas.add(id);
        }
    });

    return disconnectedAreas;
}

// Define the core state logic with immer first
const immerConfig = immer<AreaState>((set, get) => {
    // --- HELPER for Layout Simplification (Re-introduced) ---
    function simplifyLayoutNodeIfNeeded(state: WritableDraft<AreaState>, rowId: string | null | undefined) {
        // Added null/undefined check for safety
        if (!rowId) return;

        const layoutNode = state.layout[rowId];

        // Only proceed if it's a row and exists
        if (!layoutNode || layoutNode.type !== 'area_row') {
            return; // Not a row or doesn't exist
        }

        const rowLayout = layoutNode as AreaRowLayout;

        // Check if the row now contains exactly one item
        if (rowLayout.areas.length !== 1) {
            return; // Not a single child, no simplification needed
        }

        const survivingChildRef = rowLayout.areas[0];
        const survivingChildId = survivingChildRef.id;
        const sizeOfSimplifiedRow = survivingChildRef.size;

        // Find the parent of the row we are simplifying (the grandparent of the surviving child)
        const areaToParentRowMap = computeAreaToParentRow(state.layout, state.rootId);
        const grandParentRowId = areaToParentRowMap[rowId]; // Get parent of the row itself

        if (grandParentRowId && state.layout[grandParentRowId]?.type === 'area_row') {
            // Case 1: The row to simplify has a grandparent row
            const grandParentRow = state.layout[grandParentRowId] as AreaRowLayout;
            const rowIndexInGrandparent = grandParentRow.areas.findIndex(a => a.id === rowId);

            if (rowIndexInGrandparent !== -1) {
                // Preserve the size the simplified row had in its parent
                const sizeToPreserve = grandParentRow.areas[rowIndexInGrandparent].size ?? sizeOfSimplifiedRow; // Fallback just in case
                // Replace the reference to the simplified row with the reference to the surviving child
                grandParentRow.areas[rowIndexInGrandparent] = { id: survivingChildId, size: sizeToPreserve };
                console.log(`[simplifyLayoutNodeIfNeeded] Replaced ${rowId} with ${survivingChildId} in grandparent ${grandParentRowId}`);
            } else {
                console.error(`[simplifyLayoutNodeIfNeeded] Cleanup Error: Could not find row ${rowId} in its supposed parent ${grandParentRowId}. Layout might be inconsistent.`);
                return;
            }
        } else if (state.rootId === rowId) {
            // Case 2: The row to simplify was the root
            state.rootId = survivingChildId;
            console.log(`[simplifyLayoutNodeIfNeeded] Promoted ${survivingChildId} to be the new root.`);
        } else {
            // Case 3: No grandparent and not root (shouldn't happen in valid layout)
            console.warn(`[simplifyLayoutNodeIfNeeded] Cleanup Warning: Row ${rowId} had no grandparent and was not root. Cannot promote ${survivingChildId}.`);
            return;
        }

        // Delete the layout entry for the now-simplified (empty) row
        delete state.layout[rowId];
        console.log(`[simplifyLayoutNodeIfNeeded] Deleted simplified row ${rowId} from layout.`);
    }
    // --- END HELPER ---

    return {
        ...initialStateData,

        // Actions with logs
        addArea: (area) => {
            // 1. Generate ID first if missing
            const areaId = area.id || `area-${get()._id + 1}`; // Use current _id + 1 for generation
            const areaWithId = { ...area, id: areaId };

            // 2. Validate the object that now guaranteed has an ID
            const validation = validateArea(areaWithId);

            if (!validation.isValid) {
                set(state => {
                    state.errors = validation.errors;
                });
                console.error("Validation failed for area:", validation.errors);
                return ''; // Return empty string on failure
            }
            // ID generation logic was here, now removed as it's done above

            set(state => {
                // Use areaWithId here which has the generated ID
                state.areas[areaWithId.id] = areaWithId;
                // Layout addition is now handled separately by initializer or other actions
                // state.layout[areaId] = { type: 'area', id: areaId }; 
                // if (!state.rootId) state.rootId = areaId; 
                state._id += 1; // Increment counter AFTER using it
                state.errors = [];
            });
            return areaWithId.id; // Return the generated/validated ID
        },

        removeArea: (id) => {
            // TODO: Implement robust removal logic (updating layout, handling root, etc.)
            set(state => {
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
            set(state => {
                if (id === null || state.areas[id]) {
                    state.activeAreaId = id;
                } else {
                    console.warn(`Attempted to set active area to non-existent ID: ${id}`);
                }
                state.errors = [];
            });
        },

        updateArea: (areaData) => {
            set(state => {
                const area = state.areas[areaData.id];
                if (area) {
                    const { id, ...changes } = areaData;
                    // Add validation if needed before update
                    state.areas[id] = { ...area, ...changes };
                    state.errors = [];
                } else {
                    state.errors = [`Area with ID ${areaData.id} not found for update.`];
                    console.error("Update failed:", state.errors);
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
                if (state.areaToOpen) {
                    state.areaToOpen.position = position;
                }
            });
        },

        finalizeAreaPlacement: () => {
            set(state => {
                if (!state.areaToOpen) {
                    console.warn('[areaStore] finalizeAreaPlacement - No areaToOpen data available');
                    return;
                }

                try {
                    console.log('[areaStore] finalizeAreaPlacement - Processing drop operation');
                    const { position, area } = state.areaToOpen;
                    const sourceAreaId = area.state?.sourceId;
                    const newAreaId = sourceAreaId || `area-${Date.now()}`;

                    // Adjust position to account for menu bar height
                    const adjustedPosition = Vec2.new(position.x, position.y - TOOLBAR_HEIGHT);
                    console.log(`[finalizeAreaPlacement] Original Pos: ${position.x},${position.y}. Adjusted Pos: ${adjustedPosition.x},${adjustedPosition.y}`);

                    // Create new area entry if needed (before computing viewports)
                    if (!sourceAreaId || sourceAreaId !== newAreaId) {
                        state.areas[newAreaId] = {
                            id: newAreaId,
                            type: area.type,
                            state: area.state
                        };
                        // Also add basic layout entry if it's a new area
                        if (!state.layout[newAreaId]) {
                            state.layout[newAreaId] = { type: 'area', id: newAreaId };
                        }
                    }

                    const rootViewport = getAreaRootViewport();
                    const areaToViewport = computeAreaToViewport(
                        state.layout,
                        state.rootId || '',
                        rootViewport,
                    );

                    const detectionDimensions = Vec2.new(300, 200);

                    // Use adjustedPosition for hover detection
                    const targetAreaId = getHoveredAreaId(
                        adjustedPosition, // <-- Use adjusted position
                        { layout: state.layout, rootId: state.rootId, areas: state.areas, areaToOpen: state.areaToOpen },
                        areaToViewport,
                        detectionDimensions
                    );

                    if (!targetAreaId) {
                        // Handle no target: clean up area if it was newly created
                        if (!sourceAreaId) {
                            delete state.areas[newAreaId];
                            delete state.layout[newAreaId];
                        }
                        state.areaToOpen = null;
                        return;
                    }

                    const viewport = areaToViewport[targetAreaId];
                    // Use adjustedPosition for placement calculation
                    const placement = getAreaToOpenPlacementInViewport(viewport, adjustedPosition); // <-- Use adjusted position

                    console.log(`[finalizeAreaPlacement] Target: ${targetAreaId}, Placement: ${placement}`);
                    state.areaToOpen = null;

                    let sourceParentRowIdForCleanup: string | null = null; // Variable to store the source parent ID

                    // --- Remove source from original position (if it was a move) ---
                    if (sourceAreaId) {
                        const areaToParentRow = computeAreaToParentRow(state.layout, state.rootId);
                        const sourceParentRowId = areaToParentRow[sourceAreaId];
                        sourceParentRowIdForCleanup = sourceParentRowId; // Store for potential simplification later

                        if (sourceParentRowId) {
                            const sourceParentRow = state.layout[sourceParentRowId] as AreaRowLayout;
                            if (sourceParentRow) {
                                // Remove the source area ref
                                sourceParentRow.areas = sourceParentRow.areas.filter(a => a.id !== sourceAreaId);
                                // console.log(`[finalizeAreaPlacement] Removed ${sourceAreaId} from source parent ${sourceParentRowId}`);

                                // NOTE: We don't simplify here immediately. We simplify *after* potential empty row deletion.

                                // --- Original logic to delete empty rows (KEEP THIS) ---
                                if (sourceParentRow.areas.length === 0) {
                                    // Avant de supprimer la rangée vide, on doit supprimer toutes les références à cette rangée
                                    // dans les autres rangées du layout
                                    Object.entries(state.layout).forEach(([id, layoutItem]) => {
                                        if (layoutItem.type === 'area_row' && id !== sourceParentRowId) {
                                            const rowLayout = layoutItem as AreaRowLayout;
                                            const hadReference = rowLayout.areas.some(a => a.id === sourceParentRowId);

                                            // Filtrer les références à la rangée vide
                                            rowLayout.areas = rowLayout.areas.filter(a => a.id !== sourceParentRowId);

                                            // Si des références ont été supprimées, normaliser les tailles
                                            if (hadReference && rowLayout.areas.length > 0) {
                                                const totalSize = rowLayout.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                                                if (totalSize > 0) {
                                                    const factor = 1.0 / totalSize;
                                                    rowLayout.areas.forEach(area => {
                                                        area.size = (area.size || 0) * factor;
                                                    });
                                                }
                                            }
                                        }
                                    });

                                    // Maintenant on peut supprimer la rangée vide
                                    delete state.layout[sourceParentRowId];
                                    console.log(`[finalizeAreaPlacement] Deleted empty source parent row ${sourceParentRowId}`);
                                    // Since the row is deleted, we don't need to simplify it.
                                    // But its parent might need simplification if deleting this row left IT with one child.
                                    const grandParentId = areaToParentRow[sourceParentRowId]; // Find parent of the row we just deleted
                                    simplifyLayoutNodeIfNeeded(state, grandParentId);
                                } else {
                                    // Row is not empty, normalize sizes
                                    const totalSize = sourceParentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                                    if (totalSize > 0) {
                                        const factor = 1.0 / totalSize;
                                        sourceParentRow.areas.forEach(area => {
                                            area.size = (area.size || 0) * factor;
                                        });
                                    }
                                    // NOW, simplify the source row itself if needed (e.g., went from 2 children to 1)
                                    simplifyLayoutNodeIfNeeded(state, sourceParentRowId);
                                }
                            }
                        }
                        // Suppression de l'area source si elle est différente de l'area cible
                        if (sourceAreaId !== newAreaId) {
                            delete state.areas[sourceAreaId];
                            if (state.layout[sourceAreaId]) {
                                delete state.layout[sourceAreaId];
                            }
                        }
                    }

                    // Déterminer l'orientation basée sur le placement
                    let orientation: "horizontal" | "vertical" = "horizontal";
                    switch (placement) {
                    case "top":
                    case "bottom":
                        orientation = "vertical";
                        break;
                    case "left":
                    case "right":
                        orientation = "horizontal";
                        break;
                    case "replace":
                        // VÉRIFICATION
                        if (!state.areas[newAreaId]) {
                            console.error('[areaStore] finalizeAreaPlacement - ERREUR: Area source introuvable:', newAreaId);
                            return;
                        }

                        // Si la zone source est la même que la zone cible, ne rien faire pour éviter la disparition
                        if (sourceAreaId === targetAreaId) {
                            return;
                        }

                        // Conserver l'état et le type de la zone source
                        const sourceAreaState = { ...state.areas[newAreaId].state };
                        const sourceAreaType = state.areas[newAreaId].type;

                        // Mettre à jour la zone cible plutôt que de la remplacer complètement
                        state.areas[targetAreaId] = {
                            ...state.areas[targetAreaId],
                            type: sourceAreaType,
                            state: sourceAreaState
                        };

                        // Supprimer la zone source si elle est différente
                        if (newAreaId !== targetAreaId) {
                            // Trouver la rangée parente de la zone source
                            const areaToParentRow = computeAreaToParentRow(state.layout, state.rootId);
                            const sourceParentRowId = areaToParentRow[newAreaId];

                            if (sourceParentRowId) {
                                const sourceParentRow = state.layout[sourceParentRowId] as AreaRowLayout;

                                if (sourceParentRow && sourceParentRow.areas) {
                                    // Filtrer la zone source de sa rangée parente
                                    sourceParentRow.areas = sourceParentRow.areas.filter(a => a.id !== newAreaId);

                                    // Si la rangée est maintenant vide, la marquer pour suppression
                                    if (sourceParentRow.areas.length === 0) {
                                        delete state.layout[sourceParentRowId];
                                    } else {
                                        // Normaliser les tailles des zones restantes
                                        const totalSize = sourceParentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                                        if (totalSize > 0) {
                                            const factor = 1.0 / totalSize;
                                            sourceParentRow.areas.forEach(area => {
                                                area.size = (area.size || 0) * factor;
                                            });
                                        }
                                    }
                                }
                            }

                            // Supprimer la zone source et ses entrées
                            delete state.areas[newAreaId];
                            delete state.layout[newAreaId];
                            if (state.viewports && state.viewports[newAreaId]) {
                                delete state.viewports[newAreaId];
                            }
                        }

                        // After replacing, the source parent might need simplification
                        simplifyLayoutNodeIfNeeded(state, sourceParentRowIdForCleanup);
                        return;
                    }

                    // Vérifier si la zone cible est déjà dans une rangée
                    const areaToParentRow = computeAreaToParentRow(state.layout, state.rootId);
                    const parentRowId = areaToParentRow[targetAreaId];
                    const parentRow = parentRowId ? state.layout[parentRowId] as AreaRowLayout : null;

                    if (parentRow) {
                        const targetIndex = parentRow.areas.findIndex(a => a.id === targetAreaId);
                        if (targetIndex === -1) return;

                        if (parentRow.orientation === orientation) {
                            // Même orientation : ajouter comme sibling
                            const totalSize = parentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                            const newSize = totalSize / (parentRow.areas.length + 1);

                            // Ajuster les tailles existantes
                            parentRow.areas = parentRow.areas.map(a => ({
                                ...a,
                                size: (a.size || 0) * (1 - 1 / (parentRow.areas.length + 1))
                            }));

                            // Déterminer l'index d'insertion en fonction du placement
                            let insertIndex = targetIndex;
                            if (placement === "bottom" || placement === "right") {
                                insertIndex += 1;
                            }

                            // Insérer la nouvelle area
                            parentRow.areas.splice(insertIndex, 0, {
                                id: newAreaId,
                                size: newSize
                            });

                            // Ajouter l'area au layout si ce n'est pas un déplacement
                            if (!sourceAreaId) {
                                state.layout[newAreaId] = { type: "area", id: newAreaId };
                            }
                        } else {
                            // Orientation différente : créer une nouvelle rangée
                            const newRowId = `row-${Date.now()}`;
                            const newRow: AreaRowLayout = {
                                id: newRowId,
                                type: "area_row",
                                orientation,
                                areas: placement === "top" || placement === "left"
                                    ? [
                                        { id: newAreaId, size: 0.5 },
                                        { id: targetAreaId, size: 0.5 }
                                    ]
                                    : [
                                        { id: targetAreaId, size: 0.5 },
                                        { id: newAreaId, size: 0.5 }
                                    ]
                            };

                            // Ajouter les nouvelles entrées dans le layout
                            state.layout[newRowId] = newRow;
                            if (!sourceAreaId) {
                                state.layout[newAreaId] = { type: "area", id: newAreaId };
                            }

                            // Remplacer la référence dans le parent
                            parentRow.areas[targetIndex] = {
                                id: newRowId,
                                size: parentRow.areas[targetIndex].size
                            };
                        }
                    } else {
                        // La zone cible n'a pas de parent (c'est la racine)
                        const newRowId = `row-${Date.now()}`;
                        const newRow: AreaRowLayout = {
                            id: newRowId,
                            type: "area_row",
                            orientation,
                            areas: placement === "top" || placement === "left"
                                ? [
                                    { id: newAreaId, size: 0.5 },
                                    { id: targetAreaId, size: 0.5 }
                                ]
                                : [
                                    { id: targetAreaId, size: 0.5 },
                                    { id: newAreaId, size: 0.5 }
                                ]
                        };

                        // Ajouter les nouvelles entrées dans le layout
                        state.layout[newRowId] = newRow;
                        if (!sourceAreaId) {
                            state.layout[newAreaId] = { type: "area", id: newAreaId };
                        }

                        // Mettre à jour le root
                        state.rootId = newRowId;
                    }

                    // Nettoyer les zones déconnectées à la fin
                    const disconnectedAreas = findAllDisconnectedAreas(state.layout, state.rootId);

                    disconnectedAreas.forEach(id => {
                        delete state.layout[id];
                        delete state.areas[id];
                        if (state.viewports && state.viewports[id]) {
                            delete state.viewports[id];
                        }
                    });
                    if (state.activeAreaId && disconnectedAreas.has(state.activeAreaId)) {
                        state.activeAreaId = null;
                    }
                } catch (error) {
                    console.error('[areaStore] finalizeAreaPlacement - Error:', error);
                    // Ensure cleanup even on error
                    if (state.areaToOpen) { // Check if areaToOpen still exists
                        const sourceAreaId = state.areaToOpen.area.state?.sourceId;
                        const newAreaId = sourceAreaId || `area-${Date.now()}`;
                        if (!sourceAreaId && state.areas[newAreaId]) {
                            delete state.areas[newAreaId];
                            delete state.layout[newAreaId];
                        }
                    }
                    state.areaToOpen = null;
                }
            });
        },

        cleanupTemporaryStates: () => {
            set(state => {
                state.joinPreview = null;
                state.areaToOpen = null;
                state.lastSplitResultData = null;
            });
        },

        setViewports: (viewports) => {
            set(state => {
                state.viewports = viewports;
            });
        },

        setRowSizes: (payload) => {
            set(state => {
                const rowLayout = state.layout[payload.rowId];
                if (rowLayout && rowLayout.type === 'area_row') {
                    const typedRowLayout = rowLayout as AreaRowLayout; // Cast for type safety
                    if (typedRowLayout.areas.length === payload.sizes.length) {
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
            const { areaIdToSplit, parentRowId, horizontal, corner } = payload;

            const areaToSplit = get().areas[areaIdToSplit];
            if (!areaToSplit) {
                console.error(`splitArea: Area ${areaIdToSplit} not found.`);
                return null;
            }

            let result: SplitResult | null = null;

            set(state => {
                const baseId = state._id; // Use current _id as base for new IDs
                const newAreaId = `area-${baseId + 1}`;
                const newRowId = `row-${baseId + 2}`;

                // 1. Create the new Area
                const newArea: Area<AreaTypeValue> = {
                    id: newAreaId,
                    type: areaToSplit.type, // Copy type
                    state: {}, // Reset state - TODO: Consider copying state?
                };
                state.areas[newAreaId] = newArea;
                state.layout[newAreaId] = { type: 'area', id: newAreaId };

                // 2. Create the new AreaRowLayout
                const newRow: AreaRowLayout = {
                    id: newRowId,
                    type: 'area_row',
                    orientation: horizontal ? 'horizontal' : 'vertical',
                    // Initial split is 50/50
                    // TODO: Determine order based on corner/drag direction?
                    areas: [
                        { id: areaIdToSplit, size: 0.5 },
                        { id: newAreaId, size: 0.5 },
                    ],
                };
                state.layout[newRowId] = newRow;

                // 3. Update the parent row (or rootId)
                let originalSize = 0.5; // Default size if parent update fails
                if (parentRowId) {
                    const parentRow = state.layout[parentRowId] as AreaRowLayout;
                    if (parentRow && parentRow.type === 'area_row') {
                        const index = parentRow.areas.findIndex(a => a.id === areaIdToSplit);
                        if (index !== -1) {
                            originalSize = parentRow.areas[index].size; // Store original size
                            // Replace the old area ref with the new row ref, preserving size
                            parentRow.areas[index] = { id: newRowId, size: originalSize };
                        } else {
                            console.error(`splitArea Error: Area ${areaIdToSplit} not found in parent ${parentRowId}. State might be inconsistent.`);
                            // TODO: Implement state rollback or better error handling
                        }
                    } else {
                        console.error(`splitArea Error: Parent row ${parentRowId} not found or not a row. State might be inconsistent.`);
                        // TODO: Implement state rollback
                    }
                } else if (state.rootId === areaIdToSplit) {
                    // If the split area was the root, the new row becomes the root
                    state.rootId = newRowId;
                } else {
                    console.error(`splitArea Error: Area ${areaIdToSplit} has no parent row and is not root. State might be inconsistent.`);
                    // TODO: Implement state rollback
                }

                // Update ID counter after using baseId+1 and baseId+2
                state._id = baseId + 2;

                // Set result for the caller
                // Separator index is the index *between* the two areas in the new row, which is always 1 for a 2-element row.
                result = {
                    newRowId: newRowId,
                    separatorIndex: 1,
                };
                state.lastSplitResultData = result; // Store the result

            }); // End set

            return result;
        },

        setJoinPreview: (payload) => {
            set(state => {
                state.joinPreview = payload;
            });
        },

        joinOrMoveArea: (payload) => {
            const { sourceAreaId, targetAreaId } = payload;
            set(state => {
                const { parentRow, sourceIndex, targetIndex } = findParentRowAndIndices(state.layout, sourceAreaId, targetAreaId);

                if (!parentRow) {
                    console.error(`joinOrMoveArea: Could not find adjacent areas ${sourceAreaId} and ${targetAreaId} in the same row.`);
                    state.errors = [`Could not find adjacent areas ${sourceAreaId} and ${targetAreaId} in the same row.`];
                    state.joinPreview = null;
                    return;
                }

                const mergeIntoDirection = targetIndex > sourceIndex ? 1 : -1;
                const areaIndexToRemove = sourceIndex;

                try {
                    const result = joinAreasUtil(parentRow, areaIndexToRemove, mergeIntoDirection);
                    const { area: updatedLayoutItem, removedAreaId } = result;

                    // --- Use helper function here --- 
                    if (updatedLayoutItem.type === 'area') {
                        // Row collapsed. Call simplify helper for the original parent row ID.
                        simplifyLayoutNodeIfNeeded(state, parentRow.id);
                    } else if (updatedLayoutItem.type === 'area_row') {
                        // Row still exists, update layout. No simplification needed here.
                        state.layout[parentRow.id] = updatedLayoutItem as AreaRowLayout;
                    }
                    // --- End helper usage ---

                    // --- Cleanup (remains the same) ---
                    const allRemovedDescendantAreaIds = findAllDescendantAreaIds(state.layout, removedAreaId);
                    delete state.layout[removedAreaId];

                    allRemovedDescendantAreaIds.forEach(id => {
                        delete state.areas[id];
                        delete state.layout[id];
                    });

                    if (state.areas[removedAreaId]) {
                        delete state.areas[removedAreaId];
                    }

                    if (state.activeAreaId === removedAreaId || allRemovedDescendantAreaIds.has(state.activeAreaId ?? '')) {
                        state.activeAreaId = null;
                    }

                    state.errors = [];
                    state.joinPreview = null;

                } catch (error) {
                    console.error('Error during joinOrMoveArea:', error);
                    state.errors = [(error instanceof Error ? error.message : String(error))];
                    state.joinPreview = null;
                }
            });
        },

        getLastSplitResult: () => {
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
const performanceConfig = performance(immerConfig);

// Wrap with persist
const persistConfig = persist(performanceConfig, {
    name: 'areaState', // Storage key
    partialize: (state: AreaState) => {
        // --- MODIFIED: Explicitly select only the state to persist --- 
        const {
            _id,
            rootId,
            layout,
            areas
            // EXPLICITLY EXCLUDE: activeAreaId, errors, joinPreview, areaToOpen, viewports, lastSplitResultData
        } = state;
        return {
            _id,
            rootId,
            layout,
            areas
        };
        // --- OLD LOGIC REMOVED --- 
        // // Use the validated data structure for persistence
        // const validatedData = validateLoadedState(state);
        // // console.log('[areaStore persist] Partialize called, persisting validated data:', validatedData);
        // return validatedData;
    },
    // storage: createJSONStorage(() => localStorage), // Default is localStorage
    onRehydrateStorage: (state) => {
        return (state, error) => {
            if (error) {
                console.error('[areaStore persist] Hydration failed:', error);
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
