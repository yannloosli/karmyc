import { useMemo } from "react";
import { useKarmycStore } from "../../../src/store/areaStore";
import { areaRegistry } from "../../../src/store/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/actions";
import { useAreaKeyboardShortcuts } from "../../../src/hooks/useAreaKeyboardShortcuts";
import { useToolsSlot } from "../../../src/components/ToolsSlot";
import { ReadmeArea } from "./ReadmeArea";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/types/actions";
import { CircleSlash } from "lucide-react";

export const DemoArea = () => {
    const { updateArea } = useKarmycStore.getState();
    const { registerComponent: registerRootMenuDemoArea } = useToolsSlot('demo-area', 'top-inner');

    const handleDemoArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'demo-area',
                state: areaRegistry.getInitialState('demo-area')
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


    // Define area shortcuts
    useAreaKeyboardShortcuts('demo-area', [
        {
            key: 'S',
            modifierKeys: ['Control'],
            name: 'Save Demo Area',
            fn: (areaId: string) => {
                console.log(`Saving demo area ${areaId}`);
                // Save implementation
            },
            history: true,
            isGlobal: true
        },
        {
            key: 'R',
            name: 'Reset Demo Area',
            fn: (areaId: string) => {
                console.log(`Resetting demo area ${areaId}`);
                updateArea({
                    id: areaId,
                    type: 'demo-area',
                    state: areaRegistry.getInitialState('demo-area')
                });
            }
        }
    ]);

    // Register area types
    useRegisterAreaType(
        'demo-area',
        ReadmeArea,
        {},
        {
            displayName: 'Demo area',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.LEAD,
            icon: CircleSlash
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-demo-area', handleDemoArea);

    return null

}
