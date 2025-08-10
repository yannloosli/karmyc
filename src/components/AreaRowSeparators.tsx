import React, { Dispatch, SetStateAction } from "react";
import { AREA_BORDER_WIDTH, TOOLBAR_HEIGHT } from "../utils/constants";
import { useKarmycStore } from "../core/store";
import { AreaRowLayout } from "../types/areaTypes";
import { Rect } from "../types";
import { handleDragAreaResize } from "./handlers/areaDragResize";
import { Ellipsis, EllipsisVertical } from 'lucide-react';
import { t } from '../core/utils/translation';
import { useResizePreview } from '../hooks/useResizePreview';
import type { ResizePreviewState } from '../types/areaTypes';

// Type imported from ../types/areaTypes

interface Props {
    row: AreaRowLayout;
    setResizePreview: Dispatch<SetStateAction<ResizePreviewState | null>>;
    resizePreview: ResizePreviewState | null;
    offset?: number;
}

export const AreaRowSeparators: React.FC<Props> = ({
    row,
    setResizePreview,
    resizePreview,
    offset = 0
}) => {
    const { getSeparatorPosition } = useResizePreview();
    const isDetached = useKarmycStore(state => 
        state.screens[state.activeScreenId]?.isDetached
    );
    
    // Retrieve data from the store
    const layout = useKarmycStore(state => 
        state.screens[state.activeScreenId]?.areas.layout ?? {}
    );
    const areaToViewport = useKarmycStore(state => 
        state.screens[state.activeScreenId]?.areas.viewports ?? {}
    );

    // No forced re-render - rely on resizePreview which updates in real time

    // Compute an area's viewport considering local resize preview
    // Avoid useCallback to ensure real-time updates
    const getAreaViewportWithPreview = (areaId: string): Rect | undefined => {
        const baseViewport = areaToViewport[areaId];
        if (!baseViewport) return undefined;

        // If no active preview for this row, return base viewport
        if (!resizePreview || resizePreview.rowId !== row.id) {
            return baseViewport;
        }

        // Find area index within the row
        const areaIndex = row.areas.findIndex(area => area.id === areaId);
        if (areaIndex === -1) return baseViewport;

        const { separatorIndex, t } = resizePreview;
        const separatorAreaIndex = separatorIndex - 1;

        // If area is not affected by resizing, return base viewport
        if (areaIndex !== separatorAreaIndex && areaIndex !== separatorAreaIndex + 1) {
            return baseViewport;
        }

        // Compute new dimensions based on preview
        const isFirst = areaIndex === separatorAreaIndex;
        const area1 = row.areas[separatorAreaIndex];
        const area2 = row.areas[separatorAreaIndex + 1];
        
        if (!area1 || !area2) return baseViewport;

        const viewport1 = areaToViewport[area1.id];
        const viewport2 = areaToViewport[area2.id];
        
        if (!viewport1 || !viewport2) return baseViewport;

        if (row.orientation === 'horizontal') {
            const totalWidth = viewport1.width + viewport2.width;
            const newWidth1 = totalWidth * t;
            const newWidth2 = totalWidth * (1 - t);

            const newWidth = isFirst ? newWidth1 : newWidth2;
            const newLeft = isFirst ? viewport1.left : viewport1.left + newWidth1;

            return {
                ...baseViewport,
                width: newWidth,
                left: newLeft
            };
        } else {
            const totalHeight = viewport1.height + viewport2.height;
            const newHeight1 = totalHeight * t;
            const newHeight2 = totalHeight * (1 - t);

            const newHeight = isFirst ? newHeight1 : newHeight2;
            const newTop = isFirst ? viewport1.top : viewport1.top + newHeight1;

            return {
                ...baseViewport,
                height: newHeight,
                top: newTop
            };
        }
    };

    if (isDetached) {
        return null;
    }

    const separators: JSX.Element[] = [];

    // Improved method: don't use slice(1) but calculate
    // position between two adjacent areas
    for (let i = 0; i < row.areas.length - 1; i++) {
        const currentArea = row.areas[i];
        const nextArea = row.areas[i + 1];

        if (!currentArea || !nextArea) continue;

        const currentViewport = getAreaViewportWithPreview(currentArea.id);
        const nextViewport = getAreaViewportWithPreview(nextArea.id);

        if (!layout[currentArea.id] || !layout[nextArea.id] ||
            !currentViewport || !nextViewport) {
            continue;
        }

        // Determine orientation
        const horizontal = row.orientation === "horizontal";

        // Calculate separator position based on two adjacent viewports
        let separatorRect: Rect;

        if (horizontal) {
            // Separator position based on updated viewports (including preview)
            separatorRect = {
                left: nextViewport.left - AREA_BORDER_WIDTH,
                top: nextViewport.top + TOOLBAR_HEIGHT - offset - 5,
                width: AREA_BORDER_WIDTH * 2,
                height: Math.max(nextViewport.height - TOOLBAR_HEIGHT + 10, 5)
            };
        } else {
            // Separator position based on updated viewports (including preview)
            separatorRect = {
                left: nextViewport.left,
                top: nextViewport.top - AREA_BORDER_WIDTH - offset,
                width: Math.max(nextViewport.width, 5),
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
            handleDragAreaResize(row, horizontal, i + 1, setResizePreview);
        };

        // Add CSS class when the separator is currently being resized
        const isCurrentlyResizing = resizePreview && 
            resizePreview.rowId === row.id && 
            resizePreview.separatorIndex === i + 1;

        separators.push(
            <div
                key={`separator-${row.id}-${i}`}
                className={`area-separator ${isCurrentlyResizing ? 'resizing' : ''}`}
                style={{
                    position: 'absolute',
                    left: separatorRect.left,
                    top: separatorRect.top,
                    width: separatorRect.width,
                    height: separatorRect.height,
                    cursor: horizontal ? 'col-resize' : 'row-resize',
                    backgroundColor: isCurrentlyResizing ? 'var(--accent-color, #007acc)' : 'rgba(0, 0, 0, 0.05)',
                    border: isCurrentlyResizing ? '2px solid var(--accent-color, #007acc)' : '1px solid rgba(0, 0, 0, 0.15)',
                    zIndex: isCurrentlyResizing ? 1000 : 10,
                    transition: isCurrentlyResizing ? 'none' : 'all 0.2s ease',
                }}
                onMouseDown={handleMouseDown}
                onMouseEnter={(e) => {
                    if (!isCurrentlyResizing) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.3)';
                    }
                }}
                onMouseLeave={(e) => {
                    if (!isCurrentlyResizing) {
                        e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
                        e.currentTarget.style.borderColor = 'rgba(0, 0, 0, 0.15)';
                    }
                }}
                title={t('area.resize', 'Resize areas')}
                data-testid={`separator-${row.id}-${i + 1}`}
            />
        );
    }

    return <>{separators}</>;
};
