import { IContextMenuPosition } from "../../types/context-menu-types";
import { validatePosition } from "../../utils/validation";


export const openCustomContextMenu = (set: any) => (payload: {
    position: IContextMenuPosition;
    targetId?: string;
    metadata?: Record<string, any>;
    component: React.ReactNode;
}) => set((state: any) => {
    const { position, targetId, metadata, component } = payload;
    const menuClassName = (payload as any).menuClassName;
    
    if (!position) {
        console.warn('Aucune position fournie à openCustomContextMenu');
        return {
            ...state,
            contextMenu: {
                ...state.contextMenu,
                errors: ['Aucune position fournie au menu contextuel']
            }
        };
    }
    
    const positionValidation = validatePosition(position);
    if (!positionValidation.isValid) {
        console.warn('Position validation failed:', positionValidation.errors);
        return {
            ...state,
            contextMenu: {
                ...state.contextMenu,
                errors: positionValidation.errors
            }
        };
    }

    return {
        ...state,
        contextMenu: {
            ...state.contextMenu,
            isVisible: true,
            position,
            targetId,
            metadata,
            errors: [],
            menuClassName: (menuClassName ? menuClassName + ' ' : '') + 'menu',
            customContextMenuContent: component,
            menuType: 'switchType'
        }
    };
})
