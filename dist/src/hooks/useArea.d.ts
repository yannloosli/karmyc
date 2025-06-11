import { AreaTypeValue } from '../types/actions';
import { IArea } from '../types/areaTypes';
/**
 * Hook for managing areas
 * Provides functions to manipulate areas and access their state
 */
export declare function useArea(): {
    createArea: (type: AreaTypeValue, state: any, position?: {
        x: number;
        y: number;
    }, id?: string) => string;
    removeArea: (id: string) => void;
    setActive: (id: string | null) => void;
    update: (id: string, changes: Partial<IArea<AreaTypeValue>>) => void;
    getActive: () => IArea<string> | null;
    getById: (id: string) => IArea<string> | undefined;
    getAll: () => Record<string, IArea<string>>;
    getErrors: () => string[];
};
