import { useKarmycStore } from "../../../src/core/store";
import { areaRegistry } from "../../../src/core/registries/areaRegistry";
import { useRegisterActionHandler } from "../../../src/hooks/useRegisterActionHandler";
import { useRegisterAreaType } from "../../../src/hooks/useRegisterAreaType";
import { AREA_ROLE } from "../../../src/core/types/actions";
import { Book } from "lucide-react";
import { DocsArea } from "./DocsArea";

export const DocsAreaComponent = () => {
    const { updateArea } = useKarmycStore.getState();

    const handleDocsArea = (params: any) => {
        const areaId = params.areaId;
        if (areaId) {
            updateArea({
                id: areaId,
                type: 'docs-area',
                state: areaRegistry.getInitialState('docs-area')
            });
        }
    };

    // Register area types
    useRegisterAreaType(
        'docs-area',
        DocsArea,
        {},
        {
            displayName: 'Documentation',
            defaultSize: { width: 400, height: 600 },
            role: AREA_ROLE.SELF,
            icon: Book
        }
    );

    // Register action handlers
    useRegisterActionHandler('area.create-docs-area', handleDocsArea);

    return null;
}; 
