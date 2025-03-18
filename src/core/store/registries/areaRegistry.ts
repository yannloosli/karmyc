import { ComponentType } from "react";
import { AreaType } from "../../constants";
import { AreaComponentProps } from "../../types/areaTypes";

interface IAreaRegistry {
    registerComponent: (areaType: string, component: any) => void;
    registerReducer: (areaType: string, reducer: any) => void;
    registerKeyboardShortcuts: (areaType: string, shortcuts: any) => void;
    registerReactKey: (areaType: string, key: string) => void;
    registerDisplayName: (areaType: string, name: string) => void;
    registerIcon: (areaType: string, icon: any) => void;
    unregisterAreaType: (areaType: string) => void;
}

// Stockage en mémoire des zones enregistrées
const areaStorage = new Map<string, {
    component?: any;
    reducer?: any;
    keyboardShortcuts?: any;
    reactKey?: string;
    displayName?: string;
    icon?: any;
}>();

export const areaRegistry: IAreaRegistry = {
    registerComponent: (areaType: string, component: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, component });
    },

    registerReducer: (areaType: string, reducer: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, reducer });
    },

    registerKeyboardShortcuts: (areaType: string, shortcuts: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, keyboardShortcuts: shortcuts });
    },

    registerReactKey: (areaType: string, key: string) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, reactKey: key });
    },

    registerDisplayName: (areaType: string, name: string) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, displayName: name });
    },

    registerIcon: (areaType: string, icon: any) => {
        const existing = areaStorage.get(areaType) || {};
        areaStorage.set(areaType, { ...existing, icon });
    },

    unregisterAreaType: (areaType: string) => {
        areaStorage.delete(areaType);
    }
};

interface FlowAreaState { }
interface TimelineAreaState { }
interface WorkspaceAreaState { }
interface HistoryAreaState { }
interface ProjectAreaState { }

const DummyComponent: ComponentType<any> = () => null;

export const areaComponentRegistry: Record<AreaType, ComponentType<AreaComponentProps<any>>> = {
    [AreaType.FlowEditor]: DummyComponent,
    [AreaType.Timeline]: DummyComponent,
    [AreaType.Workspace]: DummyComponent,
    [AreaType.History]: DummyComponent,
    [AreaType.Project]: DummyComponent,
};

export const _areaReactKeyRegistry: {
    [key in AreaType]?: string;
} = {};

export const registerAreaComponent = (
    type: AreaType,
    component: React.ComponentType<AreaComponentProps<any>>,
    stateKey?: string
) => {
    areaComponentRegistry[type] = component;
    if (stateKey) {
        _areaReactKeyRegistry[type] = stateKey;
    }
};

export const areaStateReducerRegistry: {
    [key in AreaType]?: (state: any, action: any) => any;
} = {}; 
