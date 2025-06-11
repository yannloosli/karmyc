export interface ScreenManagement {
    screens: Record<string, any>;
    activeScreenId: string;
    switchScreen: (screenId: string) => void;
    addScreen: () => void;
    removeScreen: (screenId: string) => void;
    duplicateScreen: (screenId: string) => void;
}
export declare function useScreenManagement(): ScreenManagement;
