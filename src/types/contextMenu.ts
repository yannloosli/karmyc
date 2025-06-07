import { Rect } from './math';

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
