import { AnyAction } from '@reduxjs/toolkit';
import { IActionPlugin, TActionValidator } from '../../types/actions';
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
    actionTypes: null,
    handler: (action: AnyAction) => {
        const rules = validationRegistry.getRulesForAction(action.type);

        for (const rule of rules) {
            const result = rule.validator(action);
            if (!result.valid) {
                console.error(`Validation échouée pour ${action.type}: ${rule.message}`);
                // On pourrait ici dispatcher une action d'erreur ou gérer l'erreur différemment
            }
        }
    }
};

// Export pour l'accès au registre de validation
export { validationRegistry };

// Règles de validation prédéfinies
export const predefinedRules = {
    // Règle pour les actions de zone
    area: {
        addArea: {
            actionType: 'area/addArea',
            validator: (action: AnyAction) => {
                if (!action.payload?.id) {
                    return { valid: false, message: 'ID de zone requis' };
                }
                if (!action.payload?.type) {
                    return { valid: false, message: 'Type de zone requis' };
                }
                return { valid: true };
            },
            message: 'Validation de la zone'
        },
        updateArea: {
            actionType: 'area/updateArea',
            validator: (action: AnyAction) => {
                if (!action.payload?.id) {
                    return { valid: false, message: 'ID de zone requis pour la mise à jour' };
                }
                if (!action.payload?.changes || Object.keys(action.payload.changes).length === 0) {
                    return { valid: false, message: 'Aucun changement spécifié' };
                }
                return { valid: true };
            },
            message: 'Validation de la mise à jour de zone'
        }
    },
}; 
