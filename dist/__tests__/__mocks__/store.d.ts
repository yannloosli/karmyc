import type { RootState } from '../../src/store/areaStore';
export declare const createTestStore: () => import("zustand").UseBoundStore<Omit<import("zustand").StoreApi<RootState>, "setState"> & {
    setState(nextStateOrUpdater: RootState | Partial<RootState> | ((state: import("immer").WritableDraft<RootState>) => void), shouldReplace?: boolean | undefined): void;
}>;
export declare const resetStore: (store: ReturnType<typeof createTestStore>) => void;
