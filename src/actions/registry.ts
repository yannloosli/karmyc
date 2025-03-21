import { AnyAction } from '@reduxjs/toolkit';
import {
    IActionPlugin,
    IActionRegistry,
    IActionRegistryOptions,
    IActionValidationResult,
    TActionValidator
} from '../types/actions';

/**
 * Registre d'actions
 * Gère l'enregistrement et l'exécution des plugins d'actions
 */
class ActionRegistry implements IActionRegistry {
    private plugins: IActionPlugin[] = [];
    private validators: Record<string, TActionValidator[]> = {};
    private options: IActionRegistryOptions;

    constructor(options: IActionRegistryOptions = {}) {
        this.options = {
            enableLogging: false,
            ...options
        };

        if (options.defaultValidators) {
            this.validators = { ...options.defaultValidators };
        }
    }

    /**
     * Enregistre un plugin d'action
     */
    registerPlugin(plugin: IActionPlugin): void {
        this.plugins.push(plugin);
        // Trier par priorité (priorité plus élevée = exécuté en premier)
        this.plugins.sort((a, b) => b.priority - a.priority);

        if (this.options.enableLogging) {
            console.log(`Plugin d'action enregistré: ${plugin.id} avec priorité ${plugin.priority}`);
        }
    }

    /**
     * Désenregistre un plugin d'action par son ID
     */
    unregisterPlugin(id: string): void {
        this.plugins = this.plugins.filter(plugin => plugin.id !== id);

        if (this.options.enableLogging) {
            console.log(`Plugin d'action désenregistré: ${id}`);
        }
    }

    /**
     * Enregistre un validateur pour un type d'action spécifique
     */
    registerValidator(actionType: string, validator: TActionValidator): void {
        if (!this.validators[actionType]) {
            this.validators[actionType] = [];
        }
        this.validators[actionType].push(validator);

        if (this.options.enableLogging) {
            console.log(`Validateur enregistré pour le type d'action: ${actionType}`);
        }
    }

    /**
     * Désenregistre tous les validateurs pour un type d'action
     */
    unregisterValidators(actionType: string): void {
        delete this.validators[actionType];

        if (this.options.enableLogging) {
            console.log(`Validateurs désenregistrés pour le type d'action: ${actionType}`);
        }
    }

    /**
     * Valide une action
     */
    validateAction(action: AnyAction): IActionValidationResult {
        const validators = this.validators[action.type] || [];

        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                if (this.options.enableLogging) {
                    console.warn(`Validation de l'action échouée: ${result.message}`);
                }
                return result;
            }
        }

        return { valid: true };
    }

    /**
     * Gère une action en l'envoyant à tous les plugins concernés
     */
    handleAction(action: AnyAction): void {
        // Valider l'action
        const validationResult = this.validateAction(action);
        if (!validationResult.valid) {
            console.warn(`Action non valide: ${validationResult.message}`);
            return;
        }

        // Exécuter les handlers des plugins
        for (const plugin of this.plugins) {
            // Vérifier si le plugin gère ce type d'action
            if (plugin.actionTypes === null || plugin.actionTypes.includes(action.type)) {
                try {
                    plugin.handler(action);
                } catch (error) {
                    console.error(`Erreur dans le plugin ${plugin.id}:`, error);
                }
            }
        }
    }
}

// Exporter une instance singleton
export const actionRegistry = new ActionRegistry();

// Exporter la classe pour permettre la création d'instances personnalisées
export { ActionRegistry };
