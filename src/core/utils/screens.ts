import { initialState } from "../slices/areas-slice";
import { ScreenState } from "../slices/screens-slice";


// --- Helper function to generate the initial state for a new screen ---
export const createInitialScreenState = (): ScreenState => {
    // Deep copy only the DATA part for initialization
    return JSON.parse(JSON.stringify({
        areas: initialState,
        isDetached: false,
        detachedFromAreaId: null,
        isLocked: false
    }));
};
