import { AreaRowLayout } from "../../types/areaTypes";
import { WritableDraft } from "immer";
import { computeAreaToParentRow } from "./areaToParentRow";
import { RootStateType } from "../store";
import { AreasState } from "../slices/areas-slice";

export function findParentRowAndIndices(layout: RootStateType['layout'], sourceAreaId: string, targetAreaId: string): { parentRow: AreaRowLayout | null; sourceIndex: number; targetIndex: number } {
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

export function findAllDescendantAreaIds(layout: RootStateType['layout'], itemId: string): Set<string> {
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


export function findAllDisconnectedAreas(layout: RootStateType['layout'], rootId: string | null): Set<string> {
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

export function simplifyLayoutNodeIfNeeded(state: WritableDraft<AreasState>, rowId: string | null | undefined) {
    if (!rowId) return;
    const layoutNode = state.layout[rowId];
    if (!layoutNode || layoutNode.type !== 'area_row') return;

    const rowLayout = layoutNode as AreaRowLayout;
    if (rowLayout.areas.length !== 1) return;

    const survivingChildRef = rowLayout.areas[0];
    const survivingChildId = survivingChildRef.id;
    const areaToParentRowMap = computeAreaToParentRow(state.layout); // Compute within helper
    const grandParentRowId = areaToParentRowMap[rowId];

    // On permet la simplification même pour les stacks quand il ne reste qu'un élément
    // if (rowLayout.orientation === 'stack') {
    //     return;
    // }

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


export function findFirstAreaId(layout: any, id: string): string | null {
    const item = layout[id];
    if (!item) return null;
    if (item.type === 'area') return id;
    if (item.type === 'area_row') {
        if (item.areas.length === 0) return null;
        return findFirstAreaId(layout, item.areas[0].id);
    }
    return null;
}
