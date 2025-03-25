import React, { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen, updateAreaToOpenPosition } from '../store/slices/areaSlice';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getHoveredAreaId } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';
import { Vec2 } from '../utils/math/vec2';

const getAdjustedPosition = (x: number, y: number, offset: Vec2 | null) => {
    if (!offset) return { x, y };
    return {
        x: x - offset.x,
        y: y - offset.y
    };
};

const useAreaDragAndDrop = () => {
    const dispatch = useDispatch();
    const areaState = useSelector((state: RootState) => state.area);
    const isDraggingRef = React.useRef(false);
    const offsetRef = React.useRef<Vec2 | null>(null);
    const lastPositionRef = React.useRef<Vec2 | null>(null);
    const dragOverRef = React.useRef(false);
    const dragStartTimeRef = React.useRef<number>(0);
    const lastDragOverTimeRef = React.useRef<number>(0);
    const hasReceivedDragOverRef = React.useRef(false);
    const isDragActiveRef = React.useRef(false);

    // Calculer areaToViewport à partir du layout et des viewports
    const areaToViewport = React.useMemo(() => {
        const rootViewport = getAreaRootViewport();
        return computeAreaToViewport(areaState.layout, areaState.rootId, rootViewport);
    }, [areaState.layout, areaState.rootId]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        console.log('useAreaDragAndDrop - handleDragStart');
        isDraggingRef.current = true;
        isDragActiveRef.current = true;
        dragOverRef.current = false;
        hasReceivedDragOverRef.current = false;
        dragStartTimeRef.current = Date.now();
        lastDragOverTimeRef.current = 0;
        const rect = e.currentTarget.getBoundingClientRect();

        // Calculer le décalage initial avec plus de précision
        offsetRef.current = Vec2.new(
            e.clientX - rect.left,
            e.clientY - rect.top
        );

        // Stocker la position initiale
        lastPositionRef.current = Vec2.new(e.clientX, e.clientY);

        // Initialiser areaToOpen avec une zone par défaut
        const position = getAdjustedPosition(e.clientX, e.clientY, offsetRef.current);
        const sourceId = (e.currentTarget as HTMLElement).getAttribute('data-source-id');

        if (!sourceId) {
            console.warn('useAreaDragAndDrop - Pas de sourceId trouvé');
            isDraggingRef.current = false;
            isDragActiveRef.current = false;
            return;
        }

        // Créer une image de drag invisible
        const dragImage = document.createElement('div');
        dragImage.style.width = '1px';
        dragImage.style.height = '1px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1px';
        dragImage.style.left = '-1px';
        dragImage.style.opacity = '0.01';
        document.body.appendChild(dragImage);

        // Configurer l'effet de drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sourceId); // Stocker le sourceId
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Nettoyer l'image de drag après un court délai
        setTimeout(() => {
            document.body.removeChild(dragImage);
        }, 0);

        // Initialiser areaToOpen d'abord
        dispatch(setAreaToOpen({
            position: { x: position.x, y: position.y },
            area: {
                type: 'image-viewer',
                state: { sourceId }
            }
        }));

        // Puis mettre à jour la position
        dispatch(updateAreaToOpenPosition(position));

        console.log('useAreaDragAndDrop - État initial:', {
            offset: offsetRef.current,
            position: lastPositionRef.current,
            sourceId
        });
    }, [dispatch]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Limiter la fréquence des mises à jour
        const now = Date.now();
        if (now - lastDragOverTimeRef.current < 16) { // ~60fps
            return;
        }
        lastDragOverTimeRef.current = now;

        dragOverRef.current = true;
        hasReceivedDragOverRef.current = true;
        isDragActiveRef.current = true;
        console.log('useAreaDragAndDrop - handleDragOver');

        if (isDraggingRef.current && lastPositionRef.current) {
            const position = getAdjustedPosition(e.clientX, e.clientY, offsetRef.current);
            dispatch(updateAreaToOpenPosition(position));
            lastPositionRef.current = Vec2.new(e.clientX, e.clientY);
        }
    }, [dispatch]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        console.log('useAreaDragAndDrop - handleDragEnd');

        // Vérifier si le drag a duré assez longtemps et si on a reçu au moins un DragOver
        const dragDuration = Date.now() - dragStartTimeRef.current;
        if (dragDuration < 100 || !hasReceivedDragOverRef.current || !isDragActiveRef.current) {
            console.log('useAreaDragAndDrop - Drag trop court ou pas de DragOver reçu, ignoré');
            return;
        }

        if (!isDraggingRef.current || dragOverRef.current) {
            console.log('useAreaDragAndDrop - Ignore DragEnd: drag toujours en cours ou over');
            return;
        }

        isDraggingRef.current = false;
        isDragActiveRef.current = false;
        dragOverRef.current = false;
        hasReceivedDragOverRef.current = false;
        offsetRef.current = null;
        lastPositionRef.current = null;
        dragStartTimeRef.current = 0;
        lastDragOverTimeRef.current = 0;
        dispatch(clearAreaToOpen());
    }, [dispatch]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        if (!isDraggingRef.current) return;

        e.preventDefault();
        e.stopPropagation();

        console.log('useAreaDragAndDrop - handleDrop - dropEffect:', e.dataTransfer.dropEffect);

        // Calculer la position finale ajustée
        const position = getAdjustedPosition(e.clientX, e.clientY, offsetRef.current);
        const positionVec2 = Vec2.new(position.x, position.y);
        const hoveredAreaId = getHoveredAreaId(positionVec2, areaState, areaToViewport);

        // Si la souris est sur une zone valide, finaliser le placement
        if (hoveredAreaId) {
            dispatch(finalizeAreaPlacement());
        } else {
            dispatch(clearAreaToOpen());
        }

        // Nettoyer l'état
        isDraggingRef.current = false;
        offsetRef.current = null;
        lastPositionRef.current = null;
    }, [dispatch, areaState, areaToViewport]);

    return {
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop,
        isDragging: isDraggingRef.current
    };
};

export default useAreaDragAndDrop; 
