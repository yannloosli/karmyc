import React, { Dispatch, SetStateAction, useRef } from "react";
import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../constants";
import { useKarmycStore } from "../stores/areaStore";
import { AreaRowLayout } from "../types/areaTypes";
import { Rect } from "../types";
import { handleDragAreaResize } from "./handlers/areaDragResize";


interface ResizePreviewState {
    rowId: string;
    separatorIndex: number;
    t: number;
}

interface OwnProps {
    row: AreaRowLayout;
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
}

type Props = OwnProps;

export const AreaRowSeparators: React.FC<Props> = props => {
    const { row, setResizePreview } = props;
    const setRowSizes = useKarmycStore(state => state.setRowSizes);
    const layout = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout ?? {});
    const rootId = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.rootId);
    const areaToViewport = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.viewports);
    const viewportsRef = useRef(areaToViewport);

    // Basic validation before continuing
    if (!row || !row.areas || row.areas.length <= 1 || !layout || !rootId) {
        return null;
    }

    // Check that all necessary viewports are available
    const allViewportsAvailable = row.areas.every(area =>
        areaToViewport[area.id] &&
        layout[area.id]
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

        const currentViewport = areaToViewport[currentArea.id];
        const nextViewport = areaToViewport[nextArea.id];

        if (!layout[currentArea.id] || !layout[nextArea.id] ||
            !currentViewport || !nextViewport) {
            continue;
        }

        // Determine orientation
        const horizontal = row.orientation === "horizontal";

        // Calculate separator position based on two adjacent viewports
        let separatorRect: Rect;

        if (horizontal) {
            separatorRect = {
                left: nextViewport.left - AREA_BORDER_WIDTH,
                top: nextViewport.top + AREA_BORDER_WIDTH * 2 + TOOLBAR_HEIGHT,
                width: AREA_BORDER_WIDTH * 2,
                height: Math.max(nextViewport.height - AREA_BORDER_WIDTH * 4 - TOOLBAR_HEIGHT * 2, 5)
            };
        } else {
            separatorRect = {
                left: nextViewport.left + AREA_BORDER_WIDTH * 2,
                top: nextViewport.top - AREA_BORDER_WIDTH,
                width: Math.max(nextViewport.width - AREA_BORDER_WIDTH * 4, 5),
                height: AREA_BORDER_WIDTH * 2
            };
        }

        // Ensure calculated dimensions are valid numbers
        if (isNaN(separatorRect.left) || isNaN(separatorRect.top) || isNaN(separatorRect.width) || isNaN(separatorRect.height)) {
            continue;
        }
        // Ensure dimensions are not negative
        separatorRect.width = Math.max(0, separatorRect.width);
        separatorRect.height = Math.max(0, separatorRect.height);

        const handleMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            handleDragAreaResize(e.nativeEvent, row, horizontal, i + 1, setResizePreview);
        };

        separators.push(
            <div
                key={`sep-${currentArea.id}-${nextArea.id}`}
                className={`area-separator ${horizontal ? 'area-separator--horizontal' : ''}`}
                style={separatorRect}
                onMouseDown={handleMouseDown}
            />
        );
    }

    return <>{separators}</>;
};
