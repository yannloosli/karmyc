import { useKarmycStore } from "../../../../src/core/store";
import { areaRegistry } from "../../../../src/core/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../../src/hooks/useRegisterActionHandler";
import { useRegisterAreaType } from "../../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../../src/core/types/actions";
import { Palette } from "lucide-react";
import { ColorPicker } from "../../components/ColorPicker";
import React from "react";

export const ColorPickerArea = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleColorPickerArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'color-picker-area',
                state: areaRegistry.getInitialState('color-picker-area')
            });
        }
    };

    // Register area types
    useRegisterAreaType(
        'color-picker-area',
        ColorPicker,
        {},
        {
            displayName: 'Color Picker',
            defaultSize: { width: 300, height: 200 },
            role: AREA_ROLE.FOLLOW,
            icon: Palette
        }
    );



    // Register action handlers
    useRegisterActionHandler('area.create-color-picker-area', handleColorPickerArea);

    return null

}
