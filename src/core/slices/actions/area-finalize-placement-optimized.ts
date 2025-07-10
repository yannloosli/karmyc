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
import { withBatchUpdates } from "../../utils/batchUpdates";

/**
 * Version optimisée de finalizeAreaPlacement utilisant le système de batch updates
 * Simplifiée : exécution synchrone dans un seul batch pour éviter les problèmes de timing
 */
export const finalizeAreaPlacementOptimized = (set: any, get: any) => (payload?: { targetId?: string; placement?: PlaceArea }) => {
    withBatchUpdates(() => {
        const activeScreenAreas = get().screens[get().activeScreenId]?.areas;
        if (!activeScreenAreas) return;

        const areaToOpen = activeScreenAreas.areaToOpen;
        if (!areaToOpen) {
            set((state: WritableDraft<RootStateType>) => {
                state.screens[state.activeScreenId].areas.errors = ["No area to open"];
            });
            return;
        }

        try {
            const { position, area } = areaToOpen;
            const sourceAreaId = area.state?.sourceId;
            const newAreaId = sourceAreaId || uuidv4();
            const adjustedPosition = new Vec2(position.x, position.y);

            // Exécution synchrone de toutes les étapes dans un seul batch
            set((state: WritableDraft<RootStateType>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;

                // ÉTAPE 1: Préparation et validation
                if (!sourceAreaId) {
                    if (activeScreenAreas.areas[newAreaId]) {
                        console.error(`finalizeAreaPlacement: ID conflict for new area ${newAreaId}`);
                        activeScreenAreas.areaToOpen = null;
                        return;
                    }
                    activeScreenAreas.areas[newAreaId] = { id: newAreaId, type: area.type, state: area.state };
                    activeScreenAreas._id += 1;
                }

                // Clear temporary state early
                activeScreenAreas.areaToOpen = null;

                // ÉTAPE 2: Calcul des viewports
                const rootViewport = getAreaRootViewport();
                const areaToViewport = computeAreaToViewport(
                    activeScreenAreas.layout,
                    activeScreenAreas.rootId || '',
                    rootViewport,
                );

                let determinedTargetAreaId = payload?.targetId;
                let determinedPlacement = payload?.placement;

                if (!determinedTargetAreaId) {
                    const detectionDimensions = new Vec2(300, 200);
                    determinedTargetAreaId = getHoveredAreaId(
                        adjustedPosition,
                        activeScreenAreas,
                        areaToViewport,
                        detectionDimensions
                    );
                }

                // ÉTAPE 3: Validation du target
                if (!determinedTargetAreaId) {
                    if (!sourceAreaId) {
                        delete activeScreenAreas.areas[newAreaId];
                    }
                    return;
                }

                const viewport = areaToViewport[determinedTargetAreaId];
                if (!viewport) {
                    console.error(`[areaStore] finalizeAreaPlacement: Viewport not found for target ${determinedTargetAreaId}.`);
                    if (!sourceAreaId) delete activeScreenAreas.areas[newAreaId];
                    return;
                }

                if (!determinedPlacement) {
                    determinedPlacement = getAreaToOpenPlacementInViewport(viewport, adjustedPosition);
                }

                // ÉTAPE 4: Gestion de la source area
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
                                    // Créer de nouveaux objets pour éviter les erreurs de lecture seule
                                    sourceParentRow.areas = sourceParentRow.areas.map(area => ({
                                        ...area,
                                        size: (area.size || 0) * factor
                                    }));
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

                // ÉTAPE 5: Placement logic
                const orientation: "horizontal" | "vertical" = determinedPlacement === "stack" ? "horizontal" : (determinedPlacement === "top" || determinedPlacement === "bottom" ? "vertical" : "horizontal");

                if (determinedPlacement === "stack") {
                    executeStackPlacement(activeScreenAreas, determinedTargetAreaId, newAreaId, get);
                } else {
                    executeDirectionalPlacement(activeScreenAreas, determinedTargetAreaId, newAreaId, determinedPlacement, orientation);
                }

                // ÉTAPE 6: Update active area
                if (activeScreenAreas.areas[newAreaId]) {
                    activeScreenAreas.activeAreaId = newAreaId;
                    if (activeScreenAreas.areas[newAreaId].role === AREA_ROLE.LEAD) {
                        activeScreenAreas.lastLeadAreaId = newAreaId;
                    }
                }

                // ÉTAPE 7: Recalcul des viewports
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

                state.lastUpdated = Date.now();
            });

        } catch (error) {
            set((state: WritableDraft<RootStateType>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (activeScreenAreas) {
                    activeScreenAreas.areaToOpen = null;
                    activeScreenAreas.errors = [`Error finalizing area placement: ${error}`];
                }
            });
        }
    });
};

