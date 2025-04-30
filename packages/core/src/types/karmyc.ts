import { IActionPlugin } from '../actions/types';

/**
 * Configuration du module core
 */
export interface IKarmycConfig {
    areas: {
        types: string[];
        layout: any;
    };
    actions: {
        plugins: any[];
        validators: any[];
    };
    contextMenu: {
        actions: any[];
    };
}

export interface IKarmycOptions {
    enableLogging?: boolean;
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
    initialAreas?: Array<{
        type: string;
        state?: any;
        position?: { x: number; y: number };
    }>;
    customReducers?: Record<string, any>;
    keyboardShortcutsEnabled?: boolean;
}

export interface IKarmycProviderProps {
    children: React.ReactNode;
    options?: IKarmycOptions;
    customStore?: any; // TODO: Typer correctement avec le type du store
}
