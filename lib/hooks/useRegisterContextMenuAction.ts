import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { contextMenuRegistry } from '../store/registries/contextMenuRegistry';
import { IContextMenuAction } from '../types/contextMenu';

/**
 * Hook pour enregistrer une nouvelle action de menu contextuel
 */
export function useRegisterContextMenuAction() {
    const dispatch = useDispatch();

    return useCallback((menuType: string, action: IContextMenuAction) => {
        contextMenuRegistry.registerAction(menuType, action);
    }, [dispatch]);
} 
