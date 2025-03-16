import { AnyAction } from '@reduxjs/toolkit';

/**
 * Type pour un gestionnaire d'action
 */
export type TActionHandler<T extends AnyAction = AnyAction> = (action: T) => void;

/**
 * Interface pour un plugin d'action
 */
export interface IActionPlugin<T extends AnyAction = AnyAction> {
  id: string;
  priority: number;
  actionTypes: string[] | null; // null signifie tous les types d'actions
  handler: TActionHandler<T>;
}

/**
 * Résultat de validation d'une action
 */
export interface IActionValidationResult {
  valid: boolean;
  message?: string;
}

/**
 * Type pour un validateur d'action
 */
export type TActionValidator<T extends AnyAction = AnyAction> = (action: T) => IActionValidationResult;

/**
 * Options pour le registre d'actions
 */
export interface IActionRegistryOptions {
  enableLogging?: boolean;
  defaultValidators?: Record<string, TActionValidator[]>;
}

/**
 * Priorités des actions
 */
export enum ActionPriority {
  CRITICAL = 1000,  // Actions critiques (sécurité, validation)
  HIGH = 800,       // Actions importantes (historique, journalisation)
  NORMAL = 500,     // Actions standard
  LOW = 200,        // Actions de faible priorité (analytics, etc.)
  BACKGROUND = 100  // Actions en arrière-plan
} 
