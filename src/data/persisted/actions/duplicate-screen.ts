import { WritableDraft } from "immer";
import { RootStateType } from "../../mainStore";

export const duplicateScreen = (set: any) => (screenId: string) => {
    set((state: WritableDraft<RootStateType>) => {
        if (!state.screens[screenId]) {
            console.warn(`Attempted to duplicate non-existent screen ID: ${screenId}`);
            return;
        }

        const newScreenId = state.nextScreenId.toString();
        const sourceScreen = state.screens[screenId];

        // Créer une copie profonde de l'écran source
        state.screens[newScreenId] = JSON.parse(JSON.stringify(sourceScreen));

        // Mettre à jour le compteur d'ID d'écran et l'écran actif
        state.nextScreenId += 1;
        state.activeScreenId = newScreenId;
        state.lastUpdated = Date.now();
    })
};
