import { AnyAction } from '@reduxjs/toolkit';

// Error types
export enum ErrorType {
    VALIDATION = 'VALIDATION',
    TRANSITION = 'TRANSITION',
    DIFF = 'DIFF',
    TOOLBAR = 'TOOLBAR',
    SYSTEM = 'SYSTEM'
}

// Error interface
export interface IError {
    type: ErrorType;
    message: string;
    code: string;
    details?: Record<string, any>;
    timestamp: number;
    action?: AnyAction;
}

// Error handler
export class ErrorHandler {
    private static instance: ErrorHandler;
    private errors: IError[] = [];
    private listeners: ((error: IError) => void)[] = [];

    private constructor() { }

    static getInstance(): ErrorHandler {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }

    // Add an error
    addError(error: Omit<IError, 'timestamp'>): void {
        const newError: IError = {
            ...error,
            timestamp: Date.now()
        };

        this.errors.push(newError);
        this.notifyListeners(newError);
    }

    // Add an error listener
    addListener(listener: (error: IError) => void): () => void {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    // Get all errors
    getErrors(): IError[] {
        return [...this.errors];
    }

    // Get errors by type
    getErrorsByType(type: ErrorType): IError[] {
        return this.errors.filter(error => error.type === type);
    }

    // Get recent errors
    getRecentErrors(limit: number = 10): IError[] {
        return this.errors
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, limit);
    }

    // Clear errors
    clearErrors(): void {
        this.errors = [];
    }

    // Clear errors by type
    clearErrorsByType(type: ErrorType): void {
        this.errors = this.errors.filter(error => error.type !== type);
    }

    // Notify listeners
    private notifyListeners(error: IError): void {
        this.listeners.forEach(listener => listener(error));
    }
}

// Utility functions for error handling
export const errorUtils = {
    // Create a validation error
    createValidationError(message: string, details?: Record<string, any>): IError {
        return {
            type: ErrorType.VALIDATION,
            message,
            code: 'VALIDATION_ERROR',
            details,
            timestamp: Date.now()
        };
    },

    // Create a transition error
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

    // Create a diff error
    createDiffError(message: string, details?: Record<string, any>): IError {
        return {
            type: ErrorType.DIFF,
            message,
            code: 'DIFF_ERROR',
            details,
            timestamp: Date.now()
        };
    },

    // Create a toolbar error
    createToolbarError(message: string, details?: Record<string, any>): IError {
        return {
            type: ErrorType.TOOLBAR,
            message,
            code: 'TOOLBAR_ERROR',
            details,
            timestamp: Date.now()
        };
    },

    // Create a system error
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

// Error middleware
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
                message: 'An unexpected error occurred',
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
