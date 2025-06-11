import React from 'react';
import { IKarmycProviderProps, IKarmycOptions } from '../types/karmyc';
import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';
interface KarmycContextType {
    options: IKarmycOptions;
}
export declare const KarmycContext: React.Context<KarmycContextType>;
/**
 * Main component that provides the global context for the layout system
 *
 * This component encapsulates:
 * - System initialization with specified options
 * - The context menu provider
 * - URL synchronization for active screen
 */
export declare const KarmycProvider: React.FC<IKarmycProviderProps>;
export {};
