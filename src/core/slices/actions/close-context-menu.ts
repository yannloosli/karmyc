import { initialState } from "../context-menu-slice";


export const closeContextMenu = (set: any) => () => set((state: any) => {
    return {
        ...state,
        contextMenu: {
            ...state.contextMenu,
            ...initialState
        }
    };
});
