import { WritableDraft } from "immer";
import { RootStateType } from "../../store";

export const switchScreen = (set: any) => (screenId: string) => {
    set((state: WritableDraft<RootStateType>) => {
        if (state.screens[screenId] && state.activeScreenId !== screenId) {
            state.activeScreenId = screenId;
            state.lastUpdated = Date.now();
        } else if (!state.screens[screenId]) {
            console.warn(`Attempted to switch to non-existent screen ID: ${screenId}`);
        }
    });
};
