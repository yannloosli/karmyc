import { WritableDraft } from "immer";
import { IntercardinalDirection } from "../../../types/directions";
import { RootStateType } from "../../../data/mainStore";
import { AreaRowLayout } from "../../../types/areaTypes";
import { simplifyLayoutNodeIfNeeded } from "../../utils/areas";
import { computeAreaToParentRow } from "../../..";


// --- Define Split Result Type (kept for AreaSliceStateData) ---
export interface SplitResult {
    newRowId: string;
    separatorIndex: number;
}

export const splitArea = (set: any) => (payload: {
    areaIdToSplit: string;
    parentRowId: string | null;
    horizontal: boolean;
    corner: IntercardinalDirection;
}) => {
    let result: SplitResult | null = null;
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;

        const { areaIdToSplit, parentRowId, horizontal } = payload;
        const areaToSplit = activeScreenAreas.layout[areaIdToSplit];

        // Si c'est un area_row avec orientation stack, on le traite comme un stack à dupliquer
        if (areaToSplit.type === 'area_row' && areaToSplit.orientation === 'stack') {
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
        // Incrémenter le compteur avant de générer les IDs
        activeScreenAreas._id += 1;
        const baseId = activeScreenAreas._id;
        const newAreaId = `area-${baseId}`;
        const newRowId = `row-${baseId + 1}`;

        // 1. Create New Area Data & Layout Entry
        if (activeScreenAreas.areas[newAreaId] || activeScreenAreas.layout[newAreaId]) {
            console.error(`splitArea: ID conflict for new area ${newAreaId}`); return;
        }
        // Correction ici : on prend le type depuis l'objet métier
        const originalArea = activeScreenAreas.areas[areaIdToSplit];
        activeScreenAreas.areas[newAreaId] = {
            id: newAreaId,
            type: originalArea?.type || areaToSplit.type, // Priorité à l'objet métier
            state: { ...originalArea?.state }, // Copier l'état de l'area source
            spaceId: originalArea?.spaceId // Hériter de l'espace de l'area source
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
                const areaToParentRowMap = computeAreaToParentRow(activeScreenAreas.layout);
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
                    const totalChildSize = childRow.areas.reduce((acc: number, a: { id: string; size?: number }) => acc + (a.size ?? 0), 0) || 1;
                    const newAreas = childRow.areas.map((a: { id: string; size?: number }) => ({
                        id: a.id,
                        size: (a.size ?? 1 / childRow.areas.length) * parentSize / totalChildSize
                    }));
                    // On remplace le row enfant par ses propres enfants (en évitant les doublons)
                    row.areas.splice(i, 1, ...newAreas.filter((na: { id: string; size?: number }) => !row.areas.some((a: { id: string }) => a.id === na.id)));
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

        // À la toute fin, si mutation réelle
        state.lastUpdated = Date.now();
    });
    return result;
}
