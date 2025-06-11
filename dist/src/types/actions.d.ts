/**
 * Type d'action générique pour le système de plugins
 */
export interface Action<T = any> {
    type: string;
    payload?: T;
    [key: string]: any;
}
/**
 * Action validation result
 */
export interface IActionValidationResult {
    valid: boolean;
    message?: string;
}
/**
 * Action validator function type
 */
export type TActionValidator = (action: Action) => IActionValidationResult;
/**
 * Action plugin interface
 */
export interface IActionPlugin {
    id: string;
    priority: number;
    actionTypes: string[] | null;
    handler: (action: Action) => void;
    onRegister?: () => void;
    onUnregister?: () => void;
}
/**
 * Action registry interface
 */
export interface IActionRegistry {
    registerPlugin(plugin: IActionPlugin): void;
    unregisterPlugin(id: string): void;
    registerValidator(actionType: string, validator: TActionValidator): void;
    unregisterValidators(actionType: string): void;
    validateAction(action: Action): IActionValidationResult;
    handleAction(action: Action): void;
}
/**
 * Action registry options
 */
export interface IActionRegistryOptions {
    defaultValidators?: Record<string, TActionValidator[]>;
}
/**
 * Type for an action handler
 */
export type TActionHandler<T extends Action = Action> = (action: T) => void;
/**
 * Interface for an action
 */
export interface IAction<T extends Action = Action> {
    id: string;
    type: string;
    priority?: number;
    actionTypes: string[] | null;
    handler: TActionHandler<T>;
}
/**
 * Action priorities
 */
export declare enum ActionPriority {
    CRITICAL = 1000,// Critical actions (security, validation)
    HIGH = 800,// Important actions (history, logging)
    NORMAL = 500,// Standard actions
    LOW = 200,// Low priority actions (analytics, etc.)
    BACKGROUND = 100
}
export declare const AREA_ROLE: {
    readonly LEAD: "LEAD";
    readonly FOLLOW: "FOLLOW";
    readonly SELF: "SELF";
};
export type AreaTypeValue = string;
