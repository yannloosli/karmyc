import { ContextMenuItem } from "../../types/context-menu-types";
import { validateContextMenuItem } from "../../utils/validation";



export const updateContextMenuItems = (set: any) => (items: ContextMenuItem[]) => set((state: any) => {
    const itemsValidation = items.map((item) => validateContextMenuItem(item));
    const invalidItems = itemsValidation.filter((validation) => !validation.isValid);
    if (invalidItems.length > 0) {
        return {
            ...state,
            errors: invalidItems.flatMap(
                (validation: any) => validation.errors || ['Unknown item validation error']
            )
        };
    }
    return {
        ...state,
        items,
        errors: []
    };
})
