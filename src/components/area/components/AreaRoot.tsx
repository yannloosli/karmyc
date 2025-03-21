import React, { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../../store";
import AreaRootStyles from "../../../styles/AreaRoot.styles";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { _setAreaViewport, getAreaRootViewport } from "../../../utils/getAreaViewport";
import { compileStylesheetLabelled } from "../../../utils/stylesheets";
import { Area } from "./Area";
import { AreaRowSeparators } from "./AreaRowSeparators";
import { AreaToOpenPreview } from "./AreaToOpenPreview";
import { JoinAreaPreview } from "./JoinAreaPreview";

const s = compileStylesheetLabelled(AreaRootStyles);

interface Rect {
    left: number;
    top: number;
    width: number;
    height: number;
}

const AreaRootComponent: React.FC = () => {
    const { layout, rootId, joinPreview } = useSelector((state: RootState) => state.area);
    const [viewportMap, setViewportMap] = useState<{ [areaId: string]: Rect }>({});
    const [viewport, setViewport] = useState(getAreaRootViewport());
    const layoutRef = useRef(layout);
    const rootIdRef = useRef(rootId);

    // Mettre à jour les refs quand le layout ou rootId change
    useEffect(() => {
        layoutRef.current = layout;
        rootIdRef.current = rootId;
    }, [layout, rootId]);

    // Gérer le redimensionnement de la fenêtre
    useEffect(() => {
        const fn = () => {
            const newViewport = getAreaRootViewport();
            setViewport(newViewport);
            if (newViewport && layoutRef.current && rootIdRef.current) {
                const newMap = computeAreaToViewport(layoutRef.current, rootIdRef.current, newViewport);
                if (Object.keys(newMap).length > 0) {
                    setViewportMap(newMap);
                    _setAreaViewport(newMap);
                }
            }
        };
        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    }, []);

    // Calculer les viewports quand le layout ou rootId change
    useEffect(() => {
        if (viewport && layout && rootId) {
            const newMap = computeAreaToViewport(layout, rootId, viewport);
            if (Object.keys(newMap).length > 0) {
                setViewportMap(newMap);
                _setAreaViewport(newMap);
            }
        }
    }, [viewport, layout, rootId]);

    // Fonction pour recalculer les viewports manquants
    const recalculateViewports = (missingId?: string) => {
        if (viewport && layoutRef.current && rootIdRef.current) {
            const newMap = computeAreaToViewport(layoutRef.current, rootIdRef.current, viewport);
            if (Object.keys(newMap).length > 0) {
                setViewportMap(newMap);
                _setAreaViewport(newMap);
                return newMap;
            }
        }
        if (missingId) {
            console.warn(`Unable to calculate viewport for area ${missingId}`);
        }
        return null;
    };

    return (
        <div data-area-root style={{ position: 'relative' }}>
            {viewport &&
                Object.keys(layout).map((id) => {
                    const layoutItem = layout[id];
                    if (!layoutItem) {
                        console.warn(`Layout item not found for area ${id}`);
                        return null;
                    }

                    if (layoutItem.type === "area_row") {
                        return (
                            <AreaRowSeparators
                                key={id}
                                areaToViewport={viewportMap}
                                row={layoutItem}
                            />
                        );
                    }

                    const areaViewport = viewportMap[id];
                    if (!areaViewport) {
                        console.warn(`Unable to calculate viewport for area ${id}`);
                        return null;
                    }

                    return <Area key={id} viewport={areaViewport} id={id} />;
                })}
            {joinPreview && joinPreview.areaId && viewportMap[joinPreview.areaId] && (
                <JoinAreaPreview
                    viewport={viewportMap[joinPreview.areaId]}
                    movingInDirection={joinPreview.movingInDirection!}
                />
            )}
            <AreaToOpenPreview areaToViewport={viewportMap} />
            <div className={s("cursorCapture", { active: !!joinPreview })} />
        </div>
    );
};

export const AreaRoot = AreaRootComponent; 
