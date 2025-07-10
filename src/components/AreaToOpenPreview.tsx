import React, { useEffect, useMemo } from "react";

import { Vec2 } from "../utils";
import { useKarmycStore } from "../core/store";
import { AreaPreview } from "./AreaPreview";
import { DropZone } from "./DropZone";
import { getHoveredAreaId } from "../core/utils/areaUtils";
import { computeAreaToViewport } from "../utils/areaToViewport";
import { getAreaRootViewport } from "../utils/getAreaViewport";

export interface OwnProps {}

export const AreaToOpenPreview: React.FC<OwnProps> = React.memo((): React.ReactElement | null => {
    // Lire chaque partie de l'état séparément pour éviter les problèmes de référence d'objet
    const areaToOpen = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areaToOpen);
    const layout = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout);
    const rootId = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.rootId);
    const areas = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);
    
    // Calculer les viewports à la volée en incluant la zone en cours de création
    const areaToViewport = useMemo(() => {
        if (!layout || !rootId) return {};
        
        // Créer un layout temporaire qui inclut la zone en cours de création
        const tempLayout = { ...layout };
        const tempAreas = { ...areas };
        
        if (areaToOpen) {
            // Ajouter temporairement la zone en cours de création au layout
            tempLayout["-1"] = {
                type: "area",
                id: "-1"
            };
            tempAreas["-1"] = {
                ...areaToOpen.area,
                id: "-1"
            };
        }
        
        const rootViewport = getAreaRootViewport();
        return computeAreaToViewport(tempLayout, rootId, rootViewport);
    }, [layout, rootId, areas, areaToOpen]);
    
    // Construire l'état area pour getHoveredAreaId
    const areaState = useMemo(() => ({
        layout: layout || {},
        rootId: rootId || "",
        areas: areas || {},
        areaToOpen,
        joinPreview: null,
        _id: 1
    }), [layout, rootId, areas, areaToOpen]);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !areaToViewport || Object.keys(areaToViewport).length === 0) {
            return null;
        }
        
        const currentPositionVec2 = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(
            currentPositionVec2,
            areaState,
            areaToViewport
        );
    }, [areaToOpen, areaToViewport, areaState]);

    const areaToOpenTargetViewport = useMemo(() => {
        return areaToOpenTargetId ? areaToViewport?.[areaToOpenTargetId] : null;
    }, [areaToOpenTargetId, areaToViewport]);

    // Utiliser un état local pour les dimensions avec transition
    const [areaToOpenDimensions, setAreaToOpenDimensions] = React.useState(() => Vec2.new(100, 100));

    useEffect(() => {
        if (!areaToOpenTargetId || !areaToOpenTargetViewport) {
            return;
        }

        const newDimensions = Vec2.new(areaToOpenTargetViewport.width, areaToOpenTargetViewport.height);
        
        // Mise à jour avec transition simple
        setAreaToOpenDimensions(newDimensions);
    }, [areaToOpenTargetId, areaToOpenTargetViewport]);
    
    if (!areaToOpen || !areaToOpenTargetViewport) {
        return null;
    }

    return (
        <>
            <AreaPreview
                areaToOpen={areaToOpen}
                dimensions={areaToOpenDimensions}
            />
            <DropZone />
        </>
    );
});
