import { Vec2 } from '@gamesberry/karmyc-shared';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AreaTypeValue } from '../../constants';
import { Area, AreaLayout, AreaRowLayout } from '../../types/areaTypes';
import { CardinalDirection } from '../../types/directions';
import { Point, Rect } from '../../types/geometry';
import { computeAreaToParentRow } from '../../utils/areaToParentRow';
import { areaToRow } from '../../utils/areaToRow';
import { computeAreaToViewport } from '../../utils/areaToViewport';
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from '../../utils/areaUtils';
import { getAreaRootViewport } from '../../utils/getAreaViewport';
import { joinAreas as joinAreasUtil } from '../../utils/joinArea';
import { validateArea } from '../../utils/validation';

// Fonction pour trouver tous les IDs connectés au root
function findConnectedIds(layout: Record<string, AreaLayout | AreaRowLayout>, rootId: string | null): Set<string> {
    const connectedIds = new Set<string>();

    // Si rootId est null, retourner un Set vide
    if (!rootId) {
        return connectedIds;
    }

    // Fonction récursive pour parcourir la structure à partir du root
    function traverse(id: string) {
        // Si ID déjà visité ou non existant
        if (connectedIds.has(id) || !layout[id]) {
            return;
        }

        // Marquer l'ID comme connecté
        connectedIds.add(id);

        // Si c'est une ligne, traverser tous ses enfants
        const item = layout[id];
        if (item.type === "area_row") {
            const row = item as AreaRowLayout;
            if (row.areas && Array.isArray(row.areas)) {
                row.areas.forEach(area => {
                    if (area && area.id) {
                        traverse(area.id);
                    }
                });
            }
        }
    }

    // Démarrer la traversée à partir du root
    traverse(rootId);
    return connectedIds;
}

// Fonction pour valider et nettoyer l'état chargé
function validateLoadedState(state: Partial<AreaState>): AreaState {
    const defaultState: AreaState = {
        _id: 0,
        errors: [],
        activeAreaId: null,
        layout: {},
        areas: {},
        viewports: {},
        joinPreview: null,
        rootId: null,
        areaToOpen: null,
    };

    // Si pas d'état chargé, retourner l'état par défaut
    if (!state?.layout || !state?.areas) {
        return defaultState;
    }

    // S'assurer que toutes les zones référencées dans le layout existent dans areas
    const validatedLayout: typeof defaultState.layout = {};
    const validatedAreas: typeof defaultState.areas = {};
    let maxId = 0;

    // Parcourir le layout pour valider les zones
    Object.entries(state.layout).forEach(([id, layout]) => {
        const numId = parseInt(id);
        if (!isNaN(numId)) {
            maxId = Math.max(maxId, numId);
        }

        // Vérifier que la zone existe dans areas
        if (layout.type === "area" && state.areas?.[id]) {
            validatedLayout[id] = layout;
            const area = state.areas[id];
            validatedAreas[id] = {
                ...area,
                id,
                type: area.type,
                state: area.state,
            };
        }
        // Vérifier que c'est une ligne valide
        else if (layout.type === "area_row" && (layout as AreaRowLayout).areas?.length > 0) {
            validatedLayout[id] = layout;
        }
    });

    // Si aucune zone valide n'a été trouvée, retourner l'état par défaut
    if (Object.keys(validatedLayout).length === 0) {
        return defaultState;
    }

    // Vérifier que le rootId existe
    const rootId = state.rootId && validatedLayout[state.rootId] ? state.rootId : defaultState.rootId;

    // Vérifier que toutes les zones sont connectées au root
    const connectedIds = findConnectedIds(validatedLayout, rootId);

    // Filtrer les zones non connectées au root
    const cleanedLayout: typeof validatedLayout = {};
    Object.keys(validatedLayout).forEach(id => {
        if (connectedIds.has(id)) {
            cleanedLayout[id] = validatedLayout[id];
        } else {
            console.warn(`Zone ${id} non connectée au root ${rootId}, suppression`);
        }
    });

    // Filtrer également les areas pour ne garder que celles connectées
    const cleanedAreas: typeof validatedAreas = {};
    Object.keys(validatedAreas).forEach(id => {
        if (connectedIds.has(id)) {
            cleanedAreas[id] = validatedAreas[id];
        }
    });

    // S'il ne reste aucune zone après le nettoyage, retourner l'état par défaut
    if (Object.keys(cleanedLayout).length === 0) {
        console.warn("Aucune zone connectée au root, utilisation de l'état par défaut");
        return defaultState;
    }

    return {
        ...defaultState,
        _id: Math.max(maxId, defaultState._id),
        layout: cleanedLayout,
        areas: cleanedAreas,
        rootId: rootId,
    };
}

export interface AreaState {
    _id: number;
    rootId: string | null;
    errors: string[];
    activeAreaId: string | null;
    joinPreview: null | {
        areaId: string | null;
        movingInDirection: CardinalDirection | null;
        eligibleAreaIds: string[];
    };
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
}

// Charger et nettoyer l'état initial depuis le localStorage
const savedState = localStorage.getItem('areaState');

