import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

export const computeAreaToViewport = (
    layout: { [key: string]: AreaLayout | AreaRowLayout },
    rootId: string,
    viewport: { left: number; top: number; width: number; height: number }
) => {
    // Validation initiale du viewport
    if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
        console.error("Invalid viewport dimensions", viewport);
        return {};
    }

    // Validation du layout
    if (!layout || Object.keys(layout).length === 0) {
        console.error("Empty layout provided to computeAreaToViewport");
        return {};
    }

    // Validation du rootId
    if (!rootId || !layout[rootId]) {
        console.error(`Invalid rootId: ${rootId} - not found in layout`, layout);
        return {};
    }

    console.log("[computeAreaToViewport] Starting with:", { layout, rootId, viewport });

    const areaToViewport: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

    // Liste pour suivre les IDs visités pour éviter les boucles infinies
    const visitedIds = new Set<string>();

    // Vérifiez la structure des zones
    Object.entries(layout).forEach(([id, area]) => {
        if (!area) {
            console.error(`Invalid area definition for id ${id}`, area);
        } else if (area.type === "area_row" && (!area.areas || !Array.isArray(area.areas))) {
            console.error(`Area row ${id} has invalid areas property`, area);
        }
    });

    function computeArea(area: AreaLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        if (!area || !contentArea) {
            console.error("Invalid area or contentArea in computeArea", { area, contentArea });
            return;
        }

        // Éviter de recalculer un viewport déjà visité
        if (visitedIds.has(area.id)) {
            return;
        }
        visitedIds.add(area.id);

        console.log("[computeArea] Computing viewport for area:", { areaId: area.id, contentArea });
        areaToViewport[area.id] = { ...contentArea };
    }

    function computeRow(row: AreaRowLayout, contentArea: { left: number; top: number; width: number; height: number }) {
        if (!row || !contentArea || !row.areas || row.areas.length === 0) {
            console.error("Invalid row or contentArea in computeRow", { row, contentArea });
            return;
        }

        // Éviter de recalculer un viewport déjà visité
        if (visitedIds.has(row.id)) {
            return;
        }
        visitedIds.add(row.id);

        console.log("[computeRow] Computing viewports for row:", { rowId: row.id, areas: row.areas, contentArea });

        areaToViewport[row.id] = { ...contentArea };

        const size = row.orientation === "horizontal" ? contentArea.width : contentArea.height;

        // Vérifiez et corrigez les IDs manquants dans les zones
        row.areas.forEach((area, i) => {
            if (!area.id) {
                console.error(`Missing id for area at index ${i} in row ${row.id}`, area);
                // Tenter de le corriger
                area.id = `${row.id}_${i}`;
                console.log(`Assigned temporary id ${area.id} to area`);
            }
        });

        // Si aucune taille n'est définie, distribuer équitablement
        const hasNoSizes = row.areas.every(area => !area.size && area.size !== 0);
        if (hasNoSizes) {
            console.log(`Row ${row.id} has areas without sizes, distributing equally`);
            const equalSize = 1 / row.areas.length;
            row.areas.forEach(area => area.size = equalSize);
        }

        // S'assurer que toutes les tailles sont valides
        row.areas.forEach((area, i) => {
            if (typeof area.size !== 'number' || isNaN(area.size) || area.size < 0) {
                console.warn(`Invalid size for area ${area.id}: ${area.size}, defaulting to 1/${row.areas.length}`);
                area.size = 1 / row.areas.length;
            }
        });

        const totalArea = row.areas.reduce((acc, area) => acc + (area.size || 0), 0);

        if (totalArea <= 0) {
            console.error("Total area is zero or negative", { rowId: row.id, totalArea });
            // Corriger en distribuant équitablement
            const equalSize = 1 / row.areas.length;
            row.areas.forEach(area => area.size = equalSize);
            return computeRow(row, contentArea); // Relancer avec des tailles corrigées
        }

        let left = contentArea.left;
        let top = contentArea.top;
        let remainingSize = size;

        // Utilisez for loop pour éviter les callbacks imbriqués
        for (let i = 0; i < row.areas.length; i++) {
            const area = row.areas[i];

            // Vérifiez et corrigez les zones sans ID défini dans le layout
            if (!layout[area.id]) {
                console.warn(`Area ${area.id} referenced in row ${row.id} is not defined in layout, creating it`);

                // Créer une entrée pour cette zone
                layout[area.id] = {
                    type: "area",
                    id: area.id
                };
            }

            const layoutItem = layout[area.id];

            if (!layoutItem) {
                console.error(`Layout not found for area ${area.id}, skipping viewport calculation`);
                continue;
            }

            const t = area.size / totalArea;
            const isLastItem = i === row.areas.length - 1;

            // Pour le dernier élément, utiliser l'espace restant pour éviter les erreurs d'arrondi
            const itemSize = isLastItem ? remainingSize : Math.floor(size * t);

            const contentAreaForArea = {
                left,
                top,
                width: row.orientation === "horizontal" ? itemSize : contentArea.width,
                height: row.orientation === "vertical" ? itemSize : contentArea.height,
            };

            console.log("[computeRow] Computed area viewport:", {
                areaId: area.id,
                size: area.size,
                totalArea,
                ratio: t,
                contentArea: contentAreaForArea,
                layoutItem
            });

            // Mettre à jour l'espace restant
            if (row.orientation === "horizontal") {
                remainingSize -= contentAreaForArea.width;
                left += contentAreaForArea.width;
            } else {
                remainingSize -= contentAreaForArea.height;
                top += contentAreaForArea.height;
            }

            // Vérifier que les coordonnées sont à jour avant de continuer
            console.log(`[computeRow] After area ${area.id}: left=${left}, top=${top}, remainingSize=${remainingSize}`);

            // Appliquer le viewport directement ici pour garantir qu'il est défini
            areaToViewport[area.id] = { ...contentAreaForArea };
            console.log(`[computeRow] Set viewport for ${area.id}:`, areaToViewport[area.id]);

            // Traiter récursivement chaque zone
            if (layoutItem.type === "area_row") {
                computeRow(layoutItem as AreaRowLayout, contentAreaForArea);
            } else {
                computeArea(layoutItem as AreaLayout, contentAreaForArea);
            }
        }
    }

    const rootLayout = layout[rootId];
    if (rootLayout.type === "area_row") {
        computeRow(rootLayout as AreaRowLayout, viewport);
    } else {
        computeArea(rootLayout as AreaLayout, viewport);
    }

    // Vérifiez que tous les IDs du layout ont un viewport
    // et créez des viewports pour les IDs manquants
    Object.keys(layout).forEach(id => {
        if (!areaToViewport[id]) {
            // Essayez de trouver un parent pour cet ID
            const parentId = findParentId(layout, id);
            if (parentId && areaToViewport[parentId]) {
                // Utiliser le viewport du parent comme fallback
                console.warn(`Creating fallback viewport for layout id ${id} based on parent ${parentId}`);
                areaToViewport[id] = { ...areaToViewport[parentId] };
            } else {
                // Utiliser le viewport root comme dernier recours
                console.warn(`No viewport calculated for layout id ${id}, using root viewport`);
                areaToViewport[id] = { ...viewport };
            }
        }
    });

    // Fonction helper pour trouver le parent d'un ID
    function findParentId(layout: { [key: string]: AreaLayout | AreaRowLayout }, childId: string): string | null {
        for (const [id, item] of Object.entries(layout)) {
            if (item.type === "area_row") {
                const row = item as AreaRowLayout;
                if (row.areas && row.areas.some(area => area.id === childId)) {
                    return id;
                }
            }
        }
        return null;
    }

    console.log("[computeAreaToViewport] Final result:", areaToViewport);

    return areaToViewport;
}; 
