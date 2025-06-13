import { useKarmycStore } from '../data/mainStore';

export interface ScreenManagement {
    screens: Record<string, any>;
    activeScreenId: string;
    switchScreen: (screenId: string) => void;
    addScreen: () => void;
    removeScreen: (screenId: string) => void;
    duplicateScreen: (screenId: string) => void;
}

export function useScreenManagement(): ScreenManagement {
    const screens = useKarmycStore((state) => state.screens);
    const activeScreenId = useKarmycStore((state) => state.activeScreenId);
    const switchScreen = useKarmycStore((state) => state.switchScreen);
    const addScreen = useKarmycStore((state) => state.addScreen);
    const removeScreen = useKarmycStore((state) => state.removeScreen);
    const duplicateScreen = useKarmycStore((state) => state.duplicateScreen);

    return {
        screens,
        activeScreenId,
        switchScreen,
        addScreen,
        removeScreen,
        duplicateScreen
    };
} 
