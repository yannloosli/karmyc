import { IActionPlugin, TActionValidator } from '../actions/types';
import { IArea, IAreaLayout } from './area';

/**
 * Options d'initialisation du module core
 */
export interface IInitializeOptions {
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: TActionValidator;
    }>;
    defaultAreaTypes?: string[];
    defaultLayout?: IAreaLayout;
}

/**
 * Configuration du module core
 */
export interface ICoreConfig {
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

export interface IProject {
    id: string;
    name: string;
    areas: IArea[];
    createdAt: string;
    updatedAt: string;
}

export interface ICoreOptions {
    enableLogging?: boolean;
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
}

export interface ICoreProviderProps {
    children: React.ReactNode;
    options?: ICoreOptions;
    customStore?: any; // TODO: Typer correctement avec le type du store
}
