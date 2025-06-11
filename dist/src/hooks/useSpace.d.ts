import { Space } from '../store/spaceStore';
/**
 * Hook for managing spaces using Zustand
 * Provides functions to manipulate spaces and access their state
 */
export declare function useSpace(): {
    spaceList: {
        id: string;
        name: string;
    }[];
    activeSpaceId: string | null;
    openSpaces: Space[];
    openSpaceIds: string[];
    pilotMode: "AUTO" | "MANUAL";
    createSpace: (name: string, initialSharedState?: {}) => string | undefined;
    deleteSpace: (id: string) => void;
    setActive: (id: string | null) => void;
    setPilotMode: (mode: "MANUAL" | "AUTO") => void;
    openSpace: (id: string) => void;
    closeSpace: (id: string) => void;
    updateSharedState: (spaceId: string, changes: Partial<Record<string, any>>) => void;
    updateSpaceProperties: (id: string, changes: Partial<Omit<Space, "id">>) => void;
    getSpaceById: (id: string) => Space;
};
