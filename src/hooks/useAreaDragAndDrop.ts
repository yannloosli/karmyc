import React, { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../store';
import { clearAreaToOpen, finalizeAreaPlacement, setAreaToOpen, updateAreaToOpenPosition } from '../store/slices/areaSlice';
import { computeAreaToViewport } from '../utils/areaToViewport';
import { getHoveredAreaId } from '../utils/areaUtils';
import { getAreaRootViewport } from '../utils/getAreaViewport';
import { Vec2 } from '../utils/math/vec2';

const useAreaDragAndDrop = () => {
    const dispatch = useDispatch();
    const areaState = useSelector((state: RootState) => state.area);
    const dragRef = useRef<{ startX: number; startY: number; sourceId: string | null } | null>(null);
    const lastUpdateRef = useRef<number>(0);
    const UPDATE_INTERVAL = 32; // Réduire à 30fps

    // Calculer areaToViewport à partir du layout et des viewports
    const areaToViewport = React.useMemo(() => {
        const rootViewport = getAreaRootViewport();
        return computeAreaToViewport(areaState.layout, areaState.rootId, rootViewport);
    }, [areaState.layout, areaState.rootId]);

    const handleDragStart = useCallback((e: React.DragEvent) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const sourceId = (e.currentTarget as HTMLElement).getAttribute('data-source-id');

        if (!sourceId) {
            console.warn('useAreaDragAndDrop - Pas de sourceId trouvé');
            return;
        }

        dragRef.current = {
            startX: e.clientX - rect.left,
            startY: e.clientY - rect.top,
            sourceId
        };

        // Créer une image de drag invisible
        const dragImage = document.createElement('div');
        dragImage.style.width = '1px';
        dragImage.style.height = '1px';
        dragImage.style.position = 'fixed';
        dragImage.style.top = '-1px';
        dragImage.style.left = '-1px';
        dragImage.style.opacity = '0.01';
        dragImage.style.pointerEvents = 'none';
        document.body.appendChild(dragImage);

        // Configurer l'effet de drag
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', sourceId);
        e.dataTransfer.setDragImage(dragImage, 0, 0);

        // Initialiser areaToOpen directement avec la position du curseur
        // pour que l'aperçu soit centré dès le départ sur la souris
        dispatch(setAreaToOpen({
            position: { x: e.clientX, y: e.clientY },
            area: {
                type: 'image-viewer',
                state: { sourceId }
            }
        }));

        // Nettoyer l'image de drag
        requestAnimationFrame(() => {
            if (document.body.contains(dragImage)) {
                document.body.removeChild(dragImage);
            }
        });
    }, [dispatch]);

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
            dispatch(updateAreaToOpenPosition(position));
            lastUpdateRef.current = now;
        }
    }, [dispatch]);

    const handleDragEnd = useCallback((e: React.DragEvent) => {
        if (!dragRef.current) return;

        // Vérifier si le drag a duré assez longtemps
        const dragDuration = Date.now() - lastUpdateRef.current;
        if (dragDuration < 100) {
            console.log('useAreaDragAndDrop - Drag trop court, ignoré');
            return;
        }

        dragRef.current = null;
        dispatch(clearAreaToOpen());
    }, [dispatch]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!dragRef.current) return;

        const position = {
            x: e.clientX,
            y: e.clientY
        };

        const positionVec2 = Vec2.new(position.x, position.y);
        const hoveredAreaId = getHoveredAreaId(positionVec2, areaState, areaToViewport);

        if (hoveredAreaId) {
            dispatch(finalizeAreaPlacement());
        } else {
            dispatch(clearAreaToOpen());
        }

        dragRef.current = null;
    }, [dispatch, areaState, areaToViewport]);

    return {
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleDrop
    };
};

export default useAreaDragAndDrop; 
