import { Action, IActionValidationResult, TActionValidator } from '../types/actions';

/**
 * Validator that checks if the action has a payload
 */
export const hasPayload: TActionValidator = (action: Action): IActionValidationResult => {
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
    return (action: Action): IActionValidationResult => {
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
    return (action: Action): IActionValidationResult => {
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
    return (action: Action): IActionValidationResult => {
        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                return result;
            }
        }
        return { valid: true };
    };
};

/**
 * Validator for area actions
 */
export const areaValidator = (action: Action): IActionValidationResult => {
    const { type, payload } = action;

    switch (type) {
    case 'area/addArea':
        if (!payload?.id) {
            return { valid: false, message: 'Missing area ID' };
        }
        if (!payload?.type) {
            return { valid: false, message: 'Missing area type' };
        }
        break;
    case 'area/updateArea':
        if (!payload?.id) {
            return { valid: false, message: 'Missing area ID for update' };
        }
        break;
    case 'area/removeArea':
        if (!payload?.id) {
            return { valid: false, message: 'Missing area ID for removal' };
        }
        break;
    }

    return { valid: true };
}; 
