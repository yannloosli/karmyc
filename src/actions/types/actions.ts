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
    enableLogging?: boolean;
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
    actionTypes: string[] | null; // null means all action types
    handler: TActionHandler<T>;
}

/**
 * Action priorities
 */
export enum ActionPriority {
    CRITICAL = 1000,  // Critical actions (security, validation)
    HIGH = 800,       // Important actions (history, logging)
    NORMAL = 500,     // Standard actions
    LOW = 200,        // Low priority actions (analytics, etc.)
    BACKGROUND = 100  // Background actions
} 

export const AREA_ROLE = {
    LEAD: "LEAD",
    FOLLOW: "FOLLOW",
    SELF: "SELF"
} as const;

export type AreaRole = typeof AREA_ROLE[keyof typeof AREA_ROLE];

export type AreaTypeValue = string;
