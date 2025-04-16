import React, { useCallback, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

// Registry to store components by area type
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

// Hook for the menu bar
export const useMenuBar = (areaType: string) => {
    // Ensure the type exists in the registry
    useEffect(() => {
        if (!menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = [];
        }
    }, [areaType]);

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            width?: number | 'auto';
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Generate a unique ID

        // Ensure the type exists in the registry
        if (!menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = [];
        }

        // Add the component to the registry
        menuBarRegistry[areaType].push({
            id,
            Component: component,
            order: options?.order ?? 999,
            width: options?.width ?? 'auto',
            displayName: options?.displayName
        });

        return id;
    }, [areaType]);

    // Function to remove a component
    const unregisterComponent = useCallback((componentId: string) => {
        if (menuBarRegistry[areaType]) {
            menuBarRegistry[areaType] = menuBarRegistry[areaType].filter(c => c.id !== componentId);
        }
    }, [areaType]);

    // Function to retrieve all components
    const getComponents = useCallback(() => {
        return [...(menuBarRegistry[areaType] || [])].sort((a, b) => a.order - b.order);
    }, [areaType]);

    return {
        registerComponent,
        unregisterComponent,
        getComponents
    };
};

// Hook for the status bar
export const useStatusBar = (areaType: string) => {
    // Ensure the type exists in the registry
    useEffect(() => {
        if (!statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = [];
        }
    }, [areaType]);

    // Function to register a component
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            width?: number | 'auto';
            displayName?: string;
            alignment?: 'left' | 'center' | 'right';
        }
    ) => {
        const id = uuidv4(); // Generate a unique ID

        // Ensure the type exists in the registry
        if (!statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = [];
        }

        // Add the component to the registry
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

    // Function to remove a component
    const unregisterComponent = useCallback((componentId: string) => {
        if (statusBarRegistry[areaType]) {
            statusBarRegistry[areaType] = statusBarRegistry[areaType].filter(c => c.id !== componentId);
        }
    }, [areaType]);

    // Function to retrieve all components
    const getComponents = useCallback(() => {
        return [...(statusBarRegistry[areaType] || [])].sort((a, b) => a.order - b.order);
    }, [areaType]);

    return {
        registerComponent,
        unregisterComponent,
        getComponents
    };
};

// Hook for the toolbar
export const useToolbar = (areaType: string) => {
    // Ensure the type exists in the registry
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

    // Function to register a component in the main toolbar
    const registerComponent = useCallback((
        component: React.ComponentType<any>,
        options?: {
            order?: number;
            height?: number;
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Generate a unique ID

        // Ensure the type exists in the registry
        if (!toolbarRegistry[areaType]) {
            toolbarRegistry[areaType] = {
                mainComponents: [],
                slotComponents: {
                    'nw': null, 'n': null, 'ne': null,
                    'sw': null, 's': null, 'se': null
                }
            };
        }

        // Add the component to the registry
        toolbarRegistry[areaType].mainComponents.push({
            id,
            Component: component,
            order: options?.order ?? 999,
            height: options?.height,
            displayName: options?.displayName
        });

        return id;
    }, [areaType]);

    // Function to register a component in a specific slot
    const registerSlotComponent = useCallback((
        slot: 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se',
        component: React.ComponentType<any>,
        options?: {
            displayName?: string;
        }
    ) => {
        const id = uuidv4(); // Generate a unique ID

        // Ensure the type exists in the registry
        if (!toolbarRegistry[areaType]) {
            toolbarRegistry[areaType] = {
                mainComponents: [],
                slotComponents: {
                    'nw': null, 'n': null, 'ne': null,
                    'sw': null, 's': null, 'se': null
                }
            };
        }

        // Add the component to the registry
        toolbarRegistry[areaType].slotComponents[slot] = {
            id,
            Component: component,
            displayName: options?.displayName
        };

        return id;
    }, [areaType]);

    // Function to remove a component
    const unregisterComponent = useCallback((componentId: string) => {
        if (toolbarRegistry[areaType]) {
            // Check in the main components
            toolbarRegistry[areaType].mainComponents =
                toolbarRegistry[areaType].mainComponents.filter(c => c.id !== componentId);

            // Check in the slots
            Object.keys(toolbarRegistry[areaType].slotComponents).forEach(key => {
                const slot = key as 'nw' | 'n' | 'ne' | 'sw' | 's' | 'se';
                if (toolbarRegistry[areaType].slotComponents[slot]?.id === componentId) {
                    toolbarRegistry[areaType].slotComponents[slot] = null;
                }
            });
        }
    }, [areaType]);

    // Function to retrieve all main toolbar components
    const getComponents = useCallback(() => {
        if (!toolbarRegistry[areaType]) return [];
        return [...toolbarRegistry[areaType].mainComponents].sort((a, b) => a.order - b.order);
    }, [areaType]);

    // Function to retrieve all slot components
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

// Types for component props
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
