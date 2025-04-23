import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Assumons que l'interface Line est définie ici ou importée
// Si elle vient de HistoryDrawingArea, il faudra ajuster l'import
interface Line {
    id: string;
    points: { x: number; y: number }[];
    color: string;
    width: number;
}

export interface SpaceSharedState {
    color?: string;
    // Nouveaux champs pour le dessin
    drawingLines?: Line[];
    drawingStrokeWidth?: number;
    [key: string]: any; // Pour autres états partagés
}

export interface Space {
    id: string;
    name: string;
    sharedState: SpaceSharedState; // Utiliser le type défini
}

export interface SpaceState {
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
}

const initialState: SpaceState = {
    spaces: {},
    activeSpaceId: null
};

export const spaceSlice = createSlice({
    name: 'space',
    initialState,
    reducers: {
        addSpace: (state, action: PayloadAction<Omit<Space, 'id' | 'sharedState'> & { id?: string, sharedState?: Partial<SpaceSharedState> }>) => {
            const id = action.payload.id || `space-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            // Initialiser sharedState avec les valeurs par défaut pour le dessin si non fourni
            const initialSharedState: SpaceSharedState = {
                drawingLines: [],
                drawingStrokeWidth: 3,
                ...action.payload.sharedState // Permet de surcharger via payload
            };
            state.spaces[id] = {
                name: action.payload.name,
                sharedState: initialSharedState,
                id
            };
            if (Object.keys(state.spaces).length === 1) {
                state.activeSpaceId = id;
            }
            // return state; // Inutile avec Immer
        },
        removeSpace: (state, action: PayloadAction<string>) => {
            const id = action.payload;
            if (state.spaces[id]) {
                delete state.spaces[id];
                if (state.activeSpaceId === id) {
                    const spaceIds = Object.keys(state.spaces);
                    state.activeSpaceId = spaceIds.length > 0 ? spaceIds[0] : null;
                }
            }
        },
        setActiveSpace: (state, action: PayloadAction<string | null>) => {
            state.activeSpaceId = action.payload;
        },
        // Renommé pour clarté
        updateSpaceGenericSharedState: (state, action: PayloadAction<{
            spaceId: string;
            changes: Partial<SpaceSharedState>; // Peut mettre à jour n'importe quelle partie
        }>) => {
            const { spaceId, changes } = action.payload;
            if (state.spaces[spaceId]) {
                // S'assurer que sharedState existe
                if (!state.spaces[spaceId].sharedState) {
                    state.spaces[spaceId].sharedState = {};
                }
                state.spaces[spaceId].sharedState = {
                    ...state.spaces[spaceId].sharedState,
                    ...changes
                };
            }
        },
        // Nouvelle action spécifique pour ajouter une ligne
        addDrawingLineToSpace: (state, action: PayloadAction<{ spaceId: string; line: Line }>) => {
            const { spaceId, line } = action.payload;
            if (state.spaces[spaceId]?.sharedState) {
                // Initialiser drawingLines si nécessaire
                if (!state.spaces[spaceId].sharedState.drawingLines) {
                    state.spaces[spaceId].sharedState.drawingLines = [];
                }
                state.spaces[spaceId].sharedState.drawingLines?.push(line);
            } else if (state.spaces[spaceId]) { // Si sharedState n'existait pas du tout
                state.spaces[spaceId].sharedState = { drawingLines: [line] };
            }
        },
        // Nouvelle action spécifique pour définir toutes les lignes (utile pour undo/redo ou clear)
        setDrawingLinesForSpace: (state, action: PayloadAction<{ spaceId: string; lines: Line[] }>) => {
            const { spaceId, lines } = action.payload;
            if (state.spaces[spaceId]?.sharedState) {
                state.spaces[spaceId].sharedState.drawingLines = lines;
            } else if (state.spaces[spaceId]) { // Si sharedState n'existait pas du tout
                state.spaces[spaceId].sharedState = { drawingLines: lines };
            }
        },
        // Nouvelle action spécifique pour l'épaisseur
        setDrawingStrokeWidthForSpace: (state, action: PayloadAction<{ spaceId: string; width: number }>) => {
            const { spaceId, width } = action.payload;
            if (state.spaces[spaceId]?.sharedState) {
                state.spaces[spaceId].sharedState.drawingStrokeWidth = width;
            } else if (state.spaces[spaceId]) { // Si sharedState n'existait pas du tout
                state.spaces[spaceId].sharedState = { drawingStrokeWidth: width };
            }
        },
        // updateSpace reste inchangé pour le nom etc.
        updateSpace: (state, action: PayloadAction<{ id: string; changes: Partial<Omit<Space, 'id' | 'sharedState'>>; }>) => {
            const { id, changes } = action.payload;
            if (state.spaces[id]) {
                state.spaces[id] = {
                    ...state.spaces[id],
                    ...changes
                };
            }
        }
    }
});

// Exporter les nouvelles actions
export const {
    addSpace, removeSpace, setActiveSpace,
    updateSpaceGenericSharedState, // Action générique renommée
    addDrawingLineToSpace, setDrawingLinesForSpace, setDrawingStrokeWidthForSpace, // Actions spécifiques au dessin
    updateSpace
} = spaceSlice.actions;

// Assurez-vous que RootState est importé ou défini correctement pour le sélecteur
// import { RootState } from '../index'; // ou chemin correct
type RootState = any; // Placeholder si RootState n'est pas facilement importable ici

// Sélecteurs existants...
export const selectAllSpaces = (state: RootState) => state.space.spaces;
export const selectActiveSpaceId = (state: RootState) => state.space.activeSpaceId;
export const selectActiveSpace = (state: RootState) =>
    state.space.activeSpaceId ? state.space.spaces[state.space.activeSpaceId] : null;
export const selectSpaceById = (id: string) => (state: RootState) =>
    id ? state.space.spaces[id] : null;

// Ajouter des sélecteurs spécifiques si nécessaire, ex:
export const selectSpaceSharedState = (spaceId: string | null) => (state: RootState): SpaceSharedState | null =>
    spaceId ? state.space.spaces[spaceId]?.sharedState ?? null : null;

export default spaceSlice.reducer; 
