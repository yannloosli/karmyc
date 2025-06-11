import { AreaRole } from '../types/karmyc';
/**
 * Hook to register a custom area type
 */
export declare function useRegisterAreaType<T = any>(areaType: string, component: React.ComponentType<any>, initialState: T, options?: {
    displayName?: string;
    icon?: React.ComponentType;
    defaultSize?: {
        width: number;
        height: number;
    };
    supportedActions?: string[];
    role?: AreaRole;
    supportFullscreen?: boolean;
}): void;
