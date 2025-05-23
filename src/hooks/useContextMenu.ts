import { useCallback } from 'react';

import { useContextMenuStore } from '../stores/contextMenuStore';
import { ContextMenuItem } from '../types/contextMenu';

/**
 * Hook for managing the context menu
 * Provides simplified functions to open and close the context menu
 */
export const useContextMenu = () => {
    // Selectors
    const isVisible = useContextMenuStore((state) => state.isVisible);
    const position = useContextMenuStore((state) => state.position);
    const openAction = useContextMenuStore((state) => state.openContextMenu);
    const closeAction = useContextMenuStore((state) => state.closeContextMenu);

    // Actions
    const open = useCallback((params: {
        position: { x: number; y: number };
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
    }) => {
        openAction(params);
    }, [openAction]);

    const close = useCallback(() => {
        closeAction();
    }, [closeAction]);

    return {
        // State
        isVisible,
        position,

        // Actions
        open,
        close,
    };
} 
