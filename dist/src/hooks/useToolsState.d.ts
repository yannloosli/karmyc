/**
 * Hook pour gérer l'état des outils
 * @param areaId L'ID de l'aire
 * @returns Les états et actions nécessaires pour les outils
 */
export declare const useToolsState: (areaId?: string) => {
    activeScreenId: string;
    isDetached: boolean;
    multiScreen: boolean;
    currentArea: import("..").IArea<string> | undefined;
    currentSpaceId: string | null | undefined;
    handleFocus: () => void;
    isFullscreen: boolean;
};
