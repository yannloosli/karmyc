import { Action, IActionPlugin, IActionRegistry, IActionRegistryOptions, IActionValidationResult, TActionValidator } from '../../types/actions';
type ActionHandler = (params: any) => void;
interface ActionMetadata {
    menuType?: string;
    label?: string;
    icon?: string;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
    order?: number;
}
/**
 * Action Registry
 * Gère l'enregistrement et l'exécution des actions et plugins
 */
declare class ActionRegistry implements IActionRegistry {
    private plugins;
    private validators;
    private actionHandlers;
    private menuActionsByType;
    private options;
    constructor(options?: IActionRegistryOptions);
    /**
     * Enregistre un plugin d'action
     */
    registerPlugin(plugin: IActionPlugin): void;
    /**
     * Désenregistre un plugin d'action
     */
    unregisterPlugin(id: string): void;
    /**
     * Enregistre un validateur pour un type d'action
     */
    registerValidator(actionType: string, validator: TActionValidator): void;
    /**
     * Désenregistre tous les validateurs pour un type d'action
     */
    unregisterValidators(actionType: string): void;
    /**
     * Enregistre un gestionnaire d'action avec métadonnées optionnelles
     */
    registerActionHandler(actionId: string, handler: ActionHandler, metadata?: ActionMetadata): void;
    /**
     * Désenregistre un gestionnaire d'action
     */
    unregisterActionHandler(actionId: string): void;
    /**
     * Valide une action
     */
    validateAction(action: Action): IActionValidationResult;
    /**
     * Gère une action en l'envoyant aux plugins pertinents
     */
    handleAction(action: Action): void;
    /**
     * Exécute une action spécifique
     */
    executeAction(actionId: string, params: any): boolean;
    /**
     * Récupère les actions disponibles pour un type de menu
     */
    getMenuActions(menuType: string): Array<{
        id: string;
        handler: ActionHandler;
    } & ActionMetadata>;
}
export declare const actionRegistry: ActionRegistry;
export { ActionRegistry };
