import { AreaLayout, AreaRowLayout } from "../types/areaTypes";

// Enregistrer l'historique des calculs de viewport pour aider au débogage
const viewportCalculationHistory = {
    lastCalculation: 0,
    totalCalculations: 0,
    failedIds: new Set<string>(),
    reportedProblems: new Set<string>(),
    reset() {
        this.failedIds.clear();
        this.reportedProblems.clear();
    }
};

// Réinitialiser l'historique toutes les 60 secondes
setInterval(() => {
    const now = Date.now();
    if (now - viewportCalculationHistory.lastCalculation > 60000) {
        viewportCalculationHistory.reset();
    }
}, 60000);

// Fonction helper pour vérifier si un objet est extensible
function isObjectExtensible(obj: any): boolean {
    try {
        // Tenter d'ajouter une propriété temporaire
        const testKey = `__test_${Date.now()}`;
        obj[testKey] = true;
        delete obj[testKey];
        return true;
    } catch (e) {
        return false;
    }
}

// Fonction helper pour cloner en toute sécurité un objet de layout
function safeCloneLayout(item: AreaLayout | AreaRowLayout): AreaLayout | AreaRowLayout {
    // Créer une copie basique
    const baseClone = { ...item };

    // Si c'est une ligne, cloner également ses zones
    if (item.type === "area_row") {
        const rowItem = item as AreaRowLayout;
        return {
            ...baseClone,
            type: "area_row",
            id: rowItem.id,
            orientation: rowItem.orientation,
            areas: rowItem.areas.map(area => ({ ...area }))
        } as AreaRowLayout;
    }

    // Si c'est une area simple
    return {
        ...baseClone,
        type: "area",
        id: item.id,
    } as AreaLayout;
}

// Variable statique pour conserver les dernières dimensions valides
let lastValidViewportSize = { width: 0, height: 0 };

