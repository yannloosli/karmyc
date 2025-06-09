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

export interface IKarmycOptions {
    plugins?: IActionPlugin[];
    validators?: Array<{
        actionType: string;
        validator: (action: any) => { valid: boolean; message?: string };
    }>;
    initialAreas?: Array<{
        id?: string;
        type: string;
        state?: any;
        position?: { x: number; y: number };
        role?: AreaRole;
    }>;
    keyboardShortcutsEnabled?: boolean;
    resizableAreas?: boolean;
    manageableAreas?: boolean;
    multiScreen?: boolean;
    allowStackMixedRoles?: boolean;
    builtInLayouts?: LayoutPreset[];
    initialLayout?: string;
    /**
     * Custom translation function
     * @param key - Translation key
     * @param fallback - Default text if translation is not found
     * @returns The translation or the default text
     */
    t?: (key: string, fallback: string) => string;
}

export interface IKarmycProviderProps {
    children: React.ReactNode;
    options?: IKarmycOptions;
    customStore?: any; // TODO: Typer correctement avec le type du store
}
