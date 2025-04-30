import { Action, IActionPlugin, TActionValidator } from '../../types/actions';
import { ActionPriority } from '../priorities';

interface IValidationRule {
    actionType: string;
    validator: TActionValidator;
    message: string;
}

class ValidationRegistry {
    private rules: IValidationRule[] = [];

    addRule(rule: IValidationRule) {
        this.rules.push(rule);
    }

    removeRule(actionType: string) {
        this.rules = this.rules.filter(rule => rule.actionType !== actionType);
    }

    getRulesForAction(actionType: string): IValidationRule[] {
        return this.rules.filter(rule => rule.actionType === actionType);
    }

    clear() {
        this.rules = [];
    }
}

const validationRegistry = new ValidationRegistry();

export const validationPlugin: IActionPlugin = {
    id: 'validation',
    priority: ActionPriority.CRITICAL,
    actionTypes: null, // Handle all actions
    handler: (action: Action) => {
        const rules = validationRegistry.getRulesForAction(action.type);

        for (const rule of rules) {
            const result = rule.validator(action);
            if (!result.valid) {
                console.error(`Validation failed for ${action.type}: ${rule.message}`);
                // Here we could trigger an error notification or handle the error differently
            }
        }
    }
};

// Export for validation registry access
export { validationRegistry };

// Predefined validation rules
export const predefinedRules = {
    // Rules for area actions
    area: {
        addArea: {
            actionType: 'area/addArea',
            validator: (action: Action) => {
                if (!action.payload?.id) {
                    return { valid: false, message: 'Area ID required' };
                }
                if (!action.payload?.type) {
                    return { valid: false, message: 'Area type required' };
                }
                return { valid: true };
            },
            message: 'Area validation'
        },
        updateArea: {
            actionType: 'area/updateArea',
            validator: (action: Action) => {
                if (!action.payload?.id) {
                    return { valid: false, message: 'Area ID required for update' };
                }
                if (!action.payload?.changes || Object.keys(action.payload.changes).length === 0) {
                    return { valid: false, message: 'No changes specified' };
                }
                return { valid: true };
            },
            message: 'Area update validation'
        }
    },
}; 
