import { IActionPlugin } from './actions';
import { IArea } from '../../types/areaTypes';

export type AreaRole = 'LEAD' | 'FOLLOW' | 'SELF';

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

export interface LayoutPreset {
    id: string;
    name: string;
    config: {
        _id: number;
        rootId: string | null;
        errors: string[];
        activeAreaId: string | null;
        joinPreview: any | null;
        layout: {
            [key: string]: any;
        };
        areas: {
            [key: string]: any;
        };
        viewports: {
            [key: string]: any;
        };
        areaToOpen: any | null;
        lastSplitResultData: any | null;
        lastLeadAreaId: string | null;
    };
    isBuiltIn: boolean;
}
export interface ISpace {
    id: string;
    name: string;
    state: Record<string, any>;
}

export interface IKarmycOptions {
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
    initialAreas?: IArea[];
    keyboardShortcutsEnabled?: boolean;
    resizableAreas?: boolean;
    manageableAreas?: boolean;
    multiScreen?: boolean;
    allowStackMixedRoles?: boolean;
    builtInLayouts?: LayoutPreset[];
    initialLayout?: string;
    t?: (key: string, fallback: string) => string;
    spaces?: Record<string, ISpace>;

}

export interface IKarmycCoreProviderProps {
    children: React.ReactNode;
    options?: IKarmycOptions;
    customStore?: any; // TODO: Typer correctement avec le type du store
    onError?: (error: Error) => void;
}
