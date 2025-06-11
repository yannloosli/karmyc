import React from 'react';
import { IKarmycOptions } from '../../src/types/karmyc';
interface TestWrapperProps {
    children: React.ReactNode;
    options?: Partial<IKarmycOptions>;
}
export declare const TestWrapper: React.FC<TestWrapperProps>;
export {};
