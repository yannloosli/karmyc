import { useMemo } from "react";
import { useKarmycStore } from "../../../src/store/areaStore";
import { areaRegistry } from "../../../src/store/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/actions";
import { useToolsSlot } from "../../../src/components/ToolsSlot";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/types/actions";
import { Keyboard } from "lucide-react";
import KeyboardShortcutsViewer from "../../../src/components/KeyboardShortcutsViewer";

export const KeyboardShortcutsArea = () => {
    const { updateArea } = useKarmycStore.getState();
    const { registerComponent: registerRootMenuDemoArea } = useToolsSlot('demo-area', 'top-inner');

    const handleKeyboardShortcutsArea = (params: any) => {
        const areaId = params.areaId;
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
