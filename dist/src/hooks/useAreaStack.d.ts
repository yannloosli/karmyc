/**
 * Hook pour gérer la logique de stack des aires
 * @param areaId L'ID de l'aire à vérifier
 * @returns Un objet contenant les informations sur la stack
 */
export declare const useAreaStack: (areaId: string) => {
    isChildOfStack: boolean;
    stackData: {
        layoutId: string;
        layout: import("..").AreaRowLayout;
        areas: {
            [key: string]: import("..").IArea<string>;
        };
    } | null;
};
