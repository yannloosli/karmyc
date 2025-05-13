import { KarmycAction } from '../types/actions';

export type TActionHandler = (action: KarmycAction) => void;

export interface IActionPlugin {
    id: string;
    priority: number;
    handler: TActionHandler;
    actionTypes: string[] | null; // null signifie que le plugin gère tous les types d'actions
}

export interface IActionValidationResult {
    valid: boolean;
    message?: string;
}

export type TActionValidator = (action: KarmycAction) => IActionValidationResult;

export interface IActionRegistry {
    registerPlugin: (plugin: IActionPlugin) => void;
    unregisterPlugin: (id: string) => void;
    registerValidator: (actionType: string, validator: TActionValidator) => void;
    validateAction: (action: KarmycAction) => IActionValidationResult;
    handleAction: (action: KarmycAction) => void;
} 
