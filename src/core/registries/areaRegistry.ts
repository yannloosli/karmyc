import { ComponentType } from "react";

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
export const areaRegistry = {
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
