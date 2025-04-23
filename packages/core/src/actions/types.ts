import { AnyAction } from '@reduxjs/toolkit';

export type TActionHandler = (action: AnyAction) => void;

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

export type TActionValidator = (action: AnyAction) => IActionValidationResult;

export interface IActionRegistry {
  registerPlugin: (plugin: IActionPlugin) => void;
  unregisterPlugin: (id: string) => void;
  registerValidator: (actionType: string, validator: TActionValidator) => void;
  validateAction: (action: AnyAction) => IActionValidationResult;
  handleAction: (action: AnyAction) => void;
} 
