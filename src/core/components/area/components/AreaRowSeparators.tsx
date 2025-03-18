import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { AREA_BORDER_WIDTH } from "../../../constants";
import { RootState } from "../../../store";
import { cssZIndex } from "../../../styles/cssVariables";
import { compileStylesheet } from "../../../styles/stylesheets";
import { AreaRowLayout } from "../../../types/areaTypes";
import { computeAreaToViewport } from "../../../utils/areaToViewport";
import { _setAreaViewport, getAreaRootViewport } from "../../../utils/getAreaViewport";
import { handleDragAreaResize } from "../handlers/areaDragResize";

const s = compileStylesheet(({ css }) => ({
    separator: css`
		position: absolute;
		z-index: ${cssZIndex.area.separator};
		cursor: ns-resize;

		&--horizontal {
			cursor: ew-resize;
		}
	`,
}));

interface OwnProps {
    row: AreaRowLayout;
    areaToViewport: MapOf<Rect>;
}
type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
    const { row, areaToViewport } = props;
    const { layout, rootId } = useSelector((state: RootState) => state.area);
    const viewportsRef = useRef(areaToViewport);

    useEffect(() => {
        // Vérifier si des viewports sont manquants
        const missingViewports = row.areas.some(area => !areaToViewport[area.id]);

        if (missingViewports) {
            const rootViewport = getAreaRootViewport();
            if (rootViewport && layout && rootId) {
                const newMap = computeAreaToViewport(layout, rootId, rootViewport);
                if (Object.keys(newMap).length > 0) {
                    viewportsRef.current = { ...areaToViewport, ...newMap };
                    _setAreaViewport(viewportsRef.current);
                }
            }
        }
    }, [row.areas, areaToViewport, layout, rootId]);

    return (
        <>
            {row.areas.slice(1).map((area, i) => {
                const viewport = viewportsRef.current[area.id] || areaToViewport[area.id];

                if (!viewport) {
                    console.warn(`No viewport found for area ${area.id}, separator will not be rendered`);
                    return null;
                }

                const horizontal = row.orientation === "horizontal";

                const separatorRect: Rect = horizontal
                    ? {
                        height: viewport.height - AREA_BORDER_WIDTH * 4,
                        width: AREA_BORDER_WIDTH * 2,
                        left: viewport.left - AREA_BORDER_WIDTH,
                        top: viewport.top + AREA_BORDER_WIDTH * 2,
                    }
                    : {
                        height: AREA_BORDER_WIDTH * 2,
                        width: viewport.width - AREA_BORDER_WIDTH * 4,
                        left: viewport.left + AREA_BORDER_WIDTH * 2,
                        top: viewport.top - AREA_BORDER_WIDTH,
                    };

                return (
                    <div
                        key={area.id}
                        className={s("separator", { horizontal })}
                        style={separatorRect}
                        onMouseDown={e => handleDragAreaResize(e, row, horizontal, i + 1)}
                    />
                );
            })}
        </>
    );
};
