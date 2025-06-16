import { IContextMenuPosition } from "../../types/context-menu-types";
import { validatePosition } from "../../utils/validation";


export const updateContextMenuPosition = (set: any) => (position: IContextMenuPosition) => set((state: any) => {
    const validation = validatePosition(position);
    if (!validation.isValid) {
        return {
            ...state,
            errors: validation.errors
        };
    }
    return {
        ...state,
        position,
        errors: []
    };
})
