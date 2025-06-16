import { WritableDraft } from "immer";
import { IArea } from "../../../types/areaTypes";
import { toolsEventBus } from "../../utils/toolsEventBus";
import { RootStateType } from "../../store";
import { AreaTypeValue } from "../../types/actions";


export const updateArea = (set: any) => (areaData: Partial<IArea<AreaTypeValue>> & { id: string }) => {
    set((state: WritableDraft<RootStateType>) => {
        const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
        if (!activeScreenAreas) return;
        const area = activeScreenAreas.areas[areaData.id];
        if (area) {
            const newRole = areaData.role;
            if (newRole && newRole !== area.role) {
                // On nettoie d'abord les outils pour cette zone
                toolsEventBus.publish({ type: 'cleanup', areaId: area.id });
            }
            
            // On applique les autres mises à jour
            Object.assign(area, areaData, { role: newRole });
        }
    })
}
