export declare const resetKarmycStore: () => void;
export declare const resetSpaceStore: () => void;
export declare const createTestArea: (overrides?: {}) => {
    type: string;
    role: string;
    state: {};
};
export declare const createTestSpace: (overrides?: {}) => {
    name: string;
    sharedState: {
        color: string;
    };
};
export declare const assertStoreState: (store: any, assertions: Record<string, any>) => void;
