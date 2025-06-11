interface ActionMetadata {
    menuType?: string;
    label?: string;
    icon?: string;
    isEnabled?: () => boolean;
    isVisible?: () => boolean;
    order?: number;
    history?: {
        enabled: boolean;
        type: string;
        getDescription?: (params: any) => string;
        getPayload?: (params: any) => any;
    };
}
export declare function useRegisterActionHandler(actionId: string, handler: (params: any) => void, metadata?: ActionMetadata): void;
export {};
