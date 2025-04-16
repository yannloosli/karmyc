import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    closeContextMenu,
    openContextMenu,
    selectContextMenuPosition,
    selectContextMenuVisible,
} from '../store/slices/contextMenuSlice';
import { ContextMenuItem } from '../types/contextMenu';

/**
 * Hook for managing the context menu
 * Provides simplified functions to open and close the context menu
 */
export const useContextMenu = () => {
    const dispatch = useDispatch();

    // Selectors
    const isVisible = useSelector(selectContextMenuVisible);
    const position = useSelector(selectContextMenuPosition);

    // Actions
    const open = useCallback((params: {
        position: { x: number; y: number };
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
    }) => {
        dispatch(openContextMenu(params));
    }, [dispatch]);

    const close = useCallback(() => {
        dispatch(closeContextMenu());
    }, [dispatch]);

    return {
        // State
        isVisible,
        position,

        // Actions
        open,
        close,
    };
} 
