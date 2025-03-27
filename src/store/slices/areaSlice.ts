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
import { Vec2 } from '../../utils/math/vec2';
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
console.log('Chargement initial - État sauvegardé:', savedState ? JSON.parse(savedState) : null);

const initialState: AreaState = savedState ? validateLoadedState(JSON.parse(savedState)) : validateLoadedState({});
console.log('Chargement initial - État validé:', initialState);

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

            if (parentRowId) {
                const parentRow = state.layout[parentRowId] as AreaRowLayout;
                if (parentRow && parentRow.areas) {
                    // Trouver l'index de la zone à supprimer
                    const targetIndex = parentRow.areas.findIndex(a => a.id === areaId);
                    if (targetIndex !== -1) {
                        // Supprimer la zone de la rangée
                        parentRow.areas.splice(targetIndex, 1);

                        // Ne redimensionner que si c'est une feuille (pas une rangée)
                        if (state.layout[areaId]?.type === "area") {
                            // Trouver les zones siblings (même rangée, même orientation)
                            const siblings = parentRow.areas.filter(a =>
                                state.layout[a.id]?.type === "area"
                            );

                            if (siblings.length > 0) {
                                // Calculer la taille totale des siblings
                                const totalSize = siblings.reduce((acc, a) => acc + (a.size || 0), 0);
                                if (totalSize > 0) {
                                    const factor = 1.0 / totalSize;
                                    // Redimensionner uniquement les siblings
                                    siblings.forEach(area => {
                                        area.size = (area.size || 0) * factor;
                                    });
                                }
                            }
                        }
                    }
                }
            }

            // Supprimer la zone
            delete state.areas[areaId];
            if (state.activeAreaId === areaId) {
                state.activeAreaId = null;
            }
            state.errors = [];
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
                console.warn('updateAreaToOpenPosition appelé sans areaToOpen actif, initialisation...');
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

            console.log('finalizeAreaPlacement - Début:', {
                state,
                areaToOpen: state.areaToOpen
            });

            const { position, area } = state.areaToOpen;
            const sourceAreaId = area.state?.sourceId;
            const newAreaId = sourceAreaId || `area-${Date.now()}`;

            // Si c'est un déplacement, on garde l'area source
            let newArea: Area<AreaTypeValue>;
            if (sourceAreaId && state.areas[sourceAreaId]) {
                newArea = state.areas[sourceAreaId];
            } else {
                // Sinon on crée une nouvelle area
                newArea = {
                    id: newAreaId,
                    type: area.type,
                    state: area.state,
                    position: position,
                    size: { width: 300, height: 200 }
                };
                state.areas[newAreaId] = newArea;
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
                    const sourceIndex = sourceParentRow.areas.findIndex(a => a.id === sourceAreaId);
                    if (sourceIndex !== -1) {
                        // Retirer l'élément de sa position d'origine
                        sourceParentRow.areas.splice(sourceIndex, 1);

                        // Si la row source ne contient plus qu'un élément, la convertir en zone simple
                        if (sourceParentRow.areas.length === 1) {
                            const lastAreaId = sourceParentRow.areas[0].id;
                            const lastArea = state.areas[lastAreaId];
                            const lastAreaLayout = state.layout[lastAreaId];

                            // Mettre à jour les références dans le parent de la source
                            const sourceGrandParentRowId = areaToParentRow[sourceParentRowId];
                            if (sourceGrandParentRowId) {
                                const sourceGrandParentRow = state.layout[sourceGrandParentRowId] as AreaRowLayout;
                                const sourceParentIndex = sourceGrandParentRow.areas.findIndex(a => a.id === sourceParentRowId);
                                if (sourceParentIndex !== -1) {
                                    sourceGrandParentRow.areas[sourceParentIndex] = {
                                        id: lastAreaId,
                                        size: sourceGrandParentRow.areas[sourceParentIndex].size
                                    };
                                }
                            } else if (state.rootId === sourceParentRowId) {
                                // Si c'était la root, mettre à jour le rootId
                                state.rootId = lastAreaId;
                            }

                            // Supprimer l'ancienne row
                            delete state.layout[sourceParentRowId];
                        } else {
                            // Redistribuer les tailles des zones restantes
                            const totalSize = sourceParentRow.areas.reduce((acc, a) => acc + a.size, 0);
                            if (totalSize > 0) {
                                sourceParentRow.areas.forEach(a => {
                                    a.size = a.size / totalSize;
                                });
                            }
                        }
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
                // Remplacer la zone existante
                state.areas[targetAreaId] = newArea;
                cleanDisconnectedAreas(state);
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

                    // Si c'est un déplacement, on doit gérer différemment l'insertion
                    if (sourceAreaId) {
                        // S'assurer que la zone source existe dans le layout
                        if (!state.layout[sourceAreaId]) {
                            state.layout[sourceAreaId] = { type: "area", id: sourceAreaId };
                        }

                        // On insère directement la zone existante
                        parentRow.areas.splice(insertIndex, 0, {
                            id: sourceAreaId,
                            size: newSize
                        });

                        // Redistribuer les tailles pour s'assurer qu'elles sont correctes
                        const totalSize = parentRow.areas.reduce((acc, a) => acc + (a.size || 0), 0);
                        if (Math.abs(totalSize - 1.0) > 0.001) {
                            const factor = 1.0 / totalSize;
                            parentRow.areas.forEach(area => {
                                area.size = (area.size || 0) * factor;
                            });
                        }
                    } else {
                        // Pour une nouvelle zone
                        parentRow.areas.splice(insertIndex, 0, {
                            id: newAreaId,
                            size: newSize
                        });
                        // Ajouter l'entrée de layout pour la nouvelle area
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
            cleanDisconnectedAreas(state);
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

export default areaSlice.reducer; 
