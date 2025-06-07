import { useKarmycStore } from "../../../src/store/areaStore";
import { areaRegistry } from "../../../src/store/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/actions";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/types/actions";
import { Palette } from "lucide-react";
import { Debug } from "../components/Debug";

export const DebugArea = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleDebugArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'debug-area',
                state: areaRegistry.getInitialState('debug-area')
            });
        }
    };

    // Register area types
    useRegisterAreaType(
        'debug-area',
        Debug,
        {},
        {
            displayName: 'Debug',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.FOLLOW,
            icon: Palette
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-debug-area', handleDebugArea);

    return null

}
