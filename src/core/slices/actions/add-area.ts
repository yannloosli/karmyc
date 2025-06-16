import { AreaTypeValue } from "../../types/actions";
import { IArea } from "../../../types/areaTypes";
import { WritableDraft } from "immer";
import { v4 as uuidv4 } from 'uuid';
import { areaRegistry } from "../../registries/areaRegistry";
import { AREA_ROLE } from "../../types/actions";
import { useSpaceStore } from "../../spaceStore";
import { RootStateType } from "../../store";
import { validateArea } from '../../utils/validation';


export const addArea = (set: any) => (area: IArea<AreaTypeValue>) => {
    let generatedAreaId = '';
            set((state: WritableDraft<RootStateType>) => {
                const activeScreenAreas = state.screens[state.activeScreenId]?.areas;
                if (!activeScreenAreas) return;
                const areaId = area.id || uuidv4();
                let role = undefined;
                if (area.type) {
                    const _roleMap = (areaRegistry as any)._roleMap || {};
                    role = _roleMap[area.type];
                }
                const areaWithId = {
                    ...area,
                    id: areaId,
                    role,
                };

                // Si c'est une area LEAD sans espace, on lui en assigne un
                if (role === AREA_ROLE.LEAD && !areaWithId.spaceId) {
                    const spaces = useSpaceStore.getState().spaces;
                    const existingSpaces = Object.keys(spaces);
                    if (existingSpaces.length > 0) {
                        // Utiliser le dernier espace actif ou le premier disponible
                        const activeSpaceId = useSpaceStore.getState().activeSpaceId;
                        areaWithId.spaceId = activeSpaceId || existingSpaces[0];
                    } else {
                        // Créer un nouvel espace seulement s'il n'y en a aucun
                        const newSpaceId = useSpaceStore.getState().addSpace({
                            name: `Space for ${area.type}`,
                            sharedState: {}
                        });
                        if (newSpaceId) {
                            areaWithId.spaceId = newSpaceId;
                        }
                    }
                }
                const validation = validateArea(areaWithId);
                if (!validation.isValid) {
                    activeScreenAreas.errors = validation.errors;
                    console.error("Validation failed for area:", validation.errors);
                } else {
                    activeScreenAreas.areas[areaId] = areaWithId;
                    activeScreenAreas._id += 1;
                    activeScreenAreas.errors = [];
                    generatedAreaId = areaId;
                    state.lastUpdated = Date.now();
                }
            });

            return generatedAreaId;

        }
