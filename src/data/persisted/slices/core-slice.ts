import { actionRegistry, IKarmycConfig, IKarmycOptions, LayoutPreset } from "../../..";
import { StateCreator } from "zustand";
import { RootStateType } from "../../mainStore";


export interface CoreState {
    options: IKarmycOptions;
    lastUpdated: number;
    layout_preset: LayoutPreset[];
}

interface CoreActions {
    initialize: (config: IKarmycConfig) => void;
}

export type CoreSlice = CoreState & CoreActions;

const initialState: CoreState = {
    options: { allowStackMixedRoles: true },
    lastUpdated: Date.now(), // Initialisation
    layout_preset: [],
}


export const createCoreSlice: StateCreator<
    RootStateType, // le type global du store
    [],
    [],
    CoreSlice
> = (set, get) => ({
    ...initialState,

    // Actions
    initialize: (config: IKarmycConfig) => {
        // Initialize actions
        config.actions.plugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
        });

        config.actions.validators.forEach(({ actionType, validator }) => {
            actionRegistry.registerValidator(actionType, validator);
        });
    }
})
