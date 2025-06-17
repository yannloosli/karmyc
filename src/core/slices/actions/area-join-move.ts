import { WritableDraft } from "immer";
import { CardinalDirection } from "../../../types/directions";
import { RootStateType } from "../../store";
import { findParentRowAndIndices } from "../../utils/areas";
import { computeAreaToParentRow } from "../../utils/areaToParentRow";
import { joinAreas } from "../../utils/joinArea";
import { findAllDescendantAreaIds } from "../../utils/areas";
import { AreaRowLayout } from "../../../types/areaTypes";
import { simplifyLayoutNodeIfNeeded } from "../../utils/areas";


export const joinOrMoveArea = (set: any) => (payload: {
    sourceAreaId: string;
    targetAreaId: string;
    direction: CardinalDirection;
}) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;

        const { sourceAreaId, targetAreaId } = payload;
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
        const areaToParentMapBefore = computeAreaToParentRow(activeScreenAreas.layout);
        const grandParentId = areaToParentMapBefore[originalParentRowId];

        // Create a deep copy for the utility function
        const parentRowCopy = JSON.parse(JSON.stringify(parentRow));

        const mergeIntoDirection = targetIndex > sourceIndex ? 1 : -1;
        const areaIndexToRemove = sourceIndex;

        try {
            const joinResult = joinAreas(parentRowCopy, areaIndexToRemove, mergeIntoDirection);
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
        // À la toute fin du try (si mutation réelle)
        state.lastUpdated = Date.now();
    })
}
