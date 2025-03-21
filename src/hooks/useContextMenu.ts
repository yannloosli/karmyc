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
 * Hook pour gérer le menu contextuel
 * Fournit des fonctions simplifiées pour ouvrir et fermer le menu contextuel
 * 
 * @returns Un objet contenant les fonctions et les données pour manipuler le menu contextuel
 */
export const useContextMenu = () => {
    const dispatch = useDispatch();

    // Sélecteurs
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
        // État
        isVisible,
        position,

        // Actions
        open,
        close,
    };
} 
