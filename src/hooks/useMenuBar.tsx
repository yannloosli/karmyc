import React, { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Registre pour stocker les composants par type de zone
const menuBarRegistry: Record<string, Array<{
    id: string;
    Component: React.ComponentType<any>;
    order: number;
    width?: number | 'auto';
    displayName?: string;
}>> = {};

const statusBarRegistry: Record<string, Array<{
    id: string;
    Component: React.ComponentType<any>;
    order: number;
    width?: number | 'auto';
    alignment: 'left' | 'center' | 'right';
    displayName?: string;
}>> = {};

const toolbarRegistry: Record<string, {
    mainComponents: Array<{
        id: string;
        Component: React.ComponentType<any>;
        order: number;
        height?: number;
        displayName?: string;
    }>,
    slotComponents: Record<'nw' | 'n' | 'ne' | 'sw' | 's' | 'se', {
        id: string;
        Component: React.ComponentType<any>;
        displayName?: string;
    } | null>
}> = {};

// Hook pour la barre de menu
export const useMenuBar = (areaType: string) => {
    // S'assurer que le type existe dans le registre
    useEffect(() => {
        if (!menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = [];
        }
    }, [areaType]);

    // Fonction pour enregistrer un composant
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            width?: number | 'auto';
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Générer un ID unique

        // S'assurer que le type existe dans le registre
        if (!menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = [];
        }

        // Ajouter le composant au registre
        menuBarRegistry[areaType].push({
            id,
            Component: component,
            order: options?.order ?? 999,
            width: options?.width ?? 'auto',
            displayName: options?.displayName
        });

        return id;
    }, [areaType]);

    // Fonction pour supprimer un composant
    const unregisterComponent = useCallback((componentId: string) => {
        if (menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = menuBarRegistry[areaType].filter(c => c.id !== componentId);
        }
    }, [areaType]);

    // Fonction pour récupérer tous les composants
    const getComponents = useCallback(() => {
        return [...(menuBarRegistry[areaType] || [])].sort((a, b) => a.order - b.order);
    }, [areaType]);

    return {
        registerComponent,
        unregisterComponent,
        getComponents
    };
};

// Hook pour la barre d'état
export const useStatusBar = (areaType: string) => {
    // S'assurer que le type existe dans le registre
    useEffect(() => {
        if (!statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = [];
        }
    }, [areaType]);

    // Fonction pour enregistrer un composant
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            width?: number | 'auto';
            displayName?: string;
            alignment?: 'left' | 'center' | 'right';
        }
    ) => {
        const id = uuidv4(); // Générer un ID unique

        // S'assurer que le type existe dans le registre
        if (!statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = [];
        }

        // Ajouter le composant au registre
        statusBarRegistry[areaType].push({
            id,
            Component: component,
            order: options?.order ?? 999,
            width: options?.width ?? 'auto',
            alignment: options?.alignment ?? 'left',
            displayName: options?.displayName
        });

        return id;
    }, [areaType]);

    // Fonction pour supprimer un composant
    const unregisterComponent = useCallback((componentId: string) => {
        if (statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = statusBarRegistry[areaType].filter(c => c.id !== componentId);
        }
    }, [areaType]);

    // Fonction pour récupérer tous les composants
    const getComponents = useCallback(() => {
        return [...(statusBarRegistry[areaType] || [])].sort((a, b) => a.order - b.order);
    }, [areaType]);

    return {
        registerComponent,
        unregisterComponent,
        getComponents
    };
};

// Hook pour la barre d'outils
export const useToolbar = (areaType: string) => {
    // S'assurer que le type existe dans le registre
    useEffect(() => {
        if (!toolbarRegistry[areaType]) {
            toolbarRegistry[areaType] = {
                mainComponents: [],
                slotComponents: {
                    'nw': null, 'n': null, 'ne': null,
                    'sw': null, 's': null, 'se': null
                }
            };
        }
    }, [areaType]);

    // Fonction pour enregistrer un composant dans la barre d'outils principale
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            height?: number;
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Générer un ID unique

        // S'assurer que le type existe dans le registre
        if (!toolbarRegistry[areaType]) {
            toolbarRegistry[areaType] = {
                mainComponents: [],
                slotComponents: {
                    'nw': null, 'n': null, 'ne': null,
                    'sw': null, 's': null, 'se': null
                }
            };
        }

        // Ajouter le composant au registre
        toolbarRegistry[areaType].mainComponents.push({
            id,
            Component: component,
            order: options?.order ?? 999,
            height: options?.height,
            displayName: options?.displayName
        });

        return id;
    }, [areaType]);

    // Fonction pour enregistrer un composant dans un emplacement spécifique
    const registerSlotComponent = useCallback((
        slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se',
        component: React.ComponentType<any>,
        options?: {
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Générer un ID unique

        // S'assurer que le type existe dans le registre
        if (!toolbarRegistry[areaType]) {
            toolbarRegistry[areaType] = {
                mainComponents: [],
                slotComponents: {
                    'nw': null, 'n': null, 'ne': null,
                    'sw': null, 's': null, 'se': null
                }
            };
        }

        // Ajouter le composant au registre
        toolbarRegistry[areaType].slotComponents[slot] = {
            id,
            Component: component,
            displayName: options?.displayName
        };

        return id;
    }, [areaType]);

    // Fonction pour supprimer un composant
    const unregisterComponent = useCallback((componentId: string) => {
        if (toolbarRegistry[areaType]) {
            // Vérifier dans les composants principaux
            toolbarRegistry[areaType].mainComponents =
                toolbarRegistry[areaType].mainComponents.filter(c => c.id !== componentId);

            // Vérifier dans les emplacements
            Object.keys(toolbarRegistry[areaType].slotComponents).forEach(key => {
                const slot = key as 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se';
                if (toolbarRegistry[areaType].slotComponents[slot]?.id === componentId) {
                    toolbarRegistry[areaType].slotComponents[slot] = null;
                }
            });
        }
    }, [areaType]);

    // Fonction pour récupérer tous les composants de la barre d'outils principale
    const getComponents = useCallback(() => {
        if (!toolbarRegistry[areaType]) return [];
        return [...toolbarRegistry[areaType].mainComponents].sort((a, b) => a.order - b.order);
    }, [areaType]);

    // Fonction pour récupérer tous les composants des emplacements
    const getSlotComponents = useCallback(() => {
        if (!toolbarRegistry[areaType]) {
            return {
                'nw': null, 'n': null, 'ne': null,
                'sw': null, 's': null, 'se': null
            };
        }
        return { ...toolbarRegistry[areaType].slotComponents };
    }, [areaType]);

    return {
        registerComponent,
        registerSlotComponent,
        unregisterComponent,
        getComponents,
        getSlotComponents
    };
};

// Types pour les props des composants
export interface MenuBarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    width?: number | 'auto';
}

export interface StatusBarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    width?: number | 'auto';
}

export interface ToolbarComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    height?: number;
}

export interface ToolbarSlotComponentProps {
    areaId: string;
    areaState: any;
    areaType: string;
    slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se';
} 
