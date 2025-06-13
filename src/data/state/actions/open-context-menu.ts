import { ContextMenuItem, IContextMenuPosition } from "../../types/context-menu-types";
import { validateContextMenuItem, validatePosition } from '../../utils/validation';


export const openContextMenu = (set: any) => (payload: {
    position: IContextMenuPosition;
    items: ContextMenuItem[];
    targetId?: string;
    metadata?: Record<string, any>;
}) => set((state: any) => {
    const { position, items, targetId, metadata } = payload;
    const menuClassName = (payload as any).menuClassName;

    // Validation
    const positionValidation = validatePosition(position);
    if (!positionValidation.isValid) {
        console.warn('Position validation failed:', positionValidation.errors);
        return { ...state, errors: positionValidation.errors };

    }

    const itemsValidation = items.map((item) => validateContextMenuItem(item));
    const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
    if (invalidItems.length > 0) {
        console.warn('Items validation failed:', invalidItems);
        return {
            ...state,
            errors: invalidItems.flatMap(
                (validation: any) => validation.errors || ['Unknown item validation error']
            )
        };
    }

    // Update state
    return {
        ...state,
        isVisible: true,
        position,
        items,
        targetId,
        metadata,
        menuClassName: menuClassName || state.menuClassName || 'menu',
        errors: [],
        menuType: 'default'
    };
})
