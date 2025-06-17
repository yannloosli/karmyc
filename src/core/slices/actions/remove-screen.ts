import { WritableDraft } from "immer";
import { RootStateType } from "../../store";

export const removeScreen = (set: any) => (screenId: string) => {
    set((state: WritableDraft<RootStateType>) => {
        // Vérifier s'il reste plus d'un écran classique
        const classicIds = Object.keys(state.screens).filter(id => !state.screens[id]?.isDetached);
        if (classicIds.length <= 1 && !state.screens[screenId]?.isDetached) {
            console.warn('Cannot remove the last classic screen');
            return;
        }

        if (!state.screens[screenId]) {
            console.warn(`Attempted to remove non-existent screen ID: ${screenId}`);
            return;
        }

        // Supprimer l'écran
        delete state.screens[screenId];

        // Mettre à jour le compteur d'ID d'écran (max des classiques + 1)
        const maxClassicId = Object.keys(state.screens)
            .filter(id => !state.screens[id]?.isDetached)
            .reduce((max, id) => Math.max(max, parseInt(id)), 0);
        state.nextScreenId = maxClassicId + 1;

        // Si l'écran supprimé était actif, basculer vers le plus petit ID classique restant
        if (state.activeScreenId === screenId) {
            const classicIdsLeft = Object.keys(state.screens)
                .filter(id => !state.screens[id]?.isDetached)
                .sort((a, b) => parseInt(a) - parseInt(b));
            state.activeScreenId = classicIdsLeft[0] || Object.keys(state.screens)[0] || '1';
        }

        // Mettre à jour l'URL si nécessaire
        const url = new URL(window.location.href);
        if (url.searchParams.get('screen') === screenId) {
            url.searchParams.delete('screen');
            window.history.replaceState({}, '', url.toString());
        }

        state.lastUpdated = Date.now();
    })
};
