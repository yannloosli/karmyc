import React, { Dispatch, SetStateAction, useRef } from "react";
import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../../../constants";
import { useAreaStore } from "../../../stores/areaStore";
import { cssZIndex } from "../../../styles/cssVariables";
import { AreaRowLayout } from "../../../types/areaTypes";
import { Rect } from "../../../types/geometry";
import { compileStylesheet } from "../../../utils/stylesheets";
import { handleDragAreaResize } from "../handlers/areaDragResize";

// Restore original styles
const s = compileStylesheet(({ css }) => ({
    separator: css`
		position: absolute;
		z-index: ${cssZIndex.area.separator};
		cursor: ns-resize;
        // Removed debug styles
        // background-color: rgba(255, 0, 0, 0.5);
        // border: 1px solid yellow;

		&--horizontal {
			cursor: ew-resize;
            // Removed debug styles
            // background-color: rgba(0, 0, 255, 0.5);
		}
	`,
}));

interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

interface OwnProps {
    row: AreaRowLayout;
    areaToViewport: { [key: string]: Rect };
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
    // Extraire setResizePreview des props
    const { row, areaToViewport, setResizePreview } = props;
    const layout = useAreaStore(state => state.layout);
    const rootId = useAreaStore(state => state.rootId);
    const viewportsRef = useRef(areaToViewport);

    // Basic validation before continuing
    if (!row || !row.areas || row.areas.length <= 1 || !layout || !rootId) {
        return null;
    }

    // Check that all necessary viewports are available
    const allViewportsAvailable = row.areas.every(area =>
        // areaToViewport.get(area.id) && // Remplacé
        areaToViewport[area.id] && // Retour à l'accès par crochet
        layout[area.id] // Make sure the area still exists in the layout
    );

    // If viewports are missing, don't try to render separators
    if (!allViewportsAvailable) {
        // console.warn("AreaRowSeparators: Missing viewports or layout info for some areas in the row.", { rowId: row.id, areas: row.areas.map(a => a.id), viewportKeys: Object.keys(areaToViewport) }); // Keep warn if needed
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
        // const currentViewport = areaToViewport.get(currentArea.id); // Remplacé
        // const nextViewport = areaToViewport.get(nextArea.id); // Remplacé
        const currentViewport = areaToViewport[currentArea.id]; // Retour à l'accès par crochet
        const nextViewport = areaToViewport[nextArea.id]; // Retour à l'accès par crochet

        if (!layout[currentArea.id] || !layout[nextArea.id] ||
            // !currentViewport || !nextViewport) { // Gardé la vérification d'existence
            !currentViewport || !nextViewport) {
            // console.warn(`AreaRowSeparators: Missing layout or viewport for adjacent areas ${currentArea.id} or ${nextArea.id}`); // Keep warn if needed
            continue;
        }

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
                height: Math.max(nextViewport.height - AREA_BORDER_WIDTH * 4 - TOOLBAR_HEIGHT * 2, 5) // Ensure min height 5
            };
        } else {
            // For vertical orientation, the separator is between the current area's end
            // and the next area's beginning (horizontally)
            separatorRect = {
                left: nextViewport.left + AREA_BORDER_WIDTH * 2,
                top: nextViewport.top - AREA_BORDER_WIDTH,
                width: Math.max(nextViewport.width - AREA_BORDER_WIDTH * 4, 5), // Ensure min width 5
                height: AREA_BORDER_WIDTH * 2
            };
        }

        // Ensure calculated dimensions are valid numbers
        if (isNaN(separatorRect.left) || isNaN(separatorRect.top) || isNaN(separatorRect.width) || isNaN(separatorRect.height)) {
            // console.error("AreaRowSeparators: Invalid separatorRect calculated (NaN)", { rowId: row.id, index: i, rect: separatorRect }); // Keep error if needed
            continue; // Skip rendering this separator
        }
        // Ensure dimensions are not negative
        separatorRect.width = Math.max(0, separatorRect.width);
        separatorRect.height = Math.max(0, separatorRect.height);

        const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            // Passer setResizePreview à la fonction handler
            handleDragAreaResize(e, row, horizontal, i + 1, setResizePreview);
        };

        separators.push(
            <div
                key={`sep-${currentArea.id}-${nextArea.id}`}
                className={s("separator", { horizontal })}
                style={separatorRect} // Use calculated rect directly
                onMouseDown={handleMouseDown}
            />
        );
    }

    return <>{separators}</>;
};
