import React, { useState } from 'react';
import { IArea, AreaRowLayout } from '../types/areaTypes';
import { useKarmycStore } from '../core/store';
import { AreaDragButton } from './handlers/AreaDragButton';
import { useSpaceStore } from '../core/spaceStore';

export interface AreaTabsProps {
    rowId: string;
    row: AreaRowLayout;
    areas: Record<string, IArea>;
}

export const AreaTabs: React.FC<AreaTabsProps> = React.memo(({ rowId, row, areas }) => {
    const updateLayout = useKarmycStore(state => state.updateLayout);
    const setActiveArea = useKarmycStore(state => state.setActiveArea);

    // State for drop position indicator
    const [dragIndicator, setDragIndicator] = useState<{ targetId: string | null, position: 'before' | 'after' | null }>({ targetId: null, position: null });
    // State for currently dragged tab
    const [draggingTabId, setDraggingTabId] = useState<string | null>(null);

    const handleTabClick = (areaId: string) => {
        const area = areas[areaId];
        if (!area) return;

        // First update the layout to change the active tab
        updateLayout({ id: rowId, activeTabId: areaId });
        // Then update the active area
        setActiveArea(areaId);

        // If the area has a space, switch to MANUAL mode and update the active space
        if (area.spaceId) {
            useSpaceStore.getState().setActiveSpace(area.spaceId);
        }
    };

    // Drag & drop for tab reorganization
    const handleTabDragStart = (e: React.DragEvent, areaId: string) => {
        // area.isLocked is true here, so this is a drag for tab reorganization
        e.stopPropagation(); // Prevents AreaDragButton/useAreaDragAndDrop from interfering
        setDraggingTabId(areaId); // Mark this tab as being dragged
        
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'tab',
            areaId,
            sourceRowId: rowId
        }));
        e.dataTransfer.setData('karmyc/tab-drag-source', 'true'); // Marqueur spécifique pour dragOver
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleTabDragOver = (e: React.DragEvent, overAreaId: string) => {
        if (e.dataTransfer.types.includes('karmyc/tab-drag-source')) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';

            const targetElement = e.currentTarget as HTMLElement;
            const rect = targetElement.getBoundingClientRect();
            const midPoint = rect.left + rect.width / 2;
            const position = e.clientX < midPoint ? 'before' : 'after';

            // Avoid unnecessary state updates if the indicator is already correct
            if (dragIndicator.targetId !== overAreaId || dragIndicator.position !== position) {
                setDragIndicator({ targetId: overAreaId, position });
            }
        }
    };

    // Reset the indicator when drag leaves the tabs area
    const handleTabsContainerDragLeave = (e: React.DragEvent) => {
        // Check if the relatedTarget is outside the tabs container
        if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
            setDragIndicator({ targetId: null, position: null });
        }
    };

    const handleTabDrop = (e: React.DragEvent, onDropAreaId: string) => {
        try {
            const dataString = e.dataTransfer.getData('text/plain');
            if (!dataString) {
                setDragIndicator({ targetId: null, position: null });
                return;
            }
            const data = JSON.parse(dataString);

            if (data.type === 'tab' && data.sourceRowId === rowId) {
                e.preventDefault();
                e.stopPropagation();

                const sourceAreaId = data.areaId;
                const { targetId: indicatedTargetId, position: indicatedPosition } = dragIndicator;

                // If we drop the source on itself without clear intention to move (via indicator),
                // or if the dragged tab is not the one indicated (e.g., desynchronized indicator)
                if (sourceAreaId === onDropAreaId && indicatedTargetId !== onDropAreaId) {
                    setDragIndicator({ targetId: null, position: null });
                    return;
                }
                // If we drop the source on itself and the indicator doesn't show a position change
                if (sourceAreaId === onDropAreaId && indicatedTargetId === onDropAreaId && indicatedPosition === null) {
                    setDragIndicator({ targetId: null, position: null });
                    return;
                }

                const workingAreas = [...row.areas];
                const sourceIndex = workingAreas.findIndex(a => a.id === sourceAreaId);
                const onDropAreaOriginalIndex = row.areas.findIndex(a => a.id === onDropAreaId);

                if (sourceIndex === -1 || onDropAreaOriginalIndex === -1) {
                    setDragIndicator({ targetId: null, position: null });
                    return; // Source or target not found (shouldn't happen)
                }
                
                const [movedArea] = workingAreas.splice(sourceIndex, 1); // Remove the source element

                // Calculate the target index in the modified array (after source removal)
                let targetIndexInModifiedArray = onDropAreaOriginalIndex;
                if (sourceIndex < onDropAreaOriginalIndex) {
                    targetIndexInModifiedArray--; 
                }
                // If sourceIndex === onDropAreaOriginalIndex, then we're dropping on the source's original position
                // targetIndexInModifiedArray will be the index of the element that took the source's place (or sourceIndex if it was the last one)
                // If we drop on the source itself, targetIndexInModifiedArray is the index where the source *would be* if it wasn't moved
                if (sourceAreaId === onDropAreaId) {
                    targetIndexInModifiedArray = sourceIndex; // Insertion will be relative to the source's original position
                }

                let finalInsertionIndex = targetIndexInModifiedArray;
                // Use the indicator to determine if we insert before or after the target
                if (indicatedTargetId === onDropAreaId && indicatedPosition === 'after') {
                    finalInsertionIndex = targetIndexInModifiedArray + 1;
                }
                // If indicatedPosition === 'before', finalInsertionIndex is already correct (targetIndexInModifiedArray)
                // If the indicator is not on onDropAreaId (e.g., dragLeave then quick drop),
                // we insert by default before onDropAreaId

                workingAreas.splice(finalInsertionIndex, 0, movedArea);
                
                updateLayout({ 
                    id: rowId, 
                    areas: workingAreas,
                    activeTabId: row.activeTabId // Preserve the active tab
                });
            }
        } catch (error) {
            console.error('Error handling tab drop:', error);
        }
        // Always reset the indicator after drop or in case of error
        setDragIndicator({ targetId: null, position: null });
        // And the currently dragged tab, as the drag is finished
        setDraggingTabId(null);
    };

    // Handle drag end (if drop didn't occur on a valid target or was cancelled)
    const handleTabDragEnd = () => {
        setDraggingTabId(null);
        setDragIndicator({ targetId: null, position: null });
    };

        return (
        <div className="area-tabs" onDragLeave={handleTabsContainerDragLeave}>
            {row.areas.map(({ id }) => {
                const area = areas[id];

                if (!area) return null;

                const isActive = row.activeTabId === id;
                const isDragTarget = dragIndicator.targetId === id;
                const indicatorClass = isDragTarget ? `drop-indicator-${dragIndicator.position}` : '';
                const isDraggingSource = draggingTabId === id;

                return (
                    <div
                        key={id}
                        className={`area-tab ${isActive ? 'area-tab--active' : ''} ${indicatorClass} ${isDraggingSource ? 'is-dragging-source' : ''}`}
                        onClick={() => handleTabClick(id)}
                        draggable={area.isLocked} // Draggable only if locked for internal reorganization
                        onDragStart={e => area.isLocked ? handleTabDragStart(e, id) : undefined}
                        onDragOver={e => handleTabDragOver(e, id)} // Pass the hovered tab id
                        onDrop={e => handleTabDrop(e, id)}
                        onDragEnd={handleTabDragEnd} // Add the onDragEnd handler
                        data-areaid={id}
                    >
                        <AreaDragButton id={id} state={area.state} type={area.type} />
                    </div>
                );
            })}
        </div>
    );
}); 
