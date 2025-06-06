import React, { useCallback, useRef, useEffect, useMemo } from 'react';

import { AreaRowLayout, AreaTypeValue, useKarmycStore, getAreaToOpenPlacementInViewport, getHoveredAreaId, Vec2 } from '../../core';

interface UseAreaDragAndDropParams {
    type?: AreaTypeValue;
    id?: string;
    state?: any;
}

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
    const UPDATE_INTERVAL = 16; // 60fps

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
        
        // Empêcher la sélection de texte pendant le drag
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
        // Si c'est un onglet en cours de réorganisation, on laisse AreaTabs.tsx gérer.
        if (e.dataTransfer.types.includes('karmyc/tab-drag-source')) {
            // Ne pas appeler e.preventDefault() ici pour permettre à l'événement de "remonter"
            // à AreaTabs si nécessaire, ou d'être ignoré par cet élément.
            return;
        }
        // Pour tous les autres types de drag (ex: une nouvelle area depuis la menubar),
        // on gère le dragOver comme d'habitude.
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        // Si la source du drag est un onglet (pour réorganisation), AreaTabs.tsx devrait le gérer.
        // On arrête le traitement ici pour éviter les conflits ou la duplication.
        // On vérifie d'abord si e.dataTransfer.getData a été appelé sans erreur.
        let sourceData;
        try {
            const dataString = e.dataTransfer.getData('text/plain');
            if (dataString) {
                sourceData = JSON.parse(dataString);
            }
        } catch (error) {
            // Ignorer l'erreur si getData échoue (ex: type de fichier natif glissé)
            console.warn('[DropZone] handleDrop - Could not parse drag data', error);
            cleanupTemporaryStates();
            return;
        }

        if (sourceData && sourceData.type === 'tab') {
            console.warn('[DropZone] handleDrop - Received "tab" type drag, assuming handled by AreaTabs. Aborting here.');
            // Il est important de ne PAS appeler e.preventDefault() ou e.stopPropagation() ici,
            // pour s'assurer que le handleDrop de AreaTabs.tsx puisse s'exécuter.
            cleanupTemporaryStates(); // Nettoyer au cas où areaToOpen aurait été activé par erreur.
            return;
        }

        // Le reste de la logique de handleDrop pour les autres types de données...
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
                    // Vérifier si l'area cible est un enfant d'une stack
                    const isChildOfStack = Object.values(layout).some(layoutItem =>
                        layoutItem.type === 'area_row' &&
                        layoutItem.orientation === 'stack' &&
                        layoutItem.areas.some(area => area.id === potentialTargetId)
                    );

                    if (!isChildOfStack) {
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

            // Vérifier si on drop sur une stack en mode stack
            const isStack = Object.values(layout).some(layoutItem =>
                layoutItem.type === 'area_row' &&
                layoutItem.orientation === 'stack' &&
                layoutItem.id === targetAreaId
            );

            if (isStack && calculatedPlacement === 'stack') {
                // Ajouter l'area comme un nouvel onglet dans la stack
                const stackLayout = Object.values(layout).find(layoutItem =>
                    layoutItem.type === 'area_row' &&
                    layoutItem.orientation === 'stack' &&
                    layoutItem.id === targetAreaId
                ) as AreaRowLayout;

                if (stackLayout) {
                    // Trouver la zone d'origine dans le layout
                    const sourceRow = Object.values(layout).find(layoutItem =>
                        layoutItem.type === 'area_row' &&
                        layoutItem.areas.some(area => area.id === sourceAreaId)
                    ) as AreaRowLayout;

                    if (sourceRow) {
                        // Supprimer la zone d'origine de sa rangée
                        const updatedSourceAreas = sourceRow.areas.filter(area => area.id !== sourceAreaId);

                        // Redistribuer les tailles des zones restantes
                        const totalSize = updatedSourceAreas.reduce((sum, area) => sum + area.size, 0);
                        const normalizedAreas = updatedSourceAreas.map(area => ({
                            ...area,
                            size: totalSize > 0 ? area.size / totalSize : 1 / updatedSourceAreas.length
                        }));

                        // Mettre à jour le layout de la rangée source
                        updateLayout({
                            ...sourceRow,
                            areas: normalizedAreas
                        });
                    }

                    // Mettre à jour le layout de la stack
                    const updatedLayout = {
                        ...stackLayout,
                        areas: [...stackLayout.areas, { id: sourceAreaId, size: 1 }]
                    };
                    updateLayout(updatedLayout);
                    // Verrouiller l'area qui vient d'être déposée dans la stack
                    useKarmycStore.getState().updateArea({ id: sourceAreaId, isLocked: true });
                    cleanupTemporaryStates();
                }
            } else {
                // Si on crée une nouvelle stack, on verrouille les deux areas
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

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        // Réactiver la sélection de texte à la fin du drag
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
