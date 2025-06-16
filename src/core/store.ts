import { createJSONStorage, devtools, persist } from "zustand/middleware";
import { AreasSlice, createAreasSlice } from "./slices/areas-slice";
import { ContextMenuSlice, createContextMenuSlice } from "./slices/context-menu-slice";
import { CoreSlice, createCoreSlice } from "./slices/core-slice";
import { ScreensSlice, createScreensSlice } from "./slices/screens-slice";
import { immer } from "zustand/middleware/immer";
import { create } from "zustand";
import { IKarmycOptions } from "./types/karmyc";
import { createInitialScreenState } from "./utils/screens";

export type RootStateType =
    CoreSlice &
    ContextMenuSlice &
    ScreensSlice &
    AreasSlice

export const initializeMainStore = (optionsParam: Partial<IKarmycOptions> = {}) => {
    const state = useKarmycStore.getState();
    const mergedOptions = {
        ...state.options,
        ...optionsParam
    };
    if (!state.screens || Object.keys(state.screens).length === 0) {
        useKarmycStore.setState({
            screens: {
                '1': createInitialScreenState()
            },
            activeScreenId: '1',
            nextScreenId: 2,
            lastUpdated: Date.now(),
            options: mergedOptions
        });
    } else {
        // Toujours mettre à jour les options avec priorité à la config
        useKarmycStore.setState({
            options: mergedOptions
        });
    }
};

export const useKarmycStore = create<RootStateType>()(
    immer(
        devtools(
            persist(
                (...a) => ({
                    ...createCoreSlice(...a),
                    ...createContextMenuSlice(...a),
                    ...createScreensSlice(...a),
                    ...createAreasSlice(...a),
                }),
                {
                    name: 'karmyc-store',
                    partialize: (state) => ({
                        areas: state.areas,
                        screens: state.screens,
                        activeScreenId: state.activeScreenId,
                        nextScreenId: state.nextScreenId,
                        lastUpdated: state.lastUpdated,
                        options: state.options,
                        layout_preset: state.layout_preset
                    }),
                    storage: createJSONStorage(() => localStorage),
                    skipHydration: false,
                    onRehydrateStorage: () => (state) => {
                        if (!state) {
                            console.warn('[KarmycStore] État invalide après hydratation, réinitialisation...');
                            useKarmycStore.setState({
                                screens: {
                                    '1': createInitialScreenState()
                                },
                                activeScreenId: '1',
                                nextScreenId: 2,
                                lastUpdated: Date.now(),
                                options: { allowStackMixedRoles: true }
                            });
                        }
                    }
                }
            ),
            { name: 'KarmycStore' }
        )
    )
);
