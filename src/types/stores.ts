export interface IContextMenuStore {
    openContextMenu: (payload: {
        position: { x: number; y: number };
        items: any[];
        targetId?: string;
        metadata?: Record<string, any>;
    }) => void;
    closeContextMenu: () => void;
}

export interface ISpaceStore {
    getSpaceById: (id: string) => any;
    setActiveSpace: (id: string) => void;
    activeSpaceId: string | null;
    getState: () => {
        spaces: Record<string, {
            sharedState?: {
                color?: string;
            };
        }>;
    };
} 
