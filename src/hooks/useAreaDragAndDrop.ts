import React, { useCallback, useRef, useEffect, useMemo } from 'react';
import { useKarmycStore } from '../data/mainStore';
import { Vec2 } from '../utils/vec2';
import { AreaRowLayout } from '../types/areaTypes';
import { AreaTypeValue } from '../types/actions';
import { getAreaToOpenPlacementInViewport, getHoveredAreaId } from '../data/utils/areaUtils';

interface UseAreaDragAndDropParams {
    type?: AreaTypeValue;
    id?: string;
    state?: any;
}

// Fonction utilitaire pour vérifier si une aire est un enfant de stack
const isAreaChildOfStack = (areaId: string, layout: Record<string, any>) => {
    return Object.values(layout).some(layoutItem =>
        layoutItem.type === 'area_row' &&
        layoutItem.orientation === 'stack' &&
        layoutItem.areas.some((area: { id: string }) => area.id === areaId)
    );
};

const useAreaDragAndDrop = (params?: UseAreaDragAndDropParams) => {
    // Get actions and state selectors from Zustand store
    const setAreaToOpenAction = useKarmycStore(state => state.setAreaToOpen);
    const updateAreaToOpenPositionAction = useKarmycStore(state => state.updateAreaToOpenPosition);
    const finalizeAreaPlacementAction = useKarmycStore(state => state.finalizeAreaPlacement);
    const cleanupTemporaryStates = useKarmycStore(state => state.cleanupTemporaryStates);
    const updateLayout = useKarmycStore(state => state.updateLayout);

    // Select necessary state parts
    const layout = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.layout);
    const rootId = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.rootId);
    const areas = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areas);
    const areaToOpen = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.areaToOpen);
    const areaToViewport = useKarmycStore(state => state.screens[state.activeScreenId]?.areas.viewports);

    const dragRef = useRef<{ startX: number; startY: number; sourceId: string | null } | null>(null);
    const lastUpdateRef = useRef<number>(performance.now());
    const rafRef = useRef<number | undefined>(undefined);
    const isUpdatingRef = useRef(false);

    const detectionDimensions = useMemo(() => Vec2.new(300, 200), []);

    const areaToOpenTargetId = useMemo(() => {
        if (!areaToOpen || !rootId || !areaToViewport || Object.keys(areaToViewport).length === 0) return null;
        const currentPositionVec2 = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getHoveredAreaId(
            currentPositionVec2,
            { layout, rootId, areas, areaToOpen },
            areaToViewport,
            detectionDimensions
        );
    }, [areaToOpen?.position.x, areaToOpen?.position.y, layout, rootId, areas, areaToViewport, detectionDimensions]);

    const areaToOpenTargetViewport = useMemo(() => {
        return areaToOpenTargetId ? areaToViewport[areaToOpenTargetId] : null;
    }, [areaToOpenTargetId, areaToViewport]);

    const calculatedPlacement = useMemo(() => {
        if (!areaToOpen || !areaToOpenTargetViewport) return 'stack';
        const position = Vec2.new(areaToOpen.position.x, areaToOpen.position.y);
        return getAreaToOpenPlacementInViewport(areaToOpenTargetViewport, position);
    }, [areaToOpenTargetViewport, areaToOpen?.position.x, areaToOpen?.position.y, areaToOpen]);

    const updatePosition = useCallback((x: number, y: number) => {
        if (isUpdatingRef.current) return;
        isUpdatingRef.current = true;

        rafRef.current = requestAnimationFrame(() => {
            updateAreaToOpenPositionAction({ x, y });
            isUpdatingRef.current = false;
        });
    }, [updateAreaToOpenPositionAction]);

    const globalDragOverHandler = useCallback((e: DragEvent) => {
        e.preventDefault();
        updatePosition(e.clientX, e.clientY);
    }, [updatePosition]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        if (!params?.type || !params?.id || !params?.state) {
            console.warn('useAreaDragAndDrop - Missing required params for handleDragStart');
            return;
        }
        // Capture params here after the guard. They are now guaranteed to be defined.
        const { type: areaType, id: areaId, state: areaState } = params;

        // Prevent text selection during drag
        document.body.style.userSelect = 'none';

        const rect = e.currentTarget.getBoundingClientRect();
        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            sourceId: areaId
        };
        lastUpdateRef.current = performance.now();

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
        e.dataTransfer.setData('text/plain', JSON.stringify({
            type: 'menubar',
            areaType: areaType,
            areaId: areaId
        }));
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Clean up drag image and then set area to open
        requestAnimationFrame(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
            // Initialize areaToOpen with the correct position AFTER dragImage is removed
            setAreaToOpenAction({
                position: {
                    x: e.clientX,
                    y: e.clientY
                },
                area: {
                    type: areaType,
                    state: { ...areaState, sourceId: areaId }
                }
            });
        });

        // Attach global listener
        document.addEventListener('dragover', globalDragOverHandler);
    }, [params, setAreaToOpenAction, globalDragOverHandler]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        // If it's a tab being reorganized, let AreaTabs.tsx handle it
        if (e.dataTransfer.types.includes('karmyc/tab-drag-source')) {
            // Don't call e.preventDefault() here to allow the event to "bubble up"
            // to AreaTabs if needed, or be ignored by this element
            return;
        }
        // For all other drag types (e.g. a new area from the menubar),
        // handle dragOver as usual
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        // If the drag source is a tab (for reorganization), AreaTabs.tsx should handle it
        // Stop processing here to avoid conflicts or duplication
        // First check if e.dataTransfer.getData was called without error
        let sourceData;
        try {
            const dataString = e.dataTransfer.getData('text/plain');
            if (dataString) {
                sourceData = JSON.parse(dataString);
            }
        } catch (error) {
            // Ignore error if getData fails (e.g. native file drag)
            console.warn('[DropZone] handleDrop - Could not parse drag data', error);
            cleanupTemporaryStates();
            return;
        }

        if (sourceData && sourceData.type === 'tab') {
            console.warn('[DropZone] handleDrop - Received "tab" type drag, assuming handled by AreaTabs. Aborting here.');
            // It's important NOT to call e.preventDefault() or e.stopPropagation() here,
            // to ensure that AreaTabs.tsx's handleDrop can execute
            cleanupTemporaryStates(); // Clean up in case areaToOpen was activated by mistake
            return;
        }

        // Rest of handleDrop logic for other data types...
        e.preventDefault();
        e.stopPropagation();

        if (!sourceData) {
            console.warn('[DropZone] handleDrop - Invalid or missing source data type after tab check');
            cleanupTemporaryStates();
            return;
        }

        const sourceAreaId = sourceData.areaId;
        let targetAreaId: string | null = null;

        const elementsUnderCursor = document.elementsFromPoint(e.clientX, e.clientY);

        for (const element of elementsUnderCursor) {
            if (element.classList.contains('global-drag-overlay') || element.classList.contains('areaToOpenContainer')) {
                continue;
            }
            const areaElement = element.closest<HTMLElement>('[data-areaid]');

            if (areaElement) {
                const potentialTargetId = areaElement.dataset.areaid;

                if (potentialTargetId && potentialTargetId !== '-1' && potentialTargetId !== sourceAreaId) {
                    // Utiliser la fonction utilitaire pour vérifier si c'est un enfant de stack
                    if (!isAreaChildOfStack(potentialTargetId, layout)) {
                        targetAreaId = potentialTargetId;
                        break;
                    }
                }
            }
        }

        if (!targetAreaId) {
            console.warn('[DropZone] handleDrop: no targetAreaId found');
            cleanupTemporaryStates();
            return;
        }

        try {
            updatePosition(e.clientX, e.clientY);

            // Check if dropping on a stack in stack mode
            const isStack = Object.values(layout).some(layoutItem =>
                layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.id === targetAreaId
            );

            if (isStack && calculatedPlacement === 'stack') {
                // Add area as a new tab in the stack
                const stackLayout = Object.values(layout).find(layoutItem =>
                    layoutItem.type === 'area_row' &&
                    layoutItem.orientation === 'stack' &&
                    layoutItem.id === targetAreaId
                ) as AreaRowLayout;

                if (stackLayout) {
                    // Find source area in layout
                    const sourceRow = Object.values(layout).find(layoutItem =>
                        layoutItem.type === 'area_row' &&
                        layoutItem.areas.some(area => area.id === sourceAreaId)
                    ) as AreaRowLayout;

                    if (sourceRow) {
                        // Remove source area from its row
                        const updatedSourceAreas = sourceRow.areas.filter(area => area.id !== sourceAreaId);

                        // Redistribute sizes of remaining areas
                        const totalSize = updatedSourceAreas.reduce((sum, area) => sum + area.size, 0);
                        const normalizedAreas = updatedSourceAreas.map(area => ({
                            ...area,
                            size: totalSize > 0 ? area.size / totalSize : 1 / updatedSourceAreas.length
                        }));

                        // Update source row layout
                        updateLayout({
                            ...sourceRow,
                            areas: normalizedAreas
                        });
                    }

                    // Update stack layout
                    const updatedLayout = {
                        ...stackLayout,
                        areas: [...stackLayout.areas, { id: sourceAreaId, size: 1 }]
                    };
                    updateLayout(updatedLayout);
                    // Lock area that was just dropped into the stack
                    useKarmycStore.getState().updateArea({ id: sourceAreaId, isLocked: true });
                    cleanupTemporaryStates();
                }
            } else {
                // If creating a new stack, lock both areas
                if (calculatedPlacement === 'stack') {
                    useKarmycStore.getState().updateArea({ id: sourceAreaId, isLocked: true });
                    useKarmycStore.getState().updateArea({ id: targetAreaId, isLocked: true });
                }
                finalizeAreaPlacementAction({ targetId: targetAreaId, placement: calculatedPlacement });
                cleanupTemporaryStates();
            }
        } catch (error) {
            console.error('[DropZone] handleDrop - Error during finalization:', error);
            cleanupTemporaryStates();
        }

    }, [cleanupTemporaryStates, finalizeAreaPlacementAction, updatePosition, calculatedPlacement, layout, updateLayout]);

    const handleDragEnd = useCallback(() => {
        // Reactivate text selection at the end of the drag
        document.body.style.userSelect = '';

        if (!dragRef.current) return;

        if (rafRef.current) {
            cancelAnimationFrame(rafRef.current);
        }

        // Check if the drag lasted long enough
        const dragDuration = performance.now() - lastUpdateRef.current;
        if (dragDuration < 100) {
            return;
        }

        dragRef.current = null;
        cleanupTemporaryStates();

        // Detach global listener
        document.removeEventListener('dragover', globalDragOverHandler);
    }, [cleanupTemporaryStates, globalDragOverHandler]);

    // Cleanup RAF on unmount
    useEffect(() => {
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, []);

    return {
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop,
        areaToOpenTargetId,
        areaToOpenTargetViewport,
        calculatedPlacement
    };
};

export default useAreaDragAndDrop; 
