import { useKarmycStore } from "../../../src/core/store";
import { areaRegistry } from "../../../src/core/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/hooks/useRegisterActionHandler";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { CircleSlash } from "lucide-react";
import { Draw } from "../components/Draw";

export const DrawArea = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleDrawArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'draw-area',
                state: areaRegistry.getInitialState('draw-area')
            });
        }
    };




    useRegisterAreaType(
        'draw-area',
        Draw,
        {},
        {
            displayName: 'Simple draw',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD,
            icon: CircleSlash,
            supportFullscreen: true
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-draw-area', handleDrawArea);

    return null

}
