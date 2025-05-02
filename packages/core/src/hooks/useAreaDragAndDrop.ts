import { Vec2 } from '@gamesberry/karmyc-shared';
import React, { useCallback, useRef } from 'react';
import { useAreaStore } from '../stores/areaStore';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getHoveredAreaId } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';

const useAreaDragAndDrop = () => {
    // Get actions and state selectors from Zustand store
    const setAreaToOpenAction = useAreaStore(state => state.setAreaToOpen);
    const updateAreaToOpenPositionAction = useAreaStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacementAction = useAreaStore(state => state.finalizeAreaPlacement);
    // Select necessary state parts (consider using shallow comparison if selecting multiple parts)
    const layout = useAreaStore(state => state.layout);
    const rootId = useAreaStore(state => state.rootId);
    const areas = useAreaStore(state => state.areas);
    const areaToOpen = useAreaStore(state => state.areaToOpen); // Needed for getHoveredAreaId?

    const dragRef = useRef<{ startX: number; startY: number; sourceId: string | null } | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const UPDATE_INTERVAL = 32; // Reduce to 30fps

    // Calculate areaToViewport from layout and viewports
    const areaToViewport = React.useMemo(() => {
        const rootViewport = getAreaRootViewport();
        return computeAreaToViewport(layout, rootId, rootViewport);
    }, [layout, rootId]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const sourceId = (e.currentTarget as HTMLElement).getAttribute('data-source-id');

        if (!sourceId) {
            console.warn('useAreaDragAndDrop - No sourceId found');
            return;
        }

        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            sourceId
        };

        // Create an invisible drag image
        const dragImage = document.createElement('div');
        dragImage.style.width = '1px';
        dragImage.style.height = '1px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1px';
        dragImage.style.left = '-1px';
        dragImage.style.opacity = '0.01';
        dragImage.style.pointerEvents = 'none';
        document.body.appendChild(dragImage);

        // Configure drag effect
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sourceId);
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Initialize areaToOpen directly with cursor position
        // so the preview is centered on the mouse from the start
        setAreaToOpenAction({
            position: { x: e.clientX, y: e.clientY },
            area: {
                type: 'image-viewer',
                state: { sourceId }
            }
        });

        // Clean up drag image
        requestAnimationFrame(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        });
    }, [setAreaToOpenAction]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';

        if (!dragRef.current) return;

        const now = performance.now();
        if (now - lastUpdateRef.current >= UPDATE_INTERVAL) {
            const position = {
                x: e.clientX,
                y: e.clientY
            };
            updateAreaToOpenPositionAction(position);
            lastUpdateRef.current = now;
        }
    }, [updateAreaToOpenPositionAction]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        if (!dragRef.current) return;

        // Check if the drag lasted long enough
        const dragDuration = Date.now() - lastUpdateRef.current;
        if (dragDuration < 100) {
            return;
        }

        dragRef.current = null;
        // Use cleanupTemporaryStates which clears areaToOpen and joinPreview
        useAreaStore.getState().cleanupTemporaryStates();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragRef.current) return;

        const position = {
            x: e.clientX,
            y: e.clientY
        };

        const positionVec2 = Vec2.new(position.x, position.y);
        // Construct the state object needed by getHoveredAreaId
        const currentAreaState = { layout, rootId, areas, areaToOpen }; // Use current state from store
        const hoveredAreaId = getHoveredAreaId(positionVec2, currentAreaState, areaToViewport);

        if (hoveredAreaId) {
            finalizeAreaPlacementAction();
        } else {
            // Use cleanupTemporaryStates which clears areaToOpen and joinPreview
            useAreaStore.getState().cleanupTemporaryStates();
        }

        dragRef.current = null;
    }, [finalizeAreaPlacementAction, layout, rootId, areas, areaToOpen, areaToViewport]);

    return {
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    };
};

export default useAreaDragAndDrop; 
