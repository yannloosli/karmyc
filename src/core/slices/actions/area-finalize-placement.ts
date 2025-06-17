import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { PlaceArea } from "../../types/areas-type";
import { v4 as uuidv4 } from 'uuid';
import { Vec2 } from "../../../utils/vec2";
import { getHoveredAreaId } from "../../utils/areaUtils";
import { getAreaRootViewport } from "../../../utils/getAreaViewport";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { computeAreaToParentRow } from "../../utils/areaToParentRow";
import { AreaRowLayout } from "../../../types/areaTypes";
import { simplifyLayoutNodeIfNeeded } from "../../utils/areas";
import { findFirstAreaId } from "../../utils/areas";
import { getAreaToOpenPlacementInViewport } from "../../utils/areaUtils";
import { areaRegistry } from "../../registries/areaRegistry";
import { AREA_ROLE } from "../../types/actions";


export const finalizeAreaPlacement = (set: any, get: any) => (payload?: { targetId?: string; placement?: PlaceArea }) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;

        const areaToOpen = activeScreenAreas.areaToOpen;
        if (!areaToOpen) {
            activeScreenAreas.errors = ["No area to open"];
            return;
        }

        try {
            const { position, area } = areaToOpen;
            const sourceAreaId = area.state?.sourceId; // ID of the area being moved (if any)
            const newAreaId = sourceAreaId || uuidv4(); // Use screen's counter for new areas

            const adjustedPosition = new Vec2(position.x, position.y);

            // 1. Add new area data if it's not a move
            if (!sourceAreaId) {
                // Ensure ID is unique before adding
                if (activeScreenAreas.areas[newAreaId]) {
                    console.error(`finalizeAreaPlacement: ID conflict for new area ${newAreaId}`);
                    activeScreenAreas.areaToOpen = null; // Clear temp state on error
                    return;
                }
                activeScreenAreas.areas[newAreaId] = { id: newAreaId, type: area.type, state: area.state };
                // Layout entry added later based on placement
                activeScreenAreas._id += 1; // Increment counter *only* for new area data creation
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

            if (!determinedTargetAreaId) {
                const detectionDimensions = new Vec2(300, 200);
                determinedTargetAreaId = getHoveredAreaId(
                    adjustedPosition,
                    activeScreenAreas, // Pass the area state part
                    areaToViewport,
                    detectionDimensions
                );
            }

            // 3. Handle no target / invalid drop
            if (!determinedTargetAreaId) {
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
                determinedPlacement = getAreaToOpenPlacementInViewport(viewport, adjustedPosition);
            }
            activeScreenAreas.areaToOpen = null; // Clear state *before* complex logic

            // 5. Handle source area removal (if it was a move)
            let sourceParentRowIdForCleanup: string | null = null;
            let survivingChildIdFromSourceSimplification: string | null = null;

            if (sourceAreaId) {
                const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout);
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
                            if (sourceParentRow.areas.length === 1) {
                                survivingChildIdFromSourceSimplification = sourceParentRow.areas[0].id;
                            }
                            simplifyLayoutNodeIfNeeded(activeScreenAreas, sourceParentRowId);
                        }
                    }
                }
                // If source area wasn't in a row (e.g., it was root or orphan), remove its direct layout entry if exists
                else if (activeScreenAreas.layout[sourceAreaId]) {
                    delete activeScreenAreas.layout[sourceAreaId];
                }
                // Delete source area *data* only if it's truly a move (source != new ID potentially created)
                if (sourceAreaId !== newAreaId) { // Should always be true if sourceAreaId exists
                    delete activeScreenAreas.areas[sourceAreaId];
                }
                // Check if root needs update
                if (activeScreenAreas.rootId === sourceAreaId) {
                    activeScreenAreas.rootId = null; // Layout is likely broken, needs rebuild or clear
                }
            }

            // Update determinedTargetAreaId if it was the source parent and got simplified away
            if (determinedTargetAreaId &&
                determinedTargetAreaId === sourceParentRowIdForCleanup &&
                survivingChildIdFromSourceSimplification &&
                !activeScreenAreas.layout[determinedTargetAreaId] // Check if it was indeed removed by simplify
            ) {
                determinedTargetAreaId = survivingChildIdFromSourceSimplification;
            }

            // 6. Handle placement logic
            let orientation: "horizontal" | "vertical" = determinedPlacement === "stack" ? "horizontal" : (determinedPlacement === "top" || determinedPlacement === "bottom" ? "vertical" : "horizontal");

            if (determinedPlacement === "stack") {
                // On veut stacker deux areas, pas des rows
                // Si la cible est un row, on descend jusqu'à la première area enfant
                let targetAreaId = determinedTargetAreaId;
                let targetArea = activeScreenAreas.areas[targetAreaId];

                // Si la cible est un area_row avec orientation stack, on le traite comme un area simple
                if (activeScreenAreas.layout[targetAreaId]?.type === 'area_row' &&
                    (activeScreenAreas.layout[targetAreaId] as AreaRowLayout).orientation === 'stack') {
                    targetArea = activeScreenAreas.areas[targetAreaId];
                } else if (!targetArea && activeScreenAreas.layout[targetAreaId]?.type === 'area_row') {
                    const found = findFirstAreaId(activeScreenAreas.layout, targetAreaId);
                    if (found) {
                        targetAreaId = found;
                        targetArea = activeScreenAreas.areas[targetAreaId];
                    }
                }

                const sourceData = activeScreenAreas.areas[newAreaId];
                if (!sourceData || !targetArea) {
                    console.error(`[finalizeAreaPlacement] Stack creation failed: Source or target area not found.`);
                    return;
                }

                // --- CONTRÔLE DES RÔLES ---
                const allowMixed = get().options?.allowStackMixedRoles !== false;
                if (!allowMixed) {
                    const sourceRole = sourceData.role || (sourceData.type && (areaRegistry as any)._roleMap?.[sourceData.type]);
                    const targetRole = targetArea.role || (targetArea.type && (areaRegistry as any)._roleMap?.[targetArea.type]);
                    if (sourceRole && targetRole && sourceRole !== targetRole) {
                        activeScreenAreas.errors = ["Impossible de stacker des areas de rôles différents (option de configuration)"];
                        return;
                    }
                }
                // --- FIN CONTRÔLE DES RÔLES ---

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
                const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout);
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
                const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout);
                const parentRowId = areaToParentRow[determinedTargetAreaId];
                const parentRow = parentRowId ? activeScreenAreas.layout[parentRowId] as AreaRowLayout : null;

                const newRowId = uuidv4(); // ID for a potential new row

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

                        // Déterminer les éléments concernés par l'insertion
                        let affectedAreas = [];
                        if (insertIndex === 0) {
                            // Insertion au début : affecte le premier élément
                            affectedAreas = [parentRow.areas[0]];
                        } else if (insertIndex === parentRow.areas.length) {
                            // Insertion à la fin : affecte le dernier élément
                            affectedAreas = [parentRow.areas[parentRow.areas.length - 1]];
                        } else {
                            // Insertion entre deux éléments : affecte les deux éléments adjacents
                            affectedAreas = [parentRow.areas[insertIndex - 1], parentRow.areas[insertIndex]];
                        }

                        // Calculer la taille totale des éléments affectés
                        const totalAffectedSize = affectedAreas.reduce((sum, area) => sum + (area.size || 0), 0);

                        // Répartir l'espace entre les éléments affectés et la nouvelle area
                        const newSize = totalAffectedSize / (affectedAreas.length + 1);
                        affectedAreas.forEach(area => area.size = newSize);

                        // Insérer la nouvelle area avec la taille calculée
                        parentRow.areas.splice(insertIndex, 0, { id: newAreaId, size: newSize });
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

            // RECALCULATE VIEWPORTS HERE, USING THE EXISTING rootViewport from earlier in the function
            // This 'rootViewport' const is typically defined around line 575 of the original file.
            if (activeScreenAreas.rootId && rootViewport && rootViewport.width > 0 && rootViewport.height > 0) {
                const recalculatedViewports = computeAreaToViewport(
                    activeScreenAreas.layout,
                    activeScreenAreas.rootId,
                    rootViewport // Use the existing rootViewport
                );
                activeScreenAreas.viewports = recalculatedViewports;
            } else {
                activeScreenAreas.viewports = {}; // Clear to avoid stale data
            }

            // À la toute fin du try (si pas d'erreur et mutation réelle)
            state.lastUpdated = Date.now();
        } catch (error) {
            // Attempt to clean up temporary state on error
            if (activeScreenAreas) {
                activeScreenAreas.areaToOpen = null;
            }
            activeScreenAreas.errors = [`Error finalizing area placement: ${error}`];
        }
    })
}
