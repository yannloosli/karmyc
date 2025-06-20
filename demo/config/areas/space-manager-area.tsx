import { useMemo } from "react";
import { useKarmycStore } from "../../../src/core/store";
import { areaRegistry } from "../../../src/core/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/hooks/useRegisterActionHandler";
import { useToolsSlot } from "../../../src/components/ToolsSlot";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { FolderOpenDot } from "lucide-react";
import { SpaceManager } from "../../shared/components/SpaceManager";
import { useSpaceStore } from "../../../src/core/spaceStore";

export const SpaceManagerArea = () => {
    const { updateArea } = useKarmycStore.getState();
    const { registerComponent: registerStatusBar } = useToolsSlot('space-manager-area', 'bottom-outer');
    const spaces = useSpaceStore().getAllSpaces()

    const handleSpaceManagerArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'space-manager-area',
                state: areaRegistry.getInitialState('space-manager-area')
            });
        }
    };

    useMemo(() => {
        registerStatusBar(
            () => <div style={{ color: 'white' }}>{Object.keys(spaces).length} available space{Object.keys(spaces).length > 1 ? 's' : ''}</div>,
            { name: 'bottomOuterSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [registerStatusBar]);


    // Register area types
    useRegisterAreaType(
        'space-manager-area',
        SpaceManager,
        {},
        {
            displayName: 'Space Manager',
            defaultSize: { width: 400, height: 500 },
            supportedActions: ['delete', 'move', 'resize'],
            role: AREA_ROLE.SELF,
            icon: FolderOpenDot
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-space-manager-area', handleSpaceManagerArea);

    return null

}
