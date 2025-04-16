import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { actionRegistry } from '../store/registries/actionRegistry';
import { IAction } from '../types/actions';

/**
 * Hook pour enregistrer une nouvelle action
 */
export function useRegisterAction<T extends IAction>() {
    const dispatch = useDispatch();

    return useCallback((action: T) => {
        actionRegistry.registerPlugin(action);
    }, [dispatch]);
} 