export const computeAreaToViewport = (
    layout: { [key: string]: AreaLayout | AreaRowLayout },
    rootId: string,
    viewport: { left: number; top: number; width: number; height: number }
) => {
    // Créer une copie modifiable du layout pour ne pas modifier l'original
    const mutableLayout: { [key: string]: AreaLayout | AreaRowLayout } = {};

    // Cloner tous les éléments du layout pour éviter de modifier des objets non-extensibles
    Object.entries(layout).forEach(([id, item]) => {
        mutableLayout[id] = safeCloneLayout(item);
    });

    // Marquer le début du calcul
    viewportCalculationHistory.lastCalculation = Date.now();
    viewportCalculationHistory.totalCalculations++;

    // Validation initiale du viewport
    if (!viewport || viewport.width <= 0 || viewport.height <= 0) {
        console.error("Invalid viewport dimensions", viewport);

        // Utiliser les dernières dimensions valides si disponibles
        if (lastValidViewportSize.width > 0 && lastValidViewportSize.height > 0) {
            console.warn("Using last valid viewport dimensions");
            viewport = {
                ...viewport,
                width: lastValidViewportSize.width,
                height: lastValidViewportSize.height
            };
        } else {
            return {};
        }
    } else {
        // Mémoriser les dimensions valides
        lastValidViewportSize = { width: viewport.width, height: viewport.height };
    }

    // Validation du layout
    if (!layout || Object.keys(layout).length === 0) {
        console.error("Empty layout provided to computeAreaToViewport");
        return {};
    }

    // Validation du rootId
    if (!rootId || !mutableLayout[rootId]) {
        console.error(`Invalid rootId: ${rootId} - not found in layout`, layout);
        return {};
    }

    const areaToViewport: { [key: string]: { left: number; top: number; width: number; height: number } } = {};

    // Liste pour suivre les IDs visités pour éviter les boucles infinies
    const visitedIds = new Set<string>();
    // Liste des layouts problématiques déjà signalés pour éviter les logs dupliqués
    const reportedProblems = viewportCalculationHistory.reportedProblems;

    // Log de débogage pour le calcul actuel
    console.debug(`Calcul de viewport: rootId=${rootId}, viewportSize=${viewport.width}x${viewport.height}, layoutSize=${Object.keys(mutableLayout).length}`);

    // Vérifiez la structure des zones
    Object.entries(mutableLayout).forEach(([id, area]) => {
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

        // S'assurer que les dimensions sont valides
        const validContentArea = {
            ...contentArea,
            width: Math.max(contentArea.width, 200),
            height: Math.max(contentArea.height, 200)
        };

        areaToViewport[area.id] = { ...validContentArea };
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

        // S'assurer que les dimensions sont valides et stables
        const validContentArea = {
            ...contentArea,
            width: Math.max(contentArea.width, 200),
            height: Math.max(contentArea.height, 200)
        };

        // Affecter le viewport complet à la ligne parente avant de calculer les enfants
        areaToViewport[row.id] = { ...validContentArea };

        // Vérifier en avance les IDs manquants dans le layout pour éviter les problèmes
        const missingAreaIds = row.areas
            .map(area => area.id)
            .filter(id => !mutableLayout[id]);

        if (missingAreaIds.length > 0) {
            console.debug(`Areas referenced in row ${row.id} but not in layout: ${missingAreaIds.join(', ')}`);

            // Créer automatiquement des entrées pour ces zones manquantes
            missingAreaIds.forEach(id => {
                if (!reportedProblems.has(`auto_creating_${id}`)) {
                    console.warn(`Auto-creating area ${id} referenced in row ${row.id}`);
                    reportedProblems.add(`auto_creating_${id}`);
                }

                mutableLayout[id] = {
                    type: "area",
                    id: id
                };
            });
        }

        // Vérifier et corriger les tailles invalides
        const MIN_AREA_SIZE = 0.05; // Taille minimale de 5% pour une zone
        let hasInvalidSizes = false;
        let zeroSizeCount = 0;

        // Premier passage : détecter les zones de taille nulle ou invalide
        row.areas.forEach((area, i) => {
            if (typeof area.size !== 'number' || isNaN(area.size) || area.size <= 0) {
                hasInvalidSizes = true;
                if (area.size === 0) {
                    zeroSizeCount++;
                }
                if (!reportedProblems.has(`${row.id}_${i}_size`)) {
                    console.warn(`Invalid size for area ${area.id}: ${area.size}, defaulting to 1/${row.areas.length}`);
                    reportedProblems.add(`${row.id}_${i}_size`);
                }
                area.size = 1 / row.areas.length;
            } else if (area.size < MIN_AREA_SIZE) {
                // S'assurer que chaque zone a une taille minimale
                if (!reportedProblems.has(`${row.id}_${i}_min_size`)) {
                    console.warn(`Area ${area.id} has very small size: ${area.size}, setting to minimum ${MIN_AREA_SIZE}`);
                    reportedProblems.add(`${row.id}_${i}_min_size`);
                }
                area.size = MIN_AREA_SIZE;
                hasInvalidSizes = true;
            }
        });

        // S'assurer que la somme des tailles fait exactement 1.0
        const totalArea = row.areas.reduce((acc, area) => acc + (area.size || 0), 0);

        // Si toutes les zones ont une taille nulle, définir des tailles égales
        if (totalArea === 0 || zeroSizeCount === row.areas.length) {
            console.warn(`All areas in row ${row.id} have zero size, setting equal distribution`);
            const equalSize = 1.0 / row.areas.length;
            row.areas.forEach(area => {
                area.size = equalSize;
            });
        }
        // Si le total est trop loin de 1.0, normaliser les valeurs
        else if (Math.abs(totalArea - 1.0) > 0.001) {
            console.debug(`Normalizing sizes in row ${row.id}: total=${totalArea}, expected=1.0`);
            const normalizationFactor = 1.0 / totalArea;
            row.areas.forEach(area => {
                area.size = area.size * normalizationFactor;
            });
        }

        let left = validContentArea.left;
        let top = validContentArea.top;
        let remainingWidth = validContentArea.width;
        let remainingHeight = validContentArea.height;

        // Calculer les positions et dimensions exactes pour chaque zone
        // Éviter l'accumulation d'erreurs d'arrondi en conservant le reste
        for (let i = 0; i < row.areas.length; i++) {
            const area = row.areas[i];
            const layoutItem = mutableLayout[area.id];

            if (!layoutItem) {
                console.warn(`Area ${area.id} not found in layout, skipping`);
                continue;
            }

            // Garantir des tailles stables pour la dernière zone
            let areaWidth, areaHeight;

            // Déterminer les dimensions en fonction de l'orientation et de la position
            if (i === row.areas.length - 1) {
                // Pour la dernière zone, utiliser tout l'espace restant pour éviter les erreurs d'arrondi
                areaWidth = row.orientation === "horizontal" ? remainingWidth : validContentArea.width;
                areaHeight = row.orientation === "horizontal" ? validContentArea.height : remainingHeight;
            } else {
                // Pour les autres zones, calculer proportionnellement mais en utilisant des valeurs précises
                if (row.orientation === "horizontal") {
                    // Calculer une largeur proportionnelle mais limiter aux 99% pour éviter les erreurs de bord
                    const rawWidth = area.size * validContentArea.width;
                    areaWidth = Math.max(10, Math.floor(rawWidth)); // Au moins 10px
                    areaHeight = validContentArea.height;
                } else {
                    // Orientation verticale
                    areaWidth = validContentArea.width;
                    const rawHeight = area.size * validContentArea.height;
                    areaHeight = Math.max(10, Math.floor(rawHeight)); // Au moins 10px
                }
            }

            // S'assurer que nous ne dépassons pas l'espace restant
            areaWidth = Math.min(areaWidth, remainingWidth);
            areaHeight = Math.min(areaHeight, remainingHeight);

            // S'assurer que nous avons des dimensions minimales
            areaWidth = Math.max(areaWidth, 10);
            areaHeight = Math.max(areaHeight, 10);

            const nextArea = {
                left,
                top,
                width: areaWidth,
                height: areaHeight
            };

            // Mettre à jour la position pour la zone suivante
            if (row.orientation === "horizontal") {
                left += areaWidth;
                remainingWidth -= areaWidth;
            } else {
                top += areaHeight;
                remainingHeight -= areaHeight;
            }

            // Calculer récursivement les viewports pour les enfants
            try {
                if (layoutItem.type === "area") {
                    computeArea(layoutItem, nextArea);
                } else if (layoutItem.type === "area_row") {
                    computeRow(layoutItem, nextArea);
                }
            } catch (error) {
                console.error(`Error computing viewport for area ${area.id}:`, error);
            }
        }
    }

    // Calculer le viewport initial pour le root
    const rootLayout = mutableLayout[rootId];
    if (rootLayout.type === "area") {
        computeArea(rootLayout, viewport);
    } else if (rootLayout.type === "area_row") {
        computeRow(rootLayout, viewport);
    }

    // Récupérer tous les IDs manquants
    const idsWithoutViewport = Object.keys(mutableLayout).filter(id => !areaToViewport[id]);

    // Si des IDs manquent dans les viewports, on peut tenter une dernière passe de calcul
    if (idsWithoutViewport.length > 0) {
        console.debug(`Missing viewports for ${idsWithoutViewport.length} areas, checking for parent relationship`);

        // Tenter de calculer à nouveau en utilisant des relations parent-enfant alternatives
        idsWithoutViewport.forEach(id => {
            const layoutItem = mutableLayout[id];

            // Vérifier si nous pouvons utiliser la relation parent-enfant du computeAreaToParentRow
            // Pour l'instant, nous ignorons ce cas, car parentId n'existe pas dans notre structure
            // Note: parentId a été supprimé pour éviter les erreurs de linter
            /* 
            if (layoutItem && layoutItem.parentId && areaToViewport[layoutItem.parentId]) {
                console.debug(`Using parent viewport for ${id} from ${layoutItem.parentId}`);
                areaToViewport[id] = { ...areaToViewport[layoutItem.parentId] };
            }
            */

            // Si aucun viewport n'a été calculé, utiliser un viewport par défaut
            if (!areaToViewport[id]) {
                viewportCalculationHistory.failedIds.add(id);
                areaToViewport[id] = {
                    left: 0,
                    top: 0,
                    width: 100,
                    height: 100
                };
                console.debug(`Using default viewport for ${id}`);
            }
        });
    }

    return areaToViewport;
}; 
