import React from 'react';
import { IKarmycOptions } from '../types/karmyc';
interface IKarmycInitializerProps {
    options?: IKarmycOptions;
    children?: React.ReactNode;
    onError?: (error: Error) => void;
}
export declare const KarmycInitializer: React.FC<IKarmycInitializerProps>;
export {};
