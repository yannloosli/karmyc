import { Rect } from './geometry';

/**
 * Context menu position
 */
export interface IContextMenuPosition {
    x: number;
    y: number;
}

/**
 * Context menu item
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
 * Base properties for a custom context menu component
 */
export interface ContextMenuBaseProps {
    updateRect: (rect: Rect | null) => void;
}

/**
 * Options for opening a custom context menu
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
 * Context menu state in the store
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
 * Context menu action
 */
export interface IContextMenuAction {
    id: string;
    label: string;
    icon?: string;
    handler: () => void;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
} 
