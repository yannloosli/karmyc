import { AreaRole, IActionPlugin } from '../types/actions';

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
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
    initialAreas?: Array<{
        type: string;
        state?: any;
        position?: { x: number; y: number };
        role?: AreaRole;
    }>;
    keyboardShortcutsEnabled?: boolean;
}

export interface IKarmycProviderProps {
    children: React.ReactNode;
    options?: IKarmycOptions;
    customStore?: any; // TODO: Typer correctement avec le type du store
}
