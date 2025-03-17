import { AnyAction } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { actionRegistry } from '../actions/registry';
import { TActionValidator } from '../types/actions';

/**
 * Hook pour enregistrer un validateur d'action
 * @param actionType - Type d'action à valider
 * @param validator - Fonction de validation
 */
export function useRegisterActionValidator<T extends AnyAction = AnyAction>(
  actionType: string,
  validator: TActionValidator<T>
): void {
  useEffect(() => {
    actionRegistry.registerValidator(actionType, validator as TActionValidator);
    
    // Nettoyer lors du démontage du composant
    return () => {
      actionRegistry.unregisterValidators(actionType);
    };
  }, [actionType, validator]);
} 
