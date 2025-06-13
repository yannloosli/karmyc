import { StateCreator } from 'zustand';

import { RootStateType } from '../../mainStore';
import { AreasState } from "./areas-slice";
import { createInitialScreenState } from "../../utils/screens";
import { addScreen } from '../actions/add-screen';
import { switchScreen } from '../actions/switch-screen';
import { removeScreen } from '../actions/remove-screen';
import { duplicateScreen } from '../actions/duplicate-screen';
import { detachArea } from '../actions/detach-area';


export interface ScreenState {
    areas: AreasState;
    isDetached?: boolean;
    detachedFromAreaId?: string;
    isLocked?: boolean;
}

export type ScreensState = {
    screens: Record<string, ScreenState>;
    activeScreenId: string;
    nextScreenId: number;
    lastUpdated: number;
}

interface ScreensActions {
    addScreen: () => void;
    switchScreen: (screenId: string) => void;
    removeScreen: (screenId: string) => void;
    duplicateScreen: (screenId: string) => void;
    detachArea: (areaId: string) => void;
}

export type ScreensSlice = ScreensState & ScreensActions;

const initialState: ScreensState = {
    screens: {
        '1': createInitialScreenState() 
    },
    activeScreenId: '1',
    nextScreenId: 2,
    lastUpdated: Date.now() 
}


export const createScreensSlice: StateCreator<
    RootStateType, // le type global du store
    [],
    [],
    ScreensSlice
> = (set) => ({
    ...initialState,

    addScreen: addScreen(set),
    switchScreen: switchScreen(set),
    removeScreen: removeScreen(set),
    duplicateScreen: duplicateScreen(set),
    detachArea: detachArea(set)
});
