import { AnyAction } from '@reduxjs/toolkit';
import { IActionValidationResult, TActionValidator } from '../types/actions';

/**
 * Validator that checks if the action has a payload
 */
export const hasPayload: TActionValidator = (action: AnyAction): IActionValidationResult => {
    if (!action.payload) {
        return {
            valid: false,
            message: `Action ${action.type} has no payload`
        };
    }
    return { valid: true };
};

/**
 * Creates a validator that checks if the payload has certain properties
 */
export const hasRequiredFields = (fields: string[]): TActionValidator => {
    return (action: AnyAction): IActionValidationResult => {
        for (const field of fields) {
            if (action.payload && action.payload[field] === undefined) {
                return {
                    valid: false,
                    message: `Action ${action.type} is missing the required property: ${field}`
                };
            }
        }
        return { valid: true };
    };
};

/**
 * Creates a validator that checks if the payload has a valid value for a property
 */
export const hasValidValue = <T>(field: string, validator: (value: T) => boolean, errorMessage?: string): TActionValidator => {
    return (action: AnyAction): IActionValidationResult => {
        if (action.payload && action.payload[field] !== undefined) {
            const value = action.payload[field] as T;
            if (!validator(value)) {
                return {
                    valid: false,
                    message: errorMessage || `Action ${action.type} has an invalid value for property: ${field}`
                };
            }
        }
        return { valid: true };
    };
};

/**
 * Combines multiple validators into one
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
