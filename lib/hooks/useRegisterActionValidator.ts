import { AnyAction } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { actionRegistry } from '../actions/registry';
import { TActionValidator } from '../types/actions';

/**
 * Hook to register an action validator
 */
export function useRegisterActionValidator<T extends AnyAction = AnyAction>(
    actionType: string,
    validator: TActionValidator<T>
): void {
    useEffect(() => {
        actionRegistry.registerValidator(actionType, validator as TActionValidator);

        // Clean up when the component unmounts
        return () => {
            actionRegistry.unregisterValidators(actionType);
        };
    }, [actionType, validator]);
} 
