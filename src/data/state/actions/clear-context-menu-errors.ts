export const clearContextMenuErrors = (set: any) => () => set((state: any) => {
    return {
        ...state,
        errors: []
    };
})
