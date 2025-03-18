import { createSlice } from '@reduxjs/toolkit';

export const historySlice = createSlice({
    name: 'history',
    initialState: {},
    reducers: {
        undo: (state) => {
            // Implémenté via middleware
        },
        redo: (state) => {
            // Implémenté via middleware
        },
    },
});

export const { undo, redo } = historySlice.actions;
export default historySlice.reducer; 
