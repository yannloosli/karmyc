import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    closeContextMenu,
    openContextMenu,
    selectContextMenuItems,
    selectContextMenuMetadata,
    selectContextMenuPosition,
    selectContextMenuTargetId,
    selectContextMenuVisible,
    updateContextMenuItems,
    updateContextMenuPosition
} from '../store/slices/contextMenuSlice';
import { IContextMenuItem, IContextMenuPosition } from '../types/contextMenu';

/**
 * Hook pour gérer le menu contextuel
 * Fournit des fonctions pour ouvrir, fermer et mettre à jour le menu contextuel
 */
export function useContextMenu() {
  const dispatch = useDispatch();
  
  // Sélecteurs
  const isVisible = useSelector(selectContextMenuVisible);
  const position = useSelector(selectContextMenuPosition);
  const items = useSelector(selectContextMenuItems);
  const targetId = useSelector(selectContextMenuTargetId);
  const metadata = useSelector(selectContextMenuMetadata);
  
  // Actions
  const openMenu = useCallback(({
    position,
    items,
    targetId,
    metadata
  }: {
    position: IContextMenuPosition;
    items: IContextMenuItem[];
    targetId?: string;
    metadata?: Record<string, any>;
  }) => {
    dispatch(openContextMenu({ position, items, targetId, metadata }));
  }, [dispatch]);
  
  const closeMenu = useCallback(() => {
    dispatch(closeContextMenu());
  }, [dispatch]);
  
  const updatePosition = useCallback((newPosition: IContextMenuPosition) => {
    dispatch(updateContextMenuPosition(newPosition));
  }, [dispatch]);
  
  const updateItems = useCallback((newItems: IContextMenuItem[]) => {
    dispatch(updateContextMenuItems(newItems));
  }, [dispatch]);

  return {
    // État
    isVisible,
    position,
    items,
    targetId,
    metadata,
    
    // Actions
    openMenu,
    closeMenu,
    updatePosition,
    updateItems,
  };
} 
