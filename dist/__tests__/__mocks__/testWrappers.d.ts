import React from 'react';
import { IKarmycOptions } from '../../src/types/karmyc';
import { IArea } from '../../src/types/areaTypes';
import { AreaTypeValue } from '../../src/types/actions';
interface TestWrapperProps {
    children: React.ReactNode;
    options?: Partial<IKarmycOptions>;
}
export declare const TestWrapper: React.FC<TestWrapperProps>;
export declare const createMockStore: (overrides?: {}) => {
    activeScreenId: string;
    screens: {
        'screen-1': {
            isDetached: boolean;
            areas: {
                areas: {};
            };
        };
    };
    options: {
        multiScreen: boolean;
    };
};
export declare const createTestViewport: (overrides?: {}) => {
    top: number;
    left: number;
    width: number;
    height: number;
};
interface TestComponentProps {
    initialAreas: IArea<AreaTypeValue>[];
    options?: Partial<IKarmycOptions>;
}
export declare const TestComponent: React.FC<TestComponentProps>;
export {};
