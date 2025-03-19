import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AreaType } from '../../constants';
import { Area, AreaLayout, AreaRowLayout, AreaToOpen } from '../../types/areaTypes';
import { CardinalDirection } from '../../types/directions';
import { Rect } from '../../types/geometry';
import { computeAreaToParentRow } from '../../utils/areaToParentRow';
import { areaToRow } from '../../utils/areaToRow';
import { joinAreas as joinAreasUtil } from '../../utils/joinArea';
import { validateArea } from '../../utils/validation';
import { areaInitialStates } from '../initialStates';
import { areaStateReducerRegistry } from '../registries/areaRegistry';

// Fonction pour valider et nettoyer l'état chargé
function validateLoadedState(state: Partial<AreaState>): AreaState {
    const defaultState: AreaState = {
        _id: 0,
        errors: [],
        activeAreaId: null,
        layout: {
            "0": {
                type: "area",
                id: "0",
            },
        },
        areas: {
            "0": {
                id: "0",
                type: AreaType.Project,
                state: areaInitialStates[AreaType.Project],
            },
        },
        viewports: {},
        joinPreview: null,
        rootId: "0",
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
                type: area.type || AreaType.Project,
                state: area.state || areaInitialStates[area.type || AreaType.Project],
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

    return {
        ...defaultState,
        _id: Math.max(maxId, defaultState._id),
        layout: validatedLayout,
        areas: validatedAreas,
        rootId: state.rootId || defaultState.rootId,
    };
}

export interface AreaState {
    _id: number;
    rootId: string;
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
        [key: string]: Area<AreaType>;
    };
    viewports: {
        [key: string]: Rect;
    };
    areaToOpen: null | AreaToOpen;
}

// Charger et nettoyer l'état initial depuis le localStorage
const savedState = localStorage.getItem('areaState');
const initialState: AreaState = savedState ? validateLoadedState(JSON.parse(savedState)) : validateLoadedState({});

export const areaSlice = createSlice({
    name: 'area',
    initialState,
    reducers: {
        addArea: (state, action: PayloadAction<Area<AreaType>>) => {
            const validation = validateArea(action.payload);
            if (!validation.isValid) {
                state.errors = validation.errors;
                return;
            }
            const newId = (++state._id).toString();
            state.areas[newId] = {
                ...action.payload,
                state: action.payload.state || areaInitialStates[action.payload.type],
            };
            state.errors = [];
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        removeArea: (state, action: PayloadAction<string>) => {
            const areaId = action.payload;
            delete state.areas[areaId];
            if (state.activeAreaId === areaId) {
                state.activeAreaId = null;
            }
            state.errors = [];
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        updateArea: (state, action: PayloadAction<{ id: string; changes: Partial<Area<AreaType>> }>) => {
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

            console.log('=== Début fusion dans le reducer ===', {
                rowId,
                mergeArea,
                mergeInto,
                row
            });

            if (!row || !row.areas) {
                state.errors = ['Ligne invalide pour la fusion'];
                return;
            }

            try {
                const result = joinAreasUtil(row, mergeArea, mergeInto);
                console.log('Résultat joinAreasUtil:', result);

                const { area, removedAreaId } = result;
                const shouldRemoveRow = row.areas.length === 2;
                const areaToParentRow = computeAreaToParentRow(state);

                // Conserver le type de la zone source
                const sourceAreaId = row.areas[mergeArea].id;
                const sourceArea = state.areas[sourceAreaId];

                console.log('État avant mise à jour:', {
                    shouldRemoveRow,
                    sourceAreaId,
                    sourceArea,
                    areaToParentRow,
                    currentLayout: state.layout
                });

                if (shouldRemoveRow && state.rootId === row.id) {
                    state.rootId = area.id;
                }

                // Mettre à jour le layout
                Object.keys(state.layout).forEach((id) => {
                    if (id === removedAreaId || (shouldRemoveRow && id === row.id)) {
                        console.log(`Suppression du layout ${id}`);
                        delete state.layout[id];
                        return;
                    }

                    if (id === areaToParentRow[row.id]) {
                        const parentRow = state.layout[id] as AreaRowLayout;
                        console.log(`Mise à jour de la ligne parente ${id}:`, parentRow);
                        parentRow.areas = parentRow.areas.map((x) =>
                            x.id === row.id ? { id: area.id, size: x.size } : x
                        );
                    } else if (id === row.id) {
                        console.log(`Mise à jour de la ligne ${id} avec:`, area);
                        // Mettre à jour la ligne avec la nouvelle zone
                        state.layout[id] = area;
                    } else if (id === area.id) {
                        console.log(`Mise à jour de la zone ${id} avec:`, area);
                        state.layout[id] = area;
                    }
                });

                // Mettre à jour la zone résultante avec le type de la source
                state.areas[area.id] = {
                    ...sourceArea,
                    id: area.id
                };

                console.log('État après mise à jour:', {
                    newLayout: state.layout,
                    newAreas: state.areas,
                    newRootId: state.rootId
                });

                // Supprimer la zone fusionnée
                delete state.areas[removedAreaId];
                state.joinPreview = null;
                state.errors = [];

                // Sauvegarder l'état après la fusion
                const stateToSave = validateLoadedState(state);
                console.log('État à sauvegarder:', stateToSave);
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

            // S'assurer que l'area d'origine a un type
            if (!state.areas[areaId] || state.areas[areaId].type === undefined) {
                state.areas[areaId] = {
                    ...state.areas[areaId],
                    type: AreaType.Project,
                    state: areaInitialStates[AreaType.Project]
                };
            }

            // Renommer et déplacer l'ancienne zone en s'assurant qu'elle a un type
            state.areas[idForOldArea] = {
                ...state.areas[areaId],
                type: state.areas[areaId].type || AreaType.Project,
                state: state.areas[areaId].state || areaInitialStates[state.areas[areaId].type || AreaType.Project]
            };

            state.areas[idForNewArea] = {
                ...state.areas[areaId],
                type: state.areas[areaId].type || AreaType.Project,
                state: state.areas[areaId].state || areaInitialStates[state.areas[areaId].type || AreaType.Project]
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

            // Sauvegarder l'état après la conversion
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        insertAreaIntoRow: (state, action: PayloadAction<{
            rowId: string;
            area: Area<AreaType>;
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

            // Sauvegarder l'état après la modification des tailles
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        setAreaType: (state, action: PayloadAction<{
            areaId: string;
            type: AreaType;
            initialState?: any;
        }>) => {
            const { areaId, type, initialState: initState } = action.payload;
            const area = state.areas[areaId];

            state.areas[areaId] = {
                ...area,
                type,
                state: initState || areaInitialStates[type],
            };

            // Sauvegarder l'état après le changement de type
            localStorage.setItem('areaState', JSON.stringify(validateLoadedState(state)));
        },
        dispatchToAreaState: (state, action: PayloadAction<{
            areaId: string;
            action: any;
        }>) => {
            const { areaId, action: areaAction } = action.payload;
            const area = state.areas[areaId];
            const reducer = areaStateReducerRegistry[area.type];

            if (reducer) {
                state.areas[areaId] = {
                    ...area,
                    state: reducer(area.state, areaAction),
                };
            }
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
                state: areaInitialStates[sourceArea.type]
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
    },
});

// Actions
export const { addArea, removeArea, updateArea, setActiveArea, clearErrors, setFields, setJoinAreasPreview, joinAreas, convertAreaToRow, insertAreaIntoRow, setRowSizes, setAreaType, dispatchToAreaState, setViewports, cleanupTemporaryStates, resetState } = areaSlice.actions;

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

export default areaSlice.reducer; 
