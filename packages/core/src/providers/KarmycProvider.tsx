import React from 'react';
import { ContextMenuProvider } from '../components/context-menu/ContextMenuProvider';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';

/**
 * Main component that provides the global context for the layout system
 * 
 * This component encapsulates:
 * - System initialization with specified options
 * - The context menu provider
 */
export const KarmycProvider: React.FC<IKarmycProviderProps> = ({
    children,
    options = {}
}) => {
    return (
        <>
            <KarmycInitializer options={options} />
            <ContextMenuProvider>
                {children}
            </ContextMenuProvider>
        </>
    );
}; 
