import type { RootState } from '../../src/store/areaStore';
import { createTestStore } from './store';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/types/actions';
export declare const waitForStateChange: (store: ReturnType<typeof createTestStore>, predicate: (state: RootState) => boolean, timeout?: number) => Promise<void>;
export declare const createTestArea: (overrides?: {}) => IArea<AreaTypeValue>;
export declare const createTestLayout: (overrides?: {}) => {
    id: string;
    type: string;
    areas: never[];
};
