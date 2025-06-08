import { useKarmycStore } from "../../../src/store/areaStore";
import { areaRegistry } from "../../../src/store/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/actions";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/types/actions";
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
