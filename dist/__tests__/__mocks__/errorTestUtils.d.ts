import React from 'react';
import { IKarmycOptions } from '../../src/types/karmyc';
export declare const TestComponent: React.FC<{
    options?: IKarmycOptions;
    onError?: (err: Error) => void;
}>;
export declare const setupErrorTest: () => {
    consoleError: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
    consoleWarn: jest.SpyInstance<void, [message?: any, ...optionalParams: any[]], any>;
    onError: jest.Mock<any, any, any>;
    cleanup: () => void;
};
export declare const resetKarmycStore: () => void;
export declare const waitForInitialization: () => Promise<void>;
export declare const assertErrorLogged: (consoleSpy: jest.SpyInstance, expectedMessage: string) => void;
