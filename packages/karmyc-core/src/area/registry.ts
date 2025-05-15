import { ComponentType } from "react";

/**
 * Area registry interface
 */
interface IAreaRegistry {
    // Registration methods
    registerComponent: (areaType: string, component: ComponentType<any>) => void;
    registerInitialState: (areaType: string, initialState: any) => void;
    registerDisplayName: (areaType: string, name: string) => void;
    registerIcon: (areaType: string, icon: any) => void;
    registerDefaultSize: (areaType: string, size: { width: number, height: number }) => void;
    registerSupportedActions: (areaType: string, actions: string[]) => void;

    // Retrieval methods
    getComponent: (areaType: string) => ComponentType<any> | undefined;
    getInitialState: (areaType: string) => any;
    getDisplayName: (areaType: string) => string;
    getIcon: (areaType: string) => any;
    getDefaultSize: (areaType: string) => { width: number, height: number } | undefined;
    getSupportedActions: (areaType: string) => string[] | undefined;
    getRegisteredTypes: () => Set<string>;

    // Unregistration method
    unregisterAreaType: (areaType: string) => void;
}

// In-memory storage for registered areas
const areaStorage = new Map<string, {
    component?: ComponentType<any>;
    initialState?: any;
    displayName?: string;
    icon?: any;
    defaultSize?: { width: number, height: number };
    supportedActions?: string[];
}>();

/**
 * Area Registry
 * Allows registering and retrieving components and initial states of areas
 */
export const areaRegistry: IAreaRegistry = {
    // Registration methods
    registerComponent: (areaType: string, component: ComponentType<any>) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, component });
    },

    registerInitialState: (areaType: string, initialState: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, initialState });
    },

    registerDisplayName: (areaType: string, name: string) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, displayName: name });
    },

    registerIcon: (areaType: string, icon: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, icon });
    },

    registerDefaultSize: (areaType: string, size: { width: number, height: number }) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, defaultSize: size });
    },

    registerSupportedActions: (areaType: string, actions: string[]) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, supportedActions: actions });
    },

    // Retrieval methods
    getComponent: (areaType: string) => {
        return areaStorage.get(areaType)?.component;
    },

    getInitialState: (areaType: string) => {
        return areaStorage.get(areaType)?.initialState || {};
    },

    getDisplayName: (areaType: string) => {
        return areaStorage.get(areaType)?.displayName || areaType;
    },

    getIcon: (areaType: string) => {
        return areaStorage.get(areaType)?.icon;
    },

    getDefaultSize: (areaType: string) => {
        return areaStorage.get(areaType)?.defaultSize;
    },

    getSupportedActions: (areaType: string) => {
        return areaStorage.get(areaType)?.supportedActions;
    },

    // New method to get all registered types
    getRegisteredTypes: () => {
        return new Set(Array.from(areaStorage.keys()));
    },

    // Unregistration method
    unregisterAreaType: (areaType: string) => {
        areaStorage.delete(areaType);
    }
}; 
