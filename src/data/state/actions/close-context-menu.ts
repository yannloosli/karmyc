import { initialState } from "../slices/context-menu-slice";


export const closeContextMenu = (set: any) => () => set((state: any) => {
    Object.assign(state, initialState);
    return {
        ...state,
        menuType: undefined
    };
})
