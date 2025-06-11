import { THistoryDiff } from '../types/historyTypes';
export interface SpaceSharedState extends Record<string, any> {
    color: string;
    pastDiffs: THistoryDiff[];
    futureDiffs: THistoryDiff[];
}
export interface Space {
    id: string;
    name: string;
    /**
     * Optional description for the space (user-defined, can be empty).
     */
    description?: string;
    sharedState: SpaceSharedState;
}
export interface SpaceState {
    spaces: Record<string, Space>;
    activeSpaceId: string | null;
    openSpaceIds: string[];
    errors: string[];
    pilotMode: 'MANUAL' | 'AUTO';
    addSpace: (spaceData: {
        name: string;
        description?: string;
        sharedState?: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>>;
    }) => string | undefined;
    removeSpace: (id: string) => void;
    setActiveSpace: (id: string | null) => void;
    setPilotMode: (mode: 'MANUAL' | 'AUTO') => void;
    openSpace: (id: string) => void;
    closeSpace: (id: string) => void;
    updateSpace: (spaceData: Partial<Space> & {
        id: string;
    }) => void;
    updateSpaceGenericSharedState: (payload: {
        spaceId: string;
        changes: Partial<Omit<SpaceSharedState, 'pastDiffs' | 'futureDiffs'>>;
    }) => void;
    clearErrors: () => void;
    undoSharedState: (spaceId: string) => void;
    redoSharedState: (spaceId: string) => void;
    getSpaceById: (id: string) => Space | undefined;
    getAllSpaces: () => Record<string, Space>;
    getActiveSpace: () => Space | null;
    getActiveSpaceId: () => string | null;
    getOpenSpaces: () => Space[];
    getSpaceErrors: () => string[];
    getPilotMode: () => 'MANUAL' | 'AUTO';
}
export declare const useSpaceStore: import("zustand").UseBoundStore<Omit<Omit<Omit<import("zustand").StoreApi<SpaceState>, "setState"> & {
    setState<A extends string | {
        type: string;
    }>(partial: SpaceState | Partial<SpaceState> | ((state: SpaceState) => SpaceState | Partial<SpaceState>), replace?: boolean | undefined, action?: A | undefined): void;
}, "persist"> & {
    persist: {
        setOptions: (options: Partial<import("zustand/middleware").PersistOptions<SpaceState, {
            spaces: Record<string, Partial<Omit<Space, "sharedState">> & {
                sharedState: Partial<Omit<SpaceSharedState, "pastDiffs" | "futureDiffs">>;
            }>;
            activeSpaceId: string | null;
        }>>) => void;
        clearStorage: () => void;
        rehydrate: () => Promise<void> | void;
        hasHydrated: () => boolean;
        onHydrate: (fn: (state: SpaceState) => void) => () => void;
        onFinishHydration: (fn: (state: SpaceState) => void) => () => void;
        getOptions: () => Partial<import("zustand/middleware").PersistOptions<SpaceState, {
            spaces: Record<string, Partial<Omit<Space, "sharedState">> & {
                sharedState: Partial<Omit<SpaceSharedState, "pastDiffs" | "futureDiffs">>;
            }>;
            activeSpaceId: string | null;
        }>>;
    };
}, "setState"> & {
    setState(nextStateOrUpdater: SpaceState | Partial<SpaceState> | ((state: import("immer").WritableDraft<SpaceState>) => void), shouldReplace?: boolean | undefined, action?: string | {
        type: string;
    } | undefined): void;
}>;
