import { useCallback } from 'react';

import { useKarmycStore      } from '../data/mainStore';
import { ContextMenuItem } from '../data/types/context-menu-types';

/**
 * Hook for managing the context menu
 * Provides simplified functions to open and close the context menu
 */
export const useContextMenu = () => {
    // Selectors
    const isVisible = useKarmycStore((state) => state.contextMenu.isVisible);
    const position = useKarmycStore((state) => state.contextMenu.position);
    const openAction = useKarmycStore((state) => state.contextMenu.openContextMenu);
    const closeAction = useKarmycStore((state) => state.contextMenu.closeContextMenu);

    // Actions
    const open = useCallback((params: {
        position: { x: number; y: number };
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
        menuClassName?: string;
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
