import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    closeContextMenu,
    openContextMenu,
    openCustomContextMenu,
    selectContextMenuErrors,
    selectContextMenuItems,
    selectContextMenuMetadata,
    selectContextMenuPosition,
    selectContextMenuTargetId,
    selectContextMenuVisible,
    selectCustomContextMenu,
    updateContextMenuItems,
    updateContextMenuPosition
} from '../store/slices/contextMenuSlice';
import { ContextMenuItem, IContextMenuPosition, OpenCustomContextMenuOptions } from '../types/contextMenu';

/**
 * Hook pour gérer le menu contextuel
 * Fournit des fonctions pour ouvrir, fermer et mettre à jour le menu contextuel
 */
export const useContextMenu = () => {
    const dispatch = useDispatch();

    // Sélecteurs
    const isVisible = useSelector(selectContextMenuVisible);
    const position = useSelector(selectContextMenuPosition);
    const items = useSelector(selectContextMenuItems);
    const targetId = useSelector(selectContextMenuTargetId);
    const metadata = useSelector(selectContextMenuMetadata);
    const customMenu = useSelector(selectCustomContextMenu);
    const errors = useSelector(selectContextMenuErrors);

    // Actions
    const open = useCallback((params: {
        position: { x: number; y: number };
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
    }) => {
        dispatch(openContextMenu(params));
    }, [dispatch]);

    const openCustom = useCallback((options: OpenCustomContextMenuOptions) => {
        dispatch(openCustomContextMenu(options));
    }, [dispatch]);

    const close = useCallback(() => {
        dispatch(closeContextMenu());
    }, [dispatch]);

    const updatePosition = useCallback((newPosition: IContextMenuPosition) => {
        dispatch(updateContextMenuPosition(newPosition));
    }, [dispatch]);

    const updateItems = useCallback((newItems: ContextMenuItem[]) => {
        dispatch(updateContextMenuItems(newItems));
    }, [dispatch]);

    return {
        // État
        isVisible,
        position,
        items,
        targetId,
        metadata,
        customMenu,
        errors,

        // Actions
        open,
        openCustom,
        close,
        updatePosition,
        updateItems,
    };
} 
