import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AreaReducerState, AreaToOpen } from "~/types/areaTypes";
import { RootState } from "../store";

const initialState: AreaReducerState = {
    areas: {},
    layout: {},
    areaToOpen: null,
};

const areaSlice = createSlice({
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
    },
});

export const { setAreaToOpen, updateAreas, updateLayout } = areaSlice.actions;

export const selectAreaState = (state: RootState) => state.area;
export const selectAreaToOpen = (state: RootState) => state.area.areaToOpen;
export const selectAreas = (state: RootState) => state.area.areas;
export const selectLayout = (state: RootState) => state.area.layout;

export default areaSlice.reducer; 