// Helper functions pour la logique de placement
const executeStackPlacement = (activeScreenAreas: any, targetAreaId: string, newAreaId: string, get: any) => {
    // On veut stacker deux areas, pas des rows
    // Si la cible est un row, on descend jusqu'à la première area enfant
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

    // Role validation
    const allowMixed = get().options?.allowStackMixedRoles !== false;
    if (!allowMixed) {
        const sourceRole = sourceData.role || (sourceData.type && (areaRegistry as any)._roleMap?.[sourceData.type]);
        const targetRole = targetArea.role || (targetArea.type && (areaRegistry as any)._roleMap?.[targetArea.type]);
        if (sourceRole && targetRole && sourceRole !== targetRole) {
            activeScreenAreas.errors = ["Impossible de stacker des areas de rôles différents (option de configuration)"];
            return;
        }
    }

    // Vérifier si la cible est déjà dans un stack
    const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout);
    const parentRowId = areaToParentRow[targetAreaId];
    
    if (parentRowId && activeScreenAreas.layout[parentRowId]?.type === 'area_row' &&
        (activeScreenAreas.layout[parentRowId] as AreaRowLayout).orientation === 'stack') {
        // La cible est déjà dans un stack, on ajoute la nouvelle zone à ce stack existant
        const existingStack = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
        
        // Vérifier si la nouvelle zone n'est pas déjà dans le stack
        const isAlreadyInStack = existingStack.areas.some(area => area.id === newAreaId);
        if (!isAlreadyInStack) {
            // Ajouter la nouvelle zone au stack existant
            existingStack.areas.push({ id: newAreaId, size: 1 });
            
            // Redistribuer les tailles
            const totalAreas = existingStack.areas.length;
            const equalSize = 1.0 / totalAreas;
            // Créer de nouveaux objets pour éviter les erreurs de lecture seule
            existingStack.areas = existingStack.areas.map(area => ({
                ...area,
                size: equalSize
            }));
            
            // Mettre à jour l'activeTabId du stack pour afficher la nouvelle zone
            existingStack.activeTabId = newAreaId;
        } else {
            // La zone est déjà dans le stack, on l'active simplement
            existingStack.activeTabId = newAreaId;
        }
    } else {
        // Créer un nouveau stack
        const newStackId = `row-${activeScreenAreas._id + 1}`;
        activeScreenAreas._id += 1;

        const newStack: AreaRowLayout = {
            type: 'area_row',
            id: newStackId,
            orientation: 'stack',
            areas: [
                { id: targetAreaId, size: 0.5 },
                { id: newAreaId, size: 0.5 }
            ],
            activeTabId: newAreaId // La nouvelle area est active par défaut
        };

        if (parentRowId && activeScreenAreas.layout[parentRowId]?.type === 'area_row') {
            const parentRow = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
            const targetIndex = parentRow.areas.findIndex(a => a.id === targetAreaId);
            if (targetIndex !== -1) {
                const originalSize = parentRow.areas[targetIndex].size;
                parentRow.areas[targetIndex] = { id: newStackId, size: originalSize };
            }
        } else if (activeScreenAreas.rootId === targetAreaId) {
            activeScreenAreas.rootId = newStackId;
        }

        activeScreenAreas.layout[newStackId] = newStack;
    }
};

const executeDirectionalPlacement = (activeScreenAreas: any, targetAreaId: string, newAreaId: string, placement: string, orientation: string) => {
    const areaToParentRow = computeAreaToParentRow(activeScreenAreas.layout);
    const parentRowId = areaToParentRow[targetAreaId];
    const parentRow = parentRowId ? activeScreenAreas.layout[parentRowId] as AreaRowLayout : null;

    const newRowId = uuidv4(); // ID for a potential new row

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
            
            // Créer de nouveaux objets pour éviter les erreurs de lecture seule
            const updatedAreas = parentRow.areas.map((area, index) => {
                if (affectedAreas.includes(area)) {
                    return { ...area, size: newSize };
                }
                return area;
            });
            
            // Insérer la nouvelle area avec la taille calculée
            updatedAreas.splice(insertIndex, 0, { id: newAreaId, size: newSize });
            parentRow.areas = updatedAreas;
        } else { // Different orientation: Create new nested row
            activeScreenAreas._id += 1; // Increment for newRowId
            const newNestedRow: AreaRowLayout = {
                type: 'area_row',
                id: newRowId,
                orientation: orientation as "horizontal" | "vertical",
                areas: placement === "bottom" || placement === "right"
                    ? [{ id: targetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                    : [{ id: newAreaId, size: 0.5 }, { id: targetAreaId, size: 0.5 }],
            };
            activeScreenAreas.layout[newRowId] = newNestedRow;
            parentRow.areas[targetIndex] = { id: newRowId, size: parentRow.areas[targetIndex].size }; // Replace target with new row ref
        }
    } else { // Target is root or an orphan (no parentRow)
        activeScreenAreas._id += 1; // Increment for newRowId
        const newRootRow: AreaRowLayout = {
            type: 'area_row',
            id: newRowId,
            orientation: orientation as "horizontal" | "vertical",
            areas: placement === "bottom" || placement === "right"
                ? [{ id: targetAreaId, size: 0.5 }, { id: newAreaId, size: 0.5 }]
                : [{ id: newAreaId, size: 0.5 }, { id: targetAreaId, size: 0.5 }]
        };
        activeScreenAreas.layout[newRowId] = newRootRow;
        activeScreenAreas.rootId = newRowId;
        // Ensure the old root (now a child) and newAreaId are in the layout map if they weren't already rows
        if (!activeScreenAreas.layout[targetAreaId]) {
            activeScreenAreas.layout[targetAreaId] = { type: 'area', id: targetAreaId };
        }
    }
}; 
