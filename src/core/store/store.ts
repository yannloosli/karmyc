import { configureStore } from "@reduxjs/toolkit";
import areaReducer from "./slices/area";

export const store = configureStore({
    reducer: {
        area: areaReducer,
    },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 
