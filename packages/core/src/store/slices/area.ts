import { AreaReducerState, AreaToOpen } from "@gamesberry/karmyc-core/types/areaTypes";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

const initialState: AreaReducerState = {
    areas: {},
    layout: {},
    areaToOpen: null,
    rootId: null,
};

export const areaSlice = createSlice({
    name: "area",
    initialState,
    reducers: {
        setAreaToOpen: (state, action: PayloadAction<AreaToOpen | null>) => {
            state.areaToOpen = action.payload;
        },
        updateAreas: (state, action: PayloadAction<{ [key: string]: any }>) => {
            state.areas = action.payload;
        },
        updateLayout: (state, action: PayloadAction<{ [key: string]: { type: string } }>) => {
            state.layout = action.payload;
        },
        setRootId: (state, action: PayloadAction<string | null>) => {
            state.rootId = action.payload;
        },
    },
});

export const { setAreaToOpen, updateAreas, updateLayout, setRootId } = areaSlice.actions;

export const selectAreaState = (state: RootState) => state.area;
export const selectAreaToOpen = (state: RootState) => state.area.areaToOpen;
export const selectAreas = (state: RootState) => state.area.areas;
export const selectLayout = (state: RootState) => state.area.layout;
export const selectRootId = (state: RootState) => state.area.rootId;

export default areaSlice.reducer; 
