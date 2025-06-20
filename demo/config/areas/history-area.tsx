import { useKarmycStore } from "../../../src/core/store";
import { areaRegistry } from "../../../src/core/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/hooks/useRegisterActionHandler";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { CircleSlash } from "lucide-react";
import { History } from "../../shared/components/History";

export const HistoryArea = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleHistoryArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'history-area',
                state: areaRegistry.getInitialState('history-area')
            });
        }
    };

    // Register area types
    useRegisterAreaType(
        'history-area',
        History,
        {},
        {
            displayName: 'History',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.FOLLOW,
            icon: CircleSlash
        }
    );

    // Register action handlers
    useRegisterActionHandler('area.create-history-area', handleHistoryArea);

    return null

}
