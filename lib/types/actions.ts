import { AnyAction } from '@reduxjs/toolkit';

/**
 * Type for an action handler
 */
export type TActionHandler<T extends AnyAction = AnyAction> = (action: T) => void;

/**
 * Interface for an action
 */
export interface IAction<T extends AnyAction = AnyAction> {
    id: string;
    type: string;
    priority?: number;
    actionTypes: string[] | null; // null means all action types
    handler: TActionHandler<T>;
}

/**
 * Action validation result
 */
export interface IActionValidationResult {
    valid: boolean;
    message?: string;
}

/**
 * Type for an action validator
 */
export type TActionValidator<T extends AnyAction = AnyAction> = (action: T) => IActionValidationResult;

/**
 * Options for the action registry
 */
export interface IActionRegistryOptions {
    enableLogging?: boolean;
    defaultValidators?: Record<string, TActionValidator[]>;
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
