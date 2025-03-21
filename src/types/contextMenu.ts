import { Rect } from './geometry';

/**
 * Position d'un menu contextuel
 */
export interface IContextMenuPosition {
    x: number;
    y: number;
}

/**
 * Option de menu contextuel
 */
export interface ContextMenuItem {
    id: string;
    label: string;
    icon?: React.ComponentType;
    actionId: string;
    disabled?: boolean;
    children?: ContextMenuItem[];
    default?: boolean;
    metadata?: Record<string, any>;
}

/**
 * Propriétés de base pour un composant de menu contextuel personnalisé
 */
export interface ContextMenuBaseProps {
    updateRect: (rect: Rect | null) => void;
}

/**
 * Options pour l'ouverture d'un menu contextuel personnalisé
 */
export interface OpenCustomContextMenuOptions<
    P extends ContextMenuBaseProps = ContextMenuBaseProps
> {
    component: React.ComponentType<P>;
    props: Omit<P, "updateRect">;
    position: IContextMenuPosition;
    alignPosition?: "top-left" | "bottom-left" | "center";
    closeMenuBuffer?: number;
    close: () => void;
}

/**
 * État du menu contextuel dans le store
 */
export interface IContextMenuState {
    isVisible: boolean;
    position: IContextMenuPosition;
    items: ContextMenuItem[];
    targetId?: string;
    metadata?: Record<string, any>;
    errors: string[];
    customContextMenu: OpenCustomContextMenuOptions | null;
}

/**
 * Action de menu contextuel
 */
export interface IContextMenuAction {
    id: string;
    label: string;
    icon?: string;
    handler: () => void;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
} 
