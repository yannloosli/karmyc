import React, { useMemo, useState } from "react";

import { Vec2 } from "../utils";
import { useKarmycStore } from "../core/store";
import { AreaPreview } from "./AreaPreview";
import { DropZone } from "./DropZone";


export interface OwnProps {}

export const AreaToOpenPreview: React.FC<OwnProps> = React.memo((): React.ReactElement | null => {
    // Lire chaque partie de l'état séparément pour éviter les problèmes de référence d'objet
    const areaToOpen = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areaToOpen);
    const initialDimensions = useMemo(() => Vec2.new(100, 100), []);
    const [areaToOpenDimensions, setAreaToOpenDimensions] = useState(initialDimensions);
    
    if (!areaToOpen) {
        return null;
    }

    return (
        <>
            <AreaPreview
                areaToOpen={areaToOpen}
                dimensions={areaToOpenDimensions}
            />
            <DropZone
                areaToOpen={areaToOpen}
                dimensions={areaToOpenDimensions}
                setAreaToOpenDimensions={setAreaToOpenDimensions}
            />
        </>
    );
});
