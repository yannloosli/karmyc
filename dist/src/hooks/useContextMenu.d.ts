import { ContextMenuItem } from '../types/contextMenu';
/**
 * Hook for managing the context menu
 * Provides simplified functions to open and close the context menu
 */
export declare const useContextMenu: () => {
    isVisible: boolean;
    position: import("../types/contextMenu").IContextMenuPosition;
    open: (params: {
        position: {
            x: number;
            y: number;
        };
        items: ContextMenuItem[];
        targetId?: string;
        metadata?: Record<string, any>;
        menuClassName?: string;
    }) => void;
    close: () => void;
};
