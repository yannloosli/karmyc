import {
    Action,
    IActionPlugin,
    IActionRegistry,
    IActionRegistryOptions,
    IActionValidationResult,
    TActionValidator
} from '../types/actions';

/**
 * Métadonnées d'une action.
 */
export interface ActionMetadata {
    menuType?: string;
    label?: string;
    icon?: string;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
    order?: number;
    actionType?: string;
}

/**
 * Handler d'action.
 */
export interface ActionHandler {
    (params: any): void;
}

/**
 * Action Registry
 * Gère l'enregistrement et l'exécution des actions et plugins
 */
class ActionRegistry implements IActionRegistry {
    private plugins: Map<string, IActionPlugin> = new Map();
    private validators: Map<string, TActionValidator[]> = new Map();
    private actionHandlers: Map<string, { handler: ActionHandler; metadata?: ActionMetadata }> = new Map();
    private menuActionsByType: Map<string, Set<string>> = new Map();
    // @ts-expect-error - options is used in the next line
    private options: IActionRegistryOptions;
    private actionTypes: Set<string> = new Set();

    constructor(options: IActionRegistryOptions = {}) {
        this.options = {
            ...options
        };

        if (options.defaultValidators) {
            this.validators = new Map(Object.entries(options.defaultValidators));
        }
    }

    /**
     * Enregistre un plugin d'action
     */
    registerPlugin(plugin: IActionPlugin): void {
        this.plugins.set(plugin.id, plugin);

        // Call onRegister if it exists
        if (plugin.onRegister) {
            plugin.onRegister();
        }
    }

    /**
     * Désenregistre un plugin d'action
     */
    unregisterPlugin(id: string): void {
        const plugin = this.plugins.get(id);

        if (plugin?.onUnregister) {
            plugin.onUnregister();
        }

        this.plugins.delete(id);
    }

    /**
     * Enregistre un validateur pour un type d'action
     */
    registerValidator(actionType: string, validator: TActionValidator): void {
        const existing = this.validators.get(actionType) || [];
        this.validators.set(actionType, [...existing, validator]);
    }

    /**
     * Désenregistre tous les validateurs pour un type d'action
     */
    unregisterValidators(actionType: string): void {
        this.validators.delete(actionType);
    }

    /**
     * Enregistre un gestionnaire d'action avec métadonnées optionnelles
     */
    registerActionHandler(actionId: string, handler: ActionHandler, metadata?: ActionMetadata): void {
        this.actionHandlers.set(actionId, { handler, metadata });

        if (metadata?.menuType) {
            const menuActions = this.menuActionsByType.get(metadata.menuType) || new Set();
            menuActions.add(actionId);
            this.menuActionsByType.set(metadata.menuType, menuActions);
        }
    }

    /**
     * Désenregistre un gestionnaire d'action
     */
    unregisterActionHandler(actionId: string): void {
        const action = this.actionHandlers.get(actionId);
        if (action?.metadata?.menuType) {
            const menuActions = this.menuActionsByType.get(action.metadata.menuType);
            if (menuActions) {
                menuActions.delete(actionId);
                if (menuActions.size === 0) {
                    this.menuActionsByType.delete(action.metadata.menuType);
                }
            }
        }
        this.actionHandlers.delete(actionId);
    }

    /**
     * Valide une action
     */
    validateAction(action: Action): IActionValidationResult {
        const validators = this.validators.get(action.type) || [];

        for (const validator of validators) {
            const result = validator(action);
            if (!result.valid) {
                return result;
            }
        }

        return { valid: true };
    }

    /**
     * Gère une action en l'envoyant aux plugins pertinents
     */
    handleAction(action: Action): void {
        const validationResult = this.validateAction(action);
        if (!validationResult.valid) {
            console.warn(`Invalid action: ${validationResult.message}`);
            return;
        }

        const sortedPlugins = Array.from(this.plugins.values())
            .sort((a, b) => b.priority - a.priority);

        for (const plugin of sortedPlugins) {
            if (plugin.actionTypes === null || plugin.actionTypes.includes(action.type)) {
                try {
                    plugin.handler(action);
                } catch (error) {
                    console.error(`Error in plugin ${plugin.id}:`, error);
                }
            }
        }
    }

    /**
     * Exécute une action spécifique
     */
    executeAction(actionId: string, params: any): boolean {
        const action = this.actionHandlers.get(actionId);
        if (action?.handler) {
            action.handler(params);
            return true;
        }
        return false;
    }

    /**
     * Récupère les actions disponibles pour un type de menu
     */
    getMenuActions(menuType: string): Array<{ id: string; handler: ActionHandler } & ActionMetadata> {
        const actionIds = this.menuActionsByType.get(menuType) || new Set();
        return Array.from(actionIds)
            .map(id => {
                const action = this.actionHandlers.get(id);
                return action ? { id, ...action } : null;
            })
            .filter((action): action is { id: string; handler: ActionHandler } & ActionMetadata =>
                action !== null && action.metadata !== undefined
            )
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }

    /**
     * Enregistre un nouveau type d'action
     */
    registerActionType(type: string): void {
        this.actionTypes.add(type);
    }

    /**
     * Récupère tous les types d'actions enregistrés
     */
    getActionTypes(): string[] {
        return Array.from(this.actionTypes);
    }

    /**
     * Vérifie si un type d'action est enregistré
     */
    hasActionType(type: string): boolean {
        return this.actionTypes.has(type);
    }

    /**
     * Génère la clé de traduction de la description d'une action
     */
    getActionDescription(type: string): string {
        return `desc.${type}`;
    }
}

// Export une instance singleton
export const actionRegistry = new ActionRegistry();

// Export the class to allow custom instances
export { ActionRegistry };
