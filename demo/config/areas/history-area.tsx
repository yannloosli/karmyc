import { useKarmycStore } from "../../../src/core/data/areaStore";
import { areaRegistry } from "../../../src/core/data/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/core/actions";
import { useAreaKeyboardShortcuts } from "../../../src/core/plugins/keyboard/hooks/useAreaKeyboardShortcuts";
import { EmptyAreaMessage } from "../../../src/areas/components/EmptyAreaMessage";
import { useRegisterAreaType } from "../../../src/areas/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { CircleSlash } from "lucide-react";
import { History } from "../components/History";

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
