import { AreaRowLayout } from "../../../types/areaTypes";
import { WritableDraft } from "immer";
import { RootStateType } from "../../mainStore";
import { toolsEventBus } from "../../utils/toolsEventBus";


export const removeArea = (set: any) => (id: string) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;

        // Vérifier si c'est la dernière area du screen
        const areaCount = Object.keys(activeScreenAreas.areas).length;
        if (areaCount <= 1) {
            console.warn('Cannot remove the last area of a screen');
            return;
        }

        // Supprimer l'area des données
        delete activeScreenAreas.areas[id];

        // Supprimer l'area du layout
        delete activeScreenAreas.layout[id];

        // Nettoyer les références à cette area dans les rows
        for (const layoutId in activeScreenAreas.layout) {
            const item = activeScreenAreas.layout[layoutId];
            if (item.type === 'area_row') {
                const row = item as AreaRowLayout;
                const areaIndex = row.areas.findIndex(a => a.id === id);
                if (areaIndex !== -1) {
                    row.areas.splice(areaIndex, 1);
                    // --- Correction spécifique pour les stacks ---
                    if (row.orientation === 'stack') {
                        // Si l'area supprimée était l'activeTabId, choisir un nouvel onglet actif
                        if (row.activeTabId === id) {
                            row.activeTabId = row.areas[0]?.id || undefined;
                        }
                        // Si le stack est vide, le supprimer
                        if (row.areas.length === 0) {
                            delete activeScreenAreas.layout[layoutId];
                        }
                        // Si le stack n'a plus qu'une seule area, le "déstacker"
                        else if (row.areas.length === 1) {
                            const parentRowId = Object.keys(activeScreenAreas.layout).find(parentId => {
                                const parent = activeScreenAreas.layout[parentId];
                                return parent.type === 'area_row' && (parent as AreaRowLayout).areas.some(a => a.id === layoutId);
                            });
                            if (parentRowId) {
                                const parent = activeScreenAreas.layout[parentRowId] as AreaRowLayout;
                                const idx = parent.areas.findIndex(a => a.id === layoutId);
                                if (idx !== -1) {
                                    // Remplacer le stack par l'unique area restante
                                    parent.areas[idx] = { ...row.areas[0] };
                                }
                                delete activeScreenAreas.layout[layoutId];
                            } else if (activeScreenAreas.rootId === layoutId) {
                                // Si le stack est root, remplacer rootId par l'unique area
                                activeScreenAreas.rootId = row.areas[0].id;
                                delete activeScreenAreas.layout[layoutId];
                            }
                        }
                    }
                    // Si le row est vide (non stack), le supprimer
                    else if (row.areas.length === 0) {
                        delete activeScreenAreas.layout[layoutId];
                    }
                }
            }
        }

        // Mettre à jour rootId si nécessaire
        if (activeScreenAreas.rootId === id) {
            activeScreenAreas.rootId = null;
        }
        if (activeScreenAreas.activeAreaId === id) {
            activeScreenAreas.activeAreaId = null;
        }
        activeScreenAreas.errors = [];
        state.lastUpdated = Date.now();
        toolsEventBus.publish({ type: 'cleanup', areaId: id });
    })
}
