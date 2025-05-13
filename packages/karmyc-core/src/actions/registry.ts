import {
    Action,
    IActionPlugin,
    IActionRegistry,
    IActionRegistryOptions,
    IActionValidationResult,
    TActionValidator
} from '../types/actions';

/**
 * Action Registry
 * Manages the registration and execution of action plugins
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
     * Registers an action plugin
     */
    registerPlugin(plugin: IActionPlugin): void {
        this.plugins.push(plugin);
        // Sort by priority (higher priority = executed first)
        this.plugins.sort((a, b) => b.priority - a.priority);

        // Call onRegister if it exists
        if (plugin.onRegister) {
            plugin.onRegister();
        }

        if (this.options.enableLogging) {
            console.log(`Action plugin registered: ${plugin.id} with priority ${plugin.priority}`);
        }
    }

    /**
     * Unregisters an action plugin by its ID
     */
    unregisterPlugin(id: string): void {
        const plugin = this.plugins.find(p => p.id === id);

        // Call onUnregister if it exists
        if (plugin && plugin.onUnregister) {
            plugin.onUnregister();
        }

        this.plugins = this.plugins.filter(plugin => plugin.id !== id);

        if (this.options.enableLogging) {
            console.log(`Action plugin unregistered: ${id}`);
        }
    }

    /**
     * Registers a validator for a specific action type
     */
    registerValidator(actionType: string, validator: TActionValidator): void {
        if (!this.validators[actionType]) {
            this.validators[actionType] = [];
        }
        this.validators[actionType].push(validator);

        if (this.options.enableLogging) {
            console.log(`Validator registered for action type: ${actionType}`);
        }
    }

    /**
     * Unregisters all validators for an action type
     */
    unregisterValidators(actionType: string): void {
        delete this.validators[actionType];

        if (this.options.enableLogging) {
            console.log(`Validators unregistered for action type: ${actionType}`);
        }
    }

    /**
     * Validates an action
     */
    validateAction(action: Action): IActionValidationResult {
        const validators = this.validators[action.type] || [];

        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                if (this.options.enableLogging) {
                    console.warn(`Action validation failed: ${result.message}`);
                }
                return result;
            }
        }

        return { valid: true };
    }

    /**
     * Handles an action by sending it to all relevant plugins
     */
    handleAction(action: Action): void {
        // Validate the action
        const validationResult = this.validateAction(action);
        if (!validationResult.valid) {
            console.warn(`Invalid action: ${validationResult.message}`);
            return;
        }

        // Execute plugin handlers
        for (const plugin of this.plugins) {
            // Check if the plugin handles this action type
            if (plugin.actionTypes === null || plugin.actionTypes.includes(action.type)) {
                try {
                    plugin.handler(action);
                } catch (error) {
                    console.error(`Error in plugin ${plugin.id}:`, error);
                }
            }
        }
    }
}

// Export a singleton instance
export const actionRegistry = new ActionRegistry();

// Export the class to allow custom instances
export { ActionRegistry };
