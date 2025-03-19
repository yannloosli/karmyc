import "~/util/math/expressions";

import React, { useEffect, useRef, useState } from "react";
import { Area } from "~/area/components/Area";
import AreaRootStyles from "~/area/components/AreaRoot.styles";
import { AreaRowSeparators } from "~/area/components/AreaRowSeparators";
import { AreaToOpenPreview } from "~/area/components/AreaToOpenPreview";
import { JoinAreaPreview } from "~/area/components/JoinAreaPreview";
import { AreaReducerState } from "~/area/state/areaReducer";
import { _setAreaViewport, getAreaRootViewport } from "~/area/util/getAreaViewport";
import { computeAreaToViewport } from "~/core/utils/areaToViewport";
import { connectActionState } from "~/state/stateUtils";
import { compileStylesheetLabelled } from "~/util/stylesheets";

const s = compileStylesheetLabelled(AreaRootStyles);

interface StateProps {
    layout: AreaReducerState["layout"];
    rootId: string;
    joinPreview: AreaReducerState["joinPreview"];
}
type Props = StateProps;

const AreaRootComponent: React.FC<Props> = (props) => {
    const { joinPreview } = props;

    console.log("[AreaRoot] Current layout:", props.layout);

    // Fonction pour vérifier et réparer le layout avant de calculer les viewports
    const sanitizeLayout = (layout: any, rootId: string) => {
        // Créer une copie pour éviter de modifier l'original directement
        const sanitizedLayout = { ...layout };

        // Vérifier que toutes les références dans les zones sont valides
        Object.entries(sanitizedLayout).forEach(([id, item]: [string, any]) => {
            if (item && item.type === "area_row" && item.areas) {
                item.areas.forEach((area: any) => {
                    if (!sanitizedLayout[area.id]) {
                        console.warn(`Creating missing area ${area.id} referenced in row ${id}`);
                        sanitizedLayout[area.id] = {
                            type: "area",
                            id: area.id
                        };
                    }

                    // S'assurer que chaque zone a une taille
                    if (!area.size) {
                        console.warn(`Setting default size for area ${area.id}`);
                        area.size = 1 / item.areas.length;
                    }
                });
            }
        });

        return sanitizedLayout;
    };

    // Sanitize le layout avant utilisation
    const sanitizedLayout = sanitizeLayout(props.layout, props.rootId);
    console.log("[AreaRoot] Layout comparison:", {
        original: props.layout,
        sanitized: sanitizedLayout,
        rootId: props.rootId,
        isRootAreaRow: sanitizedLayout[props.rootId]?.type === "area_row",
        rootAreas: sanitizedLayout[props.rootId]?.type === "area_row" ?
            (sanitizedLayout[props.rootId] as any).areas.map((a: any) => ({ id: a.id, size: a.size })) : []
    });

    const viewportMapRef = useRef<{ [areaId: string]: Rect }>({});

    const [viewport, setViewport] = useState(getAreaRootViewport());

    useEffect(() => {
        const fn = () => setViewport(getAreaRootViewport());
        window.addEventListener("resize", fn);
        return () => window.removeEventListener("resize", fn);
    });

    {
        const newMap =
            (viewport && computeAreaToViewport(sanitizedLayout, props.rootId, viewport)) || {};

        const map = viewportMapRef.current;

        const keys = Object.keys(newMap);
        const rectKeys: Array<keyof Rect> = ["height", "left", "top", "width"];
        viewportMapRef.current = keys.reduce<{ [areaId: string]: Rect }>((obj, key) => {
            const a = map[key];
            const b = newMap[key];

            let shouldUpdate = !a;

            if (!shouldUpdate) {
                for (let i = 0; i < rectKeys.length; i += 1) {
                    const k = rectKeys[i];
                    if (a[k] !== b[k]) {
                        shouldUpdate = true;
                        break;
                    }
                }
            }

            obj[key] = shouldUpdate ? b : a;
            return obj;
        }, {});
    }

    const areaToViewport = viewportMapRef.current;

    // Debug: Vérifier si les zones ont des viewports
    useEffect(() => {
        console.log("[AreaRoot] Debug useEffect - Layout:", props.layout);
        console.log("[AreaRoot] Debug useEffect - Viewports:", areaToViewport);

        // Vérifiez si row.areas.id sont dans les entrées de layout
        Object.entries(props.layout).forEach(([id, layout]) => {
            if (layout.type === "area_row") {
                const row = layout as any;
                row.areas.forEach((area: any) => {
                    if (!props.layout[area.id]) {
                        console.error(`Area ${area.id} referenced in row ${id} is not defined in layout`);
                    }
                });
            }
        });
    }, [props.layout, areaToViewport]);

    console.log("[AreaRoot] Final viewports:", areaToViewport);

    // Vérifiez si tous les IDs du layout ont un viewport correspondant
    Object.keys(props.layout).forEach(id => {
        if (!areaToViewport[id]) {
            console.error("Unable to calculate viewport for area", id);
        }
    });

    _setAreaViewport(areaToViewport);

    return (
        <div data-area-root style={{ position: 'relative' }}>
            {viewport &&
                Object.keys(sanitizedLayout).map((id) => {
                    const layout = sanitizedLayout[id];

                    if (layout.type === "area_row") {
                        return (
                            <>
                                <AreaRowSeparators
                                    key={id}
                                    areaToViewport={areaToViewport}
                                    row={layout}
                                />
                            </>
                        );
                    }

                    return <Area key={id} viewport={areaToViewport[id]} id={id} />;
                })}
            {joinPreview && joinPreview.areaId && (
                <JoinAreaPreview
                    viewport={areaToViewport[joinPreview.areaId]}
                    movingInDirection={joinPreview.movingInDirection!}
                />
            )}
            <AreaToOpenPreview areaToViewport={areaToViewport} />
            <div className={s("cursorCapture", { active: !!joinPreview })} />
        </div>
    );
};

const mapStateToProps: MapActionState<StateProps> = ({ area }) => ({
    joinPreview: area.joinPreview,
    layout: area.layout,
    rootId: area.rootId,
});

export const AreaRoot = connectActionState(mapStateToProps)(AreaRootComponent);
