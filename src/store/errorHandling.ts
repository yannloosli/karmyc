import { AnyAction } from '@reduxjs/toolkit';

// Types d'erreurs
export enum ErrorType {
  VALIDATION = 'VALIDATION',
  TRANSITION = 'TRANSITION',
  DIFF = 'DIFF',
  TOOLBAR = 'TOOLBAR',
  SYSTEM = 'SYSTEM'
}

// Interface pour les erreurs
export interface IError {
  type: ErrorType;
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: number;
  action?: AnyAction;
}

// Gestionnaire d'erreurs
export class ErrorHandler {
  private static instance: ErrorHandler;
  private errors: IError[] = [];
  private listeners: ((error: IError) => void)[] = [];

  private constructor() {}

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  // Ajouter une erreur
  addError(error: Omit<IError, 'timestamp'>): void {
    const newError: IError = {
      ...error,
      timestamp: Date.now()
    };
    
    this.errors.push(newError);
    this.notifyListeners(newError);
  }

  // Ajouter un écouteur d'erreurs
  addListener(listener: (error: IError) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Obtenir toutes les erreurs
  getErrors(): IError[] {
    return [...this.errors];
  }

  // Obtenir les erreurs par type
  getErrorsByType(type: ErrorType): IError[] {
    return this.errors.filter(error => error.type === type);
  }

  // Obtenir les erreurs récentes
  getRecentErrors(limit: number = 10): IError[] {
    return this.errors
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  // Effacer les erreurs
  clearErrors(): void {
    this.errors = [];
  }

  // Effacer les erreurs par type
  clearErrorsByType(type: ErrorType): void {
    this.errors = this.errors.filter(error => error.type !== type);
  }

  // Notifier les écouteurs
  private notifyListeners(error: IError): void {
    this.listeners.forEach(listener => listener(error));
  }
}

// Fonctions utilitaires pour la gestion des erreurs
export const errorUtils = {
  // Créer une erreur de validation
  createValidationError(message: string, details?: Record<string, any>): IError {
    return {
      type: ErrorType.VALIDATION,
      message,
      code: 'VALIDATION_ERROR',
      details,
      timestamp: Date.now()
    };
  },

  // Créer une erreur de transition
  createTransitionError(message: string, action?: AnyAction, details?: Record<string, any>): IError {
    return {
      type: ErrorType.TRANSITION,
      message,
      code: 'TRANSITION_ERROR',
      details,
      action,
      timestamp: Date.now()
    };
  },

  // Créer une erreur de diff
  createDiffError(message: string, details?: Record<string, any>): IError {
    return {
      type: ErrorType.DIFF,
      message,
      code: 'DIFF_ERROR',
      details,
      timestamp: Date.now()
    };
  },

  // Créer une erreur de barre d'outils
  createToolbarError(message: string, details?: Record<string, any>): IError {
    return {
      type: ErrorType.TOOLBAR,
      message,
      code: 'TOOLBAR_ERROR',
      details,
      timestamp: Date.now()
    };
  },

  // Créer une erreur système
  createSystemError(message: string, details?: Record<string, any>): IError {
    return {
      type: ErrorType.SYSTEM,
      message,
      code: 'SYSTEM_ERROR',
      details,
      timestamp: Date.now()
    };
  }
};

// Middleware de gestion des erreurs
export const errorMiddleware = () => (next: any) => (action: AnyAction) => {
  try {
    return next(action);
  } catch (error) {
    const errorHandler = ErrorHandler.getInstance();
    
    if (error instanceof Error) {
      errorHandler.addError({
        type: ErrorType.SYSTEM,
        message: error.message,
        code: 'UNHANDLED_ERROR',
        details: {
          stack: error.stack,
          action: action.type
        },
        action
      });
    } else {
      errorHandler.addError({
        type: ErrorType.SYSTEM,
        message: 'Une erreur inattendue est survenue',
        code: 'UNKNOWN_ERROR',
        details: {
          error,
          action: action.type
        },
        action
      });
    }
    
    throw error;
  }
}; 
