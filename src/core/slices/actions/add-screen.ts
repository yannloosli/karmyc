import { WritableDraft } from "immer";
import { createInitialScreenState } from "../../utils/screens";
import { RootStateType } from "../../store";

export const addScreen = (set: any) => () => {
    set((state: WritableDraft<RootStateType>) => {
        const newScreenId = state.nextScreenId.toString();

        // 1. Créer l'écran avec un état initial vide (ou basé sur createInitialScreenState)
        state.screens[newScreenId] = createInitialScreenState();

        // 2. Ajouter une zone par défaut et configurer le layout pour ce nouvel écran
        const defaultAreaId = `area-default-${newScreenId}-0`; // ID unique pour la zone par défaut
        const newScreenAreasState = state.screens[newScreenId].areas;

        // Ajouter la zone par défaut
        newScreenAreasState.areas[defaultAreaId] = {
            id: defaultAreaId,
            type: 'text-note', // Ou un autre type par défaut
            state: { content: 'New Screen' } // Contenu initial
        };

        // Configurer le layout et rootId pour cette seule zone
        newScreenAreasState.layout = {
            [defaultAreaId]: { type: 'area', id: defaultAreaId } // Layout simple pour la zone
        };
        newScreenAreasState.rootId = defaultAreaId; // La zone est la racine
        newScreenAreasState._id = 1; // Le compteur interne de cet écran est à 1
        newScreenAreasState.activeAreaId = defaultAreaId; // Rendre la zone active par défaut

        // 3. Mettre à jour le compteur d'ID d'écran et l'écran actif
        state.nextScreenId += 1;
        state.activeScreenId = newScreenId;
        state.lastUpdated = Date.now();
    });
};
