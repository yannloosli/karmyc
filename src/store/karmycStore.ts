import { initializeKarmycStore } from './areaStore';
import type { IKarmycOptions } from '../types/karmyc';
import type { RootState } from './areaStore';
import type { StoreApi } from 'zustand';

export const karmycStore = initializeKarmycStore() as unknown as StoreApi<RootState>;

export type { IKarmycOptions }; 
