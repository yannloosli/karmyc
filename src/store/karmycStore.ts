import { initializeKarmycStore } from './areaStore';
import type { IKarmycOptions, RootState } from './areaStore';
import type { StoreApi } from 'zustand';

export const karmycStore = initializeKarmycStore() as StoreApi<RootState>;

export type { IKarmycOptions }; 
