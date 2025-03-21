import { AnyAction } from '@reduxjs/toolkit';
import { IActionValidationResult, TActionValidator } from '../types/actions';

/**
 * Validateur qui vérifie que l'action a un payload
 */
export const hasPayload: TActionValidator = (action: AnyAction): IActionValidationResult => {
  if (!action.payload) {
    return {
      valid: false,
      message: `L'action ${action.type} n'a pas de payload`
    };
  }
  return { valid: true };
};

/**
 * Crée un validateur qui vérifie que le payload a certaines propriétés
 */
export const hasRequiredFields = (fields: string[]): TActionValidator => {
  return (action: AnyAction): IActionValidationResult => {
    for (const field of fields) {
      if (action.payload && action.payload[field] === undefined) {
        return {
          valid: false,
          message: `L'action ${action.type} n'a pas la propriété requise: ${field}`
        };
      }
    }
    return { valid: true };
  };
};

/**
 * Crée un validateur qui vérifie que le payload a une valeur valide pour une propriété
 */
export const hasValidValue = <T>(field: string, validator: (value: T) => boolean, errorMessage?: string): TActionValidator => {
  return (action: AnyAction): IActionValidationResult => {
    if (action.payload && action.payload[field] !== undefined) {
      const value = action.payload[field] as T;
      if (!validator(value)) {
        return {
          valid: false,
          message: errorMessage || `L'action ${action.type} a une valeur invalide pour la propriété: ${field}`
        };
      }
    }
    return { valid: true };
  };
};

/**
 * Combine plusieurs validateurs en un seul
 */
export const combineValidators = (...validators: TActionValidator[]): TActionValidator => {
  return (action: AnyAction): IActionValidationResult => {
    for (const validator of validators) {
      const result = validator(action);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  };
}; 
