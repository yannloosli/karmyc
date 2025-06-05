import { useMemo } from "react";
import { useKarmycStore } from "../../../src/core/data/areaStore";
import { areaRegistry } from "../../../src/core/data/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/core/actions";
import { useAreaKeyboardShortcuts } from "../../../src/core/plugins/keyboard/hooks/useAreaKeyboardShortcuts";
import { useToolsSlot } from "../../../src/tools/components/ToolsSlot";
import { EmptyAreaMessage } from "../../../src/areas/components/EmptyAreaMessage";
import { useRegisterAreaType } from "../../../src/areas/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { CircleSlash, Keyboard } from "lucide-react";
import KeyboardShortcutsViewer from "../../../src/core/ui/KeyboardShortcutsViewer";

export const KeyboardShortcutsArea = () => {
    const { updateArea } = useKarmycStore.getState();
    const { registerComponent: registerRootMenuDemoArea } = useToolsSlot('demo-area', 'top-inner');

    const handleKeyboardShortcutsArea = (params: any) => {
        const areaId = params.areaId || params.itemMetadata?.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'keyboard-shortcuts-area',
                state: areaRegistry.getInitialState('keyboard-shortcuts-area')
            });
        }
    };

    useMemo(() => {
        registerRootMenuDemoArea(
            () => <div>Top Demo Area center slot</div>,
            { name: 'topOuterSlot', type: 'menu' },
            { order: 990, width: 'auto', alignment: 'center' }
        );
    }, [registerRootMenuDemoArea]);


    // Register area types
    useRegisterAreaType(
        'keyboard-shortcuts-area',
        KeyboardShortcutsViewer,
        {},
        {
            displayName: 'Raccourcis Clavier',
            defaultSize: { width: 400, height: 600 },
            role: AREA_ROLE.SELF,
            icon: Keyboard
        }
    );

    // Register action handlers
    useRegisterActionHandler('area.create-keyboard-shortcuts-area', handleKeyboardShortcutsArea);

    return null

}
