import React, { useRef } from "react";
import { useSelector } from "react-redux";
import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../../../constants";
import { RootState } from "../../../store";
import { cssZIndex } from "../../../styles/cssVariables";
import { AreaRowLayout } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { compileStylesheet } from "../../../utils/stylesheets";
import { handleDragAreaResize } from "../handlers/areaDragResize";

// Styles with visible debug colors
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

    // Basic validation before continuing
    if (!row || !row.areas || row.areas.length <= 1) {
        return null;
    }

    // Check that all necessary viewports are available
    const allViewportsAvailable = row.areas.every(area =>
        areaToViewport[area.id] &&
        layout[area.id] // Make sure the area still exists in the layout
    );

    // If viewports are missing, don't try to render separators
    if (!allViewportsAvailable) {
        return null;
    }

    // Create an array to collect separators
    const separators = [];

    // Improved method: don't use slice(1) but calculate
    // position between two adjacent areas
    for (let i = 0; i < row.areas.length - 1; i++) {
        const currentArea = row.areas[i];
        const nextArea = row.areas[i + 1];

        if (!currentArea || !nextArea) continue;

        // Check that both areas exist in the layout and have viewports
        if (!layout[currentArea.id] || !layout[nextArea.id] ||
            !areaToViewport[currentArea.id] || !areaToViewport[nextArea.id]) {
            continue;
        }

        const currentViewport = areaToViewport[currentArea.id];
        const nextViewport = areaToViewport[nextArea.id];

        // Determine orientation
        const horizontal = row.orientation === "horizontal";

        // Calculate separator position based on two adjacent viewports
        let separatorRect: Rect;

        if (horizontal) {
            // For horizontal orientation, the separator is between the current area's end
            // and the next area's beginning (vertically)
            separatorRect = {
                left: nextViewport.left - AREA_BORDER_WIDTH,
                top: nextViewport.top + AREA_BORDER_WIDTH * 2 + TOOLBAR_HEIGHT,
                width: AREA_BORDER_WIDTH * 2,
                height: Math.max(nextViewport.height - AREA_BORDER_WIDTH * 4 - TOOLBAR_HEIGHT * 2, 20)
            };
        } else {
            // For vertical orientation, the separator is between the current area's end
            // and the next area's beginning (horizontally)
            separatorRect = {
                left: nextViewport.left + AREA_BORDER_WIDTH * 2,
                top: nextViewport.top - AREA_BORDER_WIDTH,
                width: Math.max(nextViewport.width - AREA_BORDER_WIDTH * 4, 20),
                height: AREA_BORDER_WIDTH * 2
            };
        }

        const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            handleDragAreaResize(e, row, horizontal, i + 1);
        };

        separators.push(
            <div
                key={`sep-${currentArea.id}-${nextArea.id}`}
                className={s("separator", { horizontal })}
                style={{
                    ...separatorRect,
                    // Additional styles to make the separator visible
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    fontSize: '10px',
                    color: 'white'
                }}
                onMouseDown={handleMouseDown}
            />
        );
    }

    return <>{separators}</>;
};
