import { ComponentType } from "react";
/**
 * Area registry interface
 */
interface IAreaRegistry {
    registerComponent: (areaType: string, component: ComponentType<any>) => void;
    registerInitialState: (areaType: string, initialState: any) => void;
    registerDisplayName: (areaType: string, name: string) => void;
    registerIcon: (areaType: string, icon: any) => void;
    registerDefaultSize: (areaType: string, size: {
        width: number;
        height: number;
    }) => void;
    registerSupportedActions: (areaType: string, actions: string[]) => void;
    getComponent: (areaType: string) => ComponentType<any> | undefined;
    getInitialState: (areaType: string) => any;
    getDisplayName: (areaType: string) => string;
    getIcon: (areaType: string) => any;
    getDefaultSize: (areaType: string) => {
        width: number;
        height: number;
    } | undefined;
    getSupportedActions: (areaType: string) => string[] | undefined;
    getRegisteredTypes: () => Set<string>;
    unregisterAreaType: (areaType: string) => void;
}
/**
 * Area Registry
 * Allows registering and retrieving components and initial states of areas
 */
export declare const areaRegistry: IAreaRegistry;
export {};
