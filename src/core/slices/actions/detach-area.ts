import { WritableDraft } from "immer";
import { RootStateType } from "../../store";
import { createInitialScreenState } from "../../utils/screens";
import { simplifyLayoutNodeIfNeeded } from "../../utils/areas";

export const detachArea = (set: any) => (areaId: string) => {
    set((state: WritableDraft<RootStateType>) => {
                    const area = state.getAreaById(areaId);
        if (!area) {
            console.warn(`Area ${areaId} not found`);
            return;
        }

        const newScreenId = `detached-${state.nextScreenId}`;
        state.nextScreenId += 1;

        // Créer un nouveau screen détaché
        state.screens[newScreenId] = {
            ...createInitialScreenState(),
            areas: {
                ...createInitialScreenState().areas
            },
            isDetached: true,
            detachedFromAreaId: areaId
        };

        // Copier l'area dans le nouveau screen
        const newScreenAreasState = state.screens[newScreenId].areas;
        newScreenAreasState.areas[areaId] = { ...area };
        newScreenAreasState.layout = {
            [areaId]: { type: 'area', id: areaId }
        };
        newScreenAreasState.rootId = areaId;
        newScreenAreasState.activeAreaId = areaId;

        // Supprimer l'area du screen d'origine (areas et layout)
        const originScreen = state.screens[state.activeScreenId];
        if (originScreen) {
            // Supprimer l'area de la map
            delete originScreen.areas.areas[areaId];
            // Supprimer la référence dans le layout
            for (const key in originScreen.areas.layout) {
                const item = originScreen.areas.layout[key];
                if (item.type === 'area_row') {
                    item.areas = item.areas.filter((a: any) => a.id !== areaId);
                }
            }
            // Supprimer l'entrée de layout si c'est un node direct
            delete originScreen.areas.layout[areaId];
            // Nettoyer le rootId si besoin
            if (originScreen.areas.rootId === areaId) {
                originScreen.areas.rootId = null;
            }
            // Automatic simplification of rows after detachment
            for (const key in originScreen.areas.layout) {
                const item = originScreen.areas.layout[key];
                if (item.type === 'area_row' && item.areas.length === 1) {
                    simplifyLayoutNodeIfNeeded(originScreen.areas, key);
                }
            }
        }

        // Ouvrir dans une nouvelle fenêtre sans navigation
        const features = [
            'width=800',
            'height=600',
            'menubar=no',
            'toolbar=no',
            'location=no',
            'status=no',
            'scrollbars=yes',
            'resizable=yes'
        ].join(',');
        window.open(`?screen=${newScreenId}`, newScreenId, features);
        state.lastUpdated = Date.now();
    })
};