const initialState: AreaState = savedState ? validateLoadedState(JSON.parse(savedState)) : validateLoadedState({});

export const areaSlice = createSlice({
    name: 'area',
    initialState,
    reducers: {
        addArea: (state, action: PayloadAction<Area<AreaTypeValue>>) => {
            const validation = validateArea(action.payload);
            if (!validation.isValid) {
                state.errors = validation.errors;
                console.error("Validation échouée pour la zone:", validation.errors);
                return;
            }

            // Utiliser l'ID fourni ou générer un nouvel ID
            const areaId = action.payload.id || (++state._id).toString();

            // Ajouter la zone à l'état
            state.areas[areaId] = {
                ...action.payload,
                id: areaId,
                state: action.payload.state,
            };

            // Ajouter la zone au layout
            // Si aucun rootId n'existe encore, cette zone devient la root
            if (!state.rootId) {
                state.rootId = areaId;
                state.layout[areaId] = {
                    type: 'area',
                    id: areaId
                };
            } else {
                // Sinon, si rootId existe mais n'est pas une ligne, le transformer en ligne
                const rootLayout = state.layout[state.rootId];
                if (rootLayout && rootLayout.type === 'area') {
                    const rowId = `row-${Date.now()}`;

                    // Créer une nouvelle ligne
                    state.layout[rowId] = {
                        type: 'area_row',
                        id: rowId,
                        orientation: 'horizontal',
                        areas: [
                            { id: state.rootId, size: 70 },  // La zone existante garde plus d'espace
                            { id: areaId, size: 30 }        // La nouvelle zone prend moins d'espace
                        ]
                    };

                    // Ajouter la nouvelle zone au layout
                    state.layout[areaId] = {
                        type: 'area',
                        id: areaId
                    };

                    // Mettre à jour le rootId
                    state.rootId = rowId;
                }
                // Si la root est déjà une ligne, ajouter la zone à cette ligne
                else if (rootLayout && rootLayout.type === 'area_row') {

                    // Ajouter la zone au layout
                    state.layout[areaId] = {
                        type: 'area',
                        id: areaId
                    };

                    // Ajouter la zone à la ligne
                    const rowLayout = rootLayout as AreaRowLayout;
                    if (rowLayout.areas) {
                        // Au lieu de redimensionner toutes les zones à parts égales,
                        // réduire proportionnellement les zones existantes pour faire de la place
                        const newZoneSize = 30;  // Taille fixe pour la nouvelle zone (30%)

                        // Calculer la somme actuelle des tailles (normalement 100)
                        const totalCurrentSize = rowLayout.areas.reduce((sum, area) => sum + area.size, 0);

                        // Facteur de réduction pour les zones existantes
                        const reductionFactor = (totalCurrentSize - newZoneSize) / totalCurrentSize;

                        // Réduire proportionnellement chaque zone existante
                        rowLayout.areas.forEach(area => {
                            area.size = area.size * reductionFactor;
                        });

                        // Ajouter la nouvelle zone avec sa taille fixe
                        rowLayout.areas.push({
                            id: areaId,
                            size: newZoneSize
                        });
                    }
                } else {
                    console.error(`rootId ${state.rootId} invalide ou manquant dans le layout`);
                    state.errors = ['rootId invalide ou manquant dans le layout'];
                    return;
                }
            }

            // Activer la nouvelle zone
            state.activeAreaId = areaId;

            state.errors = [];
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        removeArea: (state, action: PayloadAction<string>) => {
            const areaId = action.payload;

            // Trouver la rangée parente de la zone à supprimer
            const areaToParentRow = computeAreaToParentRow(state);
            const parentRowId = areaToParentRow[areaId];

            // Créer un ensemble pour suivre toutes les zones et rangées à supprimer
            const itemsToRemove = new Set<string>([areaId]);

            if (parentRowId) {
                const parentRow = state.layout[parentRowId] as AreaRowLayout;

                if (parentRow && parentRow.areas) {
                    // Trouver l'index de la zone à supprimer
                    const targetIndex = parentRow.areas.findIndex(a => a.id === areaId);

                    if (targetIndex !== -1) {

                        // Supprimer la zone de la rangée
                        parentRow.areas.splice(targetIndex, 1);

                        // Si c'était la dernière zone de la rangée, marquer la rangée pour suppression
                        if (parentRow.areas.length === 0) {
                            itemsToRemove.add(parentRowId);

                            // Trouver le grand-parent
                            const grandParentRowId = areaToParentRow[parentRowId];

                            if (grandParentRowId) {
                                const grandParentRow = state.layout[grandParentRowId] as AreaRowLayout;

                                if (grandParentRow && grandParentRow.areas) {

                                    // Trouver l'index du parent dans le grand-parent
                                    const parentIndex = grandParentRow.areas.findIndex(a => a.id === parentRowId);

                                    if (parentIndex !== -1) {
                                        // Supprimer la référence à la rangée parente du grand-parent
                                        grandParentRow.areas.splice(parentIndex, 1);

                                        // Si le grand-parent est vide, le marquer aussi pour suppression
                                        if (grandParentRow.areas.length === 0) {
                                            itemsToRemove.add(grandParentRowId);

                                            // Réinitialiser rootId si nécessaire
                                            if (state.rootId === grandParentRowId) {
                                                state.rootId = null;
                                            }
                                        } else {
                                            // Normaliser les tailles des zones restantes dans le grand-parent
                                            const totalSize = grandParentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                                            if (totalSize > 0) {
                                                const factor = 1.0 / totalSize;
                                                grandParentRow.areas.forEach(area => {
                                                    area.size = (area.size || 0) * factor;
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                            // Si le parent est la racine, réinitialiser rootId
                            else if (state.rootId === parentRowId) {
                                state.rootId = null;
                            }
                        } else {
                            // Recalculer les tailles des zones restantes
                            const totalSize = parentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                            if (totalSize > 0) {
                                const factor = 1.0 / totalSize;
                                parentRow.areas.forEach(area => {
                                    area.size = (area.size || 0) * factor;
                                });
                            }
                        }
                    }
                }
            }

            // Supprimer toutes les zones marquées
            itemsToRemove.forEach(id => {
                // Supprimer du tableau des zones
                if (state.areas[id]) {
                    delete state.areas[id];
                }

                // Supprimer du layout
                if (state.layout[id]) {
                    delete state.layout[id];
                }

                // Supprimer des viewports
                if (state.viewports[id]) {
                    delete state.viewports[id];
                }

                // Réinitialiser activeAreaId si nécessaire
                if (state.activeAreaId === id) {
                    state.activeAreaId = null;
                }
            });

            // Supprimer récursivement les références aux rangées supprimées dans tout le layout
            Object.entries(state.layout).forEach(([id, item]) => {
                if (item.type === 'area_row') {
                    const rowLayout = item as AreaRowLayout;
                    if (rowLayout.areas) {
                        // Filtrer les références aux zones supprimées
                        const originalLength = rowLayout.areas.length;
                        rowLayout.areas = rowLayout.areas.filter(a => !itemsToRemove.has(a.id));

                        // Si des références ont été supprimées, normaliser les tailles
                        if (rowLayout.areas.length !== originalLength && rowLayout.areas.length > 0) {
                            const totalSize = rowLayout.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                            if (totalSize > 0) {
                                const factor = 1.0 / totalSize;
                                rowLayout.areas.forEach(area => {
                                    area.size = (area.size || 0) * factor;
                                });
                            }
                        }
                    }
                }
            });

            // Nettoyer les zones déconnectées
            cleanDisconnectedAreas(state);

            state.errors = [];

            // Enregistrer l'état
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        updateArea: (state, action: PayloadAction<{ id: string; changes: Partial<Area<AreaTypeValue>> }>) => {
            const { id, changes } = action.payload;
            if (!state.areas[id]) {
                state.errors = ['Zone non trouvée'];
                return;
            }

            const updatedArea = { ...state.areas[id], ...changes };
            const validation = validateArea(updatedArea);

            if (!validation.isValid) {
                state.errors = validation.errors;
                return;
            }

            state.areas[id] = updatedArea;
            state.errors = [];
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        setActiveArea: (state, action: PayloadAction<string | null>) => {
            if (action.payload && !state.areas[action.payload]) {
                state.errors = ['Zone non trouvée'];
                return;
            }
            state.activeAreaId = action.payload;
            state.errors = [];
        },
        clearErrors: (state) => {
            state.errors = [];
        },
        setFields: (state, action: PayloadAction<Partial<AreaState>>) => {
            return { ...state, ...action.payload };
        },
        setJoinAreasPreview: (state, action: PayloadAction<{
            areaId: string | null;
            direction: CardinalDirection | null;
            eligibleAreaIds: string[];
        }>) => {
            const { areaId, direction, eligibleAreaIds } = action.payload;
            state.joinPreview = {
                areaId,
                movingInDirection: direction,
                eligibleAreaIds,
            };
        },
        joinAreas: (state, action: PayloadAction<{
            rowId: string;
            mergeArea: number;
            mergeInto: -1 | 1;
        }>) => {
            const { rowId, mergeArea, mergeInto } = action.payload;
            const row = state.layout[rowId] as AreaRowLayout;

            if (!row || !row.areas) {
                state.errors = ['Ligne invalide pour la fusion'];
                return;
            }

            try {
                const result = joinAreasUtil(row, mergeArea, mergeInto);

                const { area, removedAreaId } = result;
                const shouldRemoveRow = row.areas.length === 2;
                const areaToParentRow = computeAreaToParentRow(state);

                // Conserver le type de la zone source
                const sourceAreaId = row.areas[mergeArea].id;
                const sourceArea = state.areas[sourceAreaId];

                if (shouldRemoveRow && state.rootId === row.id) {
                    state.rootId = area.id;
                }

                // Ne chercher que les enfants directs de la zone supprimée, sans inclure les structures parentes
                const removedChildrenIds = new Set<string>([removedAreaId]);

                // Vérifier si la zone supprimée est une ligne avec ses propres enfants
                if (state.layout[removedAreaId]?.type === "area_row") {
                    const removedRow = state.layout[removedAreaId] as AreaRowLayout;
                    if (removedRow.areas && Array.isArray(removedRow.areas)) {
                        // Ajouter uniquement les enfants directs de la ligne supprimée
                        removedRow.areas.forEach(childArea => {
                            if (childArea && childArea.id) {
                                removedChildrenIds.add(childArea.id);
                            }
                        });
                    }
                }

                console.debug(`Zones à supprimer après fusion: ${Array.from(removedChildrenIds).join(', ')}`);

                // Approche simplifiée : créer un nouvel état propre au lieu de manipuler l'existant

                // 1. Nettoyer le layout
                const newLayout: { [key: string]: AreaRowLayout | AreaLayout } = {};

                Object.entries(state.layout).forEach(([id, layoutItem]) => {
                    // Ne supprimer que la zone à supprimer et ses enfants directs
                    if (removedChildrenIds.has(id)) {
                        // Cas spécial: déplacer les petits-enfants vers le haut si nécessaire
                        if (id === removedAreaId && layoutItem.type === "area_row") {
                            const removedRow = layoutItem as AreaRowLayout;
                            // On ne fait rien ici car les petits-enfants ne doivent pas être supprimés
                        }
                        return; // Ignorer cette zone (elle sera supprimée)
                    }

                    // Pour les lignes, vérifier et mettre à jour les références
                    if (layoutItem.type === "area_row") {
                        const rowLayout = layoutItem as AreaRowLayout;

                        // Si c'est la ligne parent de la ligne fusionnée
                        if (id === areaToParentRow[row.id]) {
                            const newAreas = rowLayout.areas.map(x =>
                                x.id === row.id ? { id: area.id, size: x.size } : x
                            );
                            newLayout[id] = {
                                ...rowLayout,
                                areas: newAreas
                            };
                        }
                        // Si c'est la ligne fusionnée et qu'on doit la remplacer
                        else if (id === row.id && !shouldRemoveRow) {
                            newLayout[id] = area;
                        }
                        // Sinon, conserver la ligne telle quelle mais filtrer les zones directement supprimées
                        else {
                            // Ne filtrer que les zones directement supprimées
                            const validAreas = rowLayout.areas.filter(a =>
                                !removedChildrenIds.has(a.id)
                            );

                            // Ne garder la ligne que si elle a encore des zones
                            if (validAreas.length > 0) {
                                // Normaliser les tailles quand on a supprimé des zones
                                if (validAreas.length !== rowLayout.areas.length) {
                                    const totalSize = validAreas.reduce((sum, a) => sum + (a.size || 0), 0);
                                    if (Math.abs(totalSize - 1.0) > 0.001 && totalSize > 0) {
                                        const factor = 1.0 / totalSize;
                                        validAreas.forEach(a => {
                                            a.size = (a.size || 0) * factor;
                                        });
                                    }
                                }

                                newLayout[id] = {
                                    ...rowLayout,
                                    areas: validAreas
                                };
                            }
                        }
                    }
                    // Pour les zones simples, les garder telles quelles
                    else if (id === area.id) {
                        newLayout[id] = area;
                    }
                    else {
                        newLayout[id] = layoutItem;
                    }
                });

                // 2. Nettoyer les areas
                const newAreas: { [key: string]: Area<AreaTypeValue> } = {};

                Object.entries(state.areas).forEach(([id, areaItem]) => {
                    // Ignorer uniquement la zone supprimée et ses enfants directs
                    if (removedChildrenIds.has(id)) {
                        return;
                    }

                    // Ajouter la zone résultante de la fusion
                    if (id === area.id) {
                        newAreas[id] = {
                            ...sourceArea,
                            id: area.id
                        };
                    }
                    // Garder les autres zones
                    else {
                        newAreas[id] = areaItem;
                    }
                });

                // 3. Mettre à jour l'état global
                state.layout = newLayout;
                state.areas = newAreas;

                // Réinitialiser l'activeAreaId si c'était une des zones supprimées
                if (state.activeAreaId && removedChildrenIds.has(state.activeAreaId)) {
                    state.activeAreaId = null;
                }

                // Nettoyer les viewports pour toutes les zones supprimées
                for (const id of removedChildrenIds) {
                    if (state.viewports[id]) {
                        delete state.viewports[id];
                    }
                }

                state.joinPreview = null;
                state.errors = [];

                // Ajouter le nettoyage des zones déconnectées pour s'assurer que tout est cohérent
                cleanDisconnectedAreas(state);

                // Sauvegarder l'état après la fusion
                const stateToSave = validateLoadedState(state);
                localStorage.setItem('areaState', JSON.stringify(stateToSave));
            } catch (error) {
                console.error('Erreur lors de la fusion:', error);
                state.errors = [(error as Error).message];
                state.joinPreview = null;
            }
        },
        convertAreaToRow: (state, action: PayloadAction<{
            areaId: string;
            cornerParts: [CardinalDirection, CardinalDirection];
            horizontal: boolean;
        }>) => {
            const { cornerParts, areaId, horizontal } = action.payload;

            const idForOldArea = (++state._id).toString();
            const idForNewArea = (++state._id).toString();

            const row = areaToRow(areaId, idForOldArea, idForNewArea, horizontal, cornerParts);

            // Validation et normalisation des tailles des zones
            const MIN_AREA_SIZE = 0.1; // Taille minimale de 10%
            if (row.areas && row.areas.length > 0) {
                // Vérification des tailles
                let hasSizeIssue = false;
                let totalSize = 0;

                // Vérifier chaque taille
                row.areas.forEach(area => {
                    if (typeof area.size !== 'number' || isNaN(area.size) || area.size <= 0) {
                        console.warn(`Invalid size detected for area ${area.id}, fixing...`);
                        area.size = 0.5; // Taille par défaut
                        hasSizeIssue = true;
                    } else if (area.size < MIN_AREA_SIZE) {
                        console.warn(`Area ${area.id} has size ${area.size} below minimum ${MIN_AREA_SIZE}, adjusting...`);
                        area.size = MIN_AREA_SIZE;
                        hasSizeIssue = true;
                    }
                    totalSize += area.size;
                });

                // Normaliser les tailles si nécessaire
                if (Math.abs(totalSize - 1.0) > 0.001 || hasSizeIssue) {
                    console.debug(`Normalizing area sizes in row ${row.id} (total: ${totalSize})`);
                    // Si le total est trop différent de 1.0
                    const factor = 1.0 / totalSize;
                    row.areas.forEach(area => {
                        area.size = area.size * factor;
                    });
                }
            }

            // Renommer et déplacer l'ancienne zone en s'assurant qu'elle a un type
            state.areas[idForOldArea] = {
                ...state.areas[areaId],
                type: state.areas[areaId].type,
                state: state.areas[areaId].state
            };

            state.areas[idForNewArea] = {
                ...state.areas[areaId],
                type: state.areas[areaId].type,
                state: state.areas[areaId].state
            };

            delete state.areas[areaId];

            // Ajouter les nouveaux layouts
            state.layout[idForOldArea] = { type: "area", id: idForOldArea };
            state.layout[idForNewArea] = { type: "area", id: idForNewArea };
            state.layout[areaId] = row;

            // Mettre à jour le layout parent si nécessaire
            const areaToParentRow = computeAreaToParentRow(state);
            const parentRowId = areaToParentRow[areaId];
            if (parentRowId) {
                const parentRow = state.layout[parentRowId] as AreaRowLayout;
                parentRow.areas = parentRow.areas.map(area =>
                    area.id === areaId ? { ...area, id: areaId } : area
                );
            }

            // Ajouter le nettoyage des zones déconnectées
            cleanDisconnectedAreas(state);

            // Sauvegarder l'état après la conversion
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        insertAreaIntoRow: (state, action: PayloadAction<{
            rowId: string;
            area: Area<AreaTypeValue>;
            insertIndex: number;
        }>) => {
            const { rowId, area, insertIndex } = action.payload;
            const row = state.layout[rowId] as AreaRowLayout;
            const newAreaId = (state._id + 1).toString();

            const areas = [...row.areas];
            areas.splice(insertIndex, 0, { id: newAreaId, size: 0 });

            state._id += 1;
            state.layout[row.id] = { ...row, areas };
            state.layout[newAreaId] = { type: "area", id: newAreaId };
            state.areas[newAreaId] = area;

            // Sauvegarder l'état après l'insertion
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        setRowSizes: (state, action: PayloadAction<{
            rowId: string;
            sizes: number[];
        }>) => {
            const { rowId, sizes } = action.payload;
            const row = state.layout[rowId] as AreaRowLayout;

            if (row.areas.length !== sizes.length) {
                throw new Error("Expected row areas to be the same length as sizes.");
            }

            row.areas = row.areas.map((area, i) => ({ ...area, size: sizes[i] }));

            // Ajouter le nettoyage des zones déconnectées
            cleanDisconnectedAreas(state);

            // Sauvegarder l'état après la modification des tailles
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        setAreaType: (state, action: PayloadAction<{
            areaId: string;
            type: AreaTypeValue;
            initialState?: any;
        }>) => {
            const { areaId, type, initialState: initState } = action.payload;
            const area = state.areas[areaId];

            if (!area) {
                console.error(`Zone ${areaId} introuvable`);
                return;
            }

            // Déterminer l'état initial approprié
            // 1. Utiliser l'état initial fourni s'il existe
            // 2. Sinon, utiliser l'état initial par défaut du registre
            // 3. S'assurer qu'un état par défaut est toujours disponible pour éviter les erreurs
            let newState;

            if (initState) {
                // Option 1: État initial fourni
                newState = initState;
            } else {
                // Option 3: État par défaut basé sur le type
                console.warn(`Aucun état initial trouvé pour le type ${type}, création d'un état par défaut`);

                // Créer un état par défaut basé sur le type
                switch (type) {
                case 'text-note':
                    newState = { content: '' };
                    break;
                case 'color-picker':
                    newState = { color: '#1890ff' };
                    break;
                case 'image-viewer':
                    newState = { imageUrl: 'https://picsum.photos//300/400', caption: '' };
                    break;
                default:
                    newState = {};
                    break;
                }
            }

            // Conserver toutes les propriétés existantes sauf 'type' et 'state'
            // qui seront remplacées par les nouvelles valeurs
            state.areas[areaId] = {
                ...area,
                type,
                state: newState,
            };

            // Sauvegarder l'état après le changement de type
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        setViewports: (state, action: PayloadAction<{ viewports: Record<string, Rect> }>) => {
            state.viewports = { ...state.viewports, ...action.payload.viewports };
            // Sauvegarder uniquement les données persistantes
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        cleanupTemporaryStates: (state) => {
            state.joinPreview = null;
            state.areaToOpen = null;
            state.errors = [];
        },
        resetState: () => {
            localStorage.removeItem('areaState');
            return validateLoadedState({});
        },
        addAreaToRow: (state, action: PayloadAction<{
            rowId: string;
            afterAreaId: string;
        }>) => {
            const { rowId, afterAreaId } = action.payload;
            const row = state.layout[rowId] as AreaRowLayout;

            if (!row || row.type !== 'area_row') {
                state.errors = ['Ligne non trouvée ou invalide'];
                return;
            }

            const areaIndex = row.areas.findIndex(a => a.id === afterAreaId);
            if (areaIndex === -1) {
                state.errors = ['Zone non trouvée dans la ligne'];
                return;
            }

            // Créer une nouvelle zone avec le même type que la zone précédente
            const newAreaId = (++state._id).toString();
            const sourceArea = state.areas[afterAreaId];
            state.areas[newAreaId] = {
                id: newAreaId,
                type: sourceArea.type,
                state: {}
            };

            // Ajouter la nouvelle zone dans la ligne après la zone spécifiée
            row.areas.splice(areaIndex + 1, 0, { id: newAreaId, size: 0 });

            // Mettre à jour le layout
            state.layout[newAreaId] = {
                type: 'area',
                id: newAreaId
            };

            // Sauvegarder l'état
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        cleanState: (state) => {
            cleanDisconnectedAreas(state);
            const stateToSave = validateLoadedState(state);
            localStorage.setItem('areaState', JSON.stringify(stateToSave));
            return stateToSave;
        },
        setAreaToOpen: (state, action: PayloadAction<{
            position: Point;
            area: {
                type: string;
                state: any;
            };
        }>) => {
            state.areaToOpen = action.payload;
        },
        updateAreaToOpenPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
            if (!state.areaToOpen) {
                state.areaToOpen = {
                    position: action.payload,
                    area: {
                        type: 'image-viewer',
                        state: {}
                    }
                };
            } else {
                state.areaToOpen.position = action.payload;
            }
        },
        finalizeAreaPlacement: (state) => {
            if (!state.areaToOpen) return;


            const { position, area } = state.areaToOpen;
            const sourceAreaId = area.state?.sourceId;
            const newAreaId = sourceAreaId || `area-${Date.now()}`;

            // Si c'est un déplacement, on garde l'area source
            if (sourceAreaId && state.areas[sourceAreaId]) {
                // On garde l'area source, mais on vérifie si elle doit être clonée
                if (sourceAreaId !== newAreaId) {
                    state.areas[newAreaId] = {
                        ...state.areas[sourceAreaId],
                        id: newAreaId
                    };
                }
            } else {
                // Sinon on crée une nouvelle area
                state.areas[newAreaId] = {
                    id: newAreaId,
                    type: area.type,
                    state: area.state,
                    position: position,
                    size: { width: 300, height: 200 }
                };
            }

            const rootViewport = getAreaRootViewport();
            const areaToViewport = computeAreaToViewport(
                state.layout,
                state.rootId || '',
                rootViewport,
            );

            const targetAreaId = getHoveredAreaId(Vec2.new(position.x, position.y), state, areaToViewport);

            if (!targetAreaId) {
                // Si la souris n'est pas au-dessus d'une zone, on annule
                state.areaToOpen = null;
                if (!sourceAreaId) {
                    delete state.areas[newAreaId];
                }
                return;
            }

            const viewport = areaToViewport[targetAreaId];
            const placement = getAreaToOpenPlacementInViewport(viewport, Vec2.new(position.x, position.y));

            // Nettoyer l'état de drag
            state.areaToOpen = null;

            // Si c'est un déplacement, on retire d'abord l'élément de sa position d'origine
            if (sourceAreaId) {
                const areaToParentRow = computeAreaToParentRow(state);
                const sourceParentRowId = areaToParentRow[sourceAreaId];

                if (sourceParentRowId) {
                    const sourceParentRow = state.layout[sourceParentRowId] as AreaRowLayout;
                    if (sourceParentRow) {
                        sourceParentRow.areas = sourceParentRow.areas.filter(a => a.id !== sourceAreaId);

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
                    console.error('[areaSlice] finalizeAreaPlacement - ERREUR: Area source introuvable:', newAreaId);
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
                    const areaToParentRow = computeAreaToParentRow(state);
                    const sourceParentRowId = areaToParentRow[newAreaId];

                    if (sourceParentRowId) {
                        const sourceParentRow = state.layout[sourceParentRowId] as AreaRowLayout;

                        if (sourceParentRow && sourceParentRow.areas) {
                            // Filtrer la zone source de sa rangée parente
                            sourceParentRow.areas = sourceParentRow.areas.filter(a => a.id !== newAreaId);

                            // Si la rangée est maintenant vide, la marquer pour suppression
                            if (sourceParentRow.areas.length === 0) {
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
                    if (state.viewports[newAreaId]) {
                        delete state.viewports[newAreaId];
                    }
                }

                // Nettoyage complet et validation de l'état
                validateAndCleanLayout(state);

                // Sauvegarder l'état pour assurer la persistance
                localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));

                return;
            }


            // Vérifier si la zone cible est déjà dans une rangée
            const areaToParentRow = computeAreaToParentRow(state);
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
                    } else {
                        console.log('[areaSlice] finalizeAreaPlacement - Utilisation de layout existant pour:', { sourceAreaId });
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
            const disconnectedAreas = findDisconnectedAreas(state);

            disconnectedAreas.forEach(id => {
                delete state.layout[id];
                delete state.areas[id];
                if (state.viewports[id]) {
                    delete state.viewports[id];
                }
            });
            if (state.activeAreaId && disconnectedAreas.has(state.activeAreaId)) {
                state.activeAreaId = null;
            }

            // Nettoyage complet et validation de l'état
            validateAndCleanLayout(state);

            // Sauvegarder l'état pour assurer la persistance
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        clearAreaToOpen: (state) => {
            state.areaToOpen = null;
        }
    }
});

// Actions
export const {
    addArea,
    removeArea,
    updateArea,
    setActiveArea,
    clearErrors,
    setFields,
    setJoinAreasPreview,
    joinAreas,
    convertAreaToRow,
    insertAreaIntoRow,
    setRowSizes,
    setAreaType,
    setViewports,
    cleanupTemporaryStates,
    resetState,
    setAreaToOpen,
    updateAreaToOpenPosition,
    finalizeAreaPlacement,
    clearAreaToOpen
} = areaSlice.actions;

// Sélecteurs
export const selectAreaState = (state: { area: AreaState }) => state.area;
export const selectAllAreas = (state: { area: AreaState }) => state.area.areas;
export const selectActiveAreaId = (state: { area: AreaState }) => state.area.activeAreaId;
export const selectActiveArea = (state: { area: AreaState }) =>
    state.area.activeAreaId
        ? state.area.areas[state.area.activeAreaId]
        : null;
export const selectAreaById = (id: string) => (state: { area: AreaState }) =>
    state.area.areas[id] || null;
export const selectAreasBySpaceId = (spaceId: string | null) => (state: { area: AreaState }) => {
    const allAreas = state.area.areas;
    return Object.values(allAreas).filter(area => area.spaceId === spaceId);
};
export const selectAreaErrors = (state: { area: AreaState }) => state.area.errors;

// Fonction pour trouver tous les enfants d'une zone récursivement
function findAllChildrenLayouts(
    layoutMap: { [key: string]: AreaLayout | AreaRowLayout },
    rootId: string,
    result: Set<string> = new Set()
): Set<string> {
    const layout = layoutMap[rootId];

    // Si cette zone a déjà été visitée ou n'existe pas
    if (!layout || result.has(rootId)) {
        return result;
    }

    // Ajouter cette zone au résultat
    result.add(rootId);

    // Si c'est une ligne, ajouter tous ses enfants récursivement
    if (layout.type === "area_row") {
        const rowLayout = layout as AreaRowLayout;

        if (rowLayout.areas && Array.isArray(rowLayout.areas)) {
            for (const area of rowLayout.areas) {
                if (area && area.id) {
                    findAllChildrenLayouts(layoutMap, area.id, result);
                }
            }
        }
    }

    return result;
}

// Fonction utilitaire pour nettoyer l'état et supprimer les zones non connectées au root
function cleanDisconnectedAreas(state: AreaState): void {
    // Vérifier que le rootId existe
    if (!state.rootId || !state.layout[state.rootId]) {
        console.error("Root ID invalide dans l'état");
        return;
    }

    // Trouver toutes les zones connectées au root
    const connectedIds = findConnectedIds(state.layout, state.rootId);

    // Trouver les zones déconnectées
    const disconnectedLayoutIds = Object.keys(state.layout).filter(id => !connectedIds.has(id));
    const disconnectedAreaIds = Object.keys(state.areas).filter(id => !connectedIds.has(id));

    if (disconnectedLayoutIds.length > 0 || disconnectedAreaIds.length > 0) {
        // Supprimer les layouts déconnectés
        disconnectedLayoutIds.forEach(id => {
            delete state.layout[id];
        });

        // Supprimer les areas déconnectées
        disconnectedAreaIds.forEach(id => {
            delete state.areas[id];

            // Nettoyer également les viewports associés
            if (state.viewports[id]) {
                delete state.viewports[id];
            }
        });

        // Réinitialiser l'activeAreaId si c'était une zone déconnectée
        if (state.activeAreaId && !connectedIds.has(state.activeAreaId)) {
            state.activeAreaId = null;
        }
    }
}

// Fonction utilitaire pour trouver les zones déconnectées
function findDisconnectedAreas(state: AreaState): Set<string> {
    const connectedAreas = new Set<string>();
    const toVisit = new Set<string>();

    // Commencer par la racine
    if (state.rootId) {
        toVisit.add(state.rootId);
    }

    // Parcourir le layout pour trouver toutes les zones connectées
    while (toVisit.size > 0) {
        const currentId = Array.from(toVisit)[0];
        toVisit.delete(currentId);
        connectedAreas.add(currentId);

        const layout = state.layout[currentId];
        if (layout && layout.type === "area_row") {
            layout.areas.forEach(area => {
                if (!connectedAreas.has(area.id)) {
                    toVisit.add(area.id);
                }
            });
        }
    }

    // Retourner toutes les zones qui ne sont pas connectées
    const allAreas = new Set(Object.keys(state.areas));
    const disconnected = new Set<string>();
    allAreas.forEach(id => {
        if (!connectedAreas.has(id)) {
            disconnected.add(id);
        }
    });

    return disconnected;
}

// Ajouter cette fonction après findDisconnectedAreas
function validateAndCleanLayout(state: AreaState): void {
    // S'assurer que le rootId existe et est valide
    if (!state.rootId || !state.layout[state.rootId]) {
        console.error('[areaSlice] validateAndCleanLayout - rootId invalide ou manquant');
        // Si rootId n'existe pas, on réinitialise tout
        state.layout = {};
        state.areas = {};
        state.viewports = {};
        state.rootId = null;
        state.activeAreaId = null;
        return;
    }

    // 1. Trouver toutes les zones connectées à partir de la racine
    const connectedIds = findConnectedIds(state.layout, state.rootId);

    // 2. Supprimer toutes les zones non connectées
    const idsToRemove: string[] = [];

    // Zones dans le layout mais non connectées
    Object.keys(state.layout).forEach(id => {
        if (!connectedIds.has(id)) {
            idsToRemove.push(id);
        }
    });

    // Zones dans areas mais non connectées
    Object.keys(state.areas).forEach(id => {
        if (!connectedIds.has(id)) {
            idsToRemove.push(id);
        }
    });

    // Supprimer les doublons
    const uniqueIdsToRemove = [...new Set(idsToRemove)];

    if (uniqueIdsToRemove.length > 0) {
        // Supprimer les zones non connectées
        uniqueIdsToRemove.forEach(id => {
            if (state.layout[id]) delete state.layout[id];
            if (state.areas[id]) delete state.areas[id];
            if (state.viewports[id]) delete state.viewports[id];
        });

        // Réinitialiser activeAreaId si nécessaire
        if (state.activeAreaId && uniqueIdsToRemove.includes(state.activeAreaId)) {
            state.activeAreaId = null;
        }
    }

    // 3. Vérifier et corriger les références dans les rangées
    let referencesFixed = false;
    Object.entries(state.layout).forEach(([id, layoutItem]) => {
        if (layoutItem.type === 'area_row') {
            const rowLayout = layoutItem as AreaRowLayout;

            // Filtrer les références invalides
            const originalLength = rowLayout.areas.length;
            rowLayout.areas = rowLayout.areas.filter(area => {
                const isValid = connectedIds.has(area.id);
                if (!isValid) {
                    console.log(`[areaSlice] validateAndCleanLayout - Suppression de référence invalide ${area.id} dans la rangée ${id}`);
                }
                return isValid;
            });

            // Si des références ont été supprimées
            if (rowLayout.areas.length !== originalLength) {
                referencesFixed = true;

                // S'il ne reste plus de zones dans la rangée, elle sera supprimée au prochain nettoyage
                if (rowLayout.areas.length === 0) {
                    console.log(`[areaSlice] validateAndCleanLayout - Rangée ${id} vide, sera supprimée`);
                } else {
                    // Normaliser les tailles
                    const totalSize = rowLayout.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                    if (totalSize > 0) {
                        const factor = 1.0 / totalSize;
                        rowLayout.areas.forEach(area => {
                            area.size = (area.size || 0) * factor;
                        });
                    }
                }
            }
        }
    });

    // 4. Si des références ont été corrigées, relancer la validation pour traiter les cascades
    if (referencesFixed) {
        validateAndCleanLayout(state);
        return;
    }

    // 5. Supprimer explicitement toutes les rangées vides qui pourraient rester
    const emptyRowsToRemove: string[] = [];
    Object.entries(state.layout).forEach(([id, layoutItem]) => {
        if (layoutItem.type === 'area_row') {
            const rowLayout = layoutItem as AreaRowLayout;
            if (!rowLayout.areas || rowLayout.areas.length === 0) {
                emptyRowsToRemove.push(id);
            }
        }
    });

    // Supprimer les rangées vides
    if (emptyRowsToRemove.length > 0) {
        emptyRowsToRemove.forEach(id => {
            delete state.layout[id];
            if (state.viewports[id]) {
                delete state.viewports[id];
            }
        });

        // Après avoir supprimé des rangées vides, vérifier si d'autres références doivent être nettoyées
        validateAndCleanLayout(state);
        return;
    }
}

export default areaSlice.reducer; 
