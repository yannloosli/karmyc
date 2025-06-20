import React, { useCallback } from 'react';

import { useKarmycStore      } from '../core/store';
import { ContextMenuItem } from '../core/types/context-menu-types';

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
        items: ContextMenuItem[] | React.ReactNode;
        targetId?: string;
        metadata?: Record<string, any>;
        menuClassName?: string;
        menuType?: 'default' | 'switchType' | 'custom';
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
