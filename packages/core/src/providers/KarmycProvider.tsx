import React from 'react';
import { Provider } from 'react-redux';
import { ContextMenuProvider } from '../components/context-menu/ContextMenuProvider';
import { IKarmycProviderProps } from '../src/types/karmyc';
import { store } from '../store';
import { KarmycInitializer } from './KarmycInitializer';

/**
 * Main component that provides the global context for the layout system
 * 
 * This component encapsulates:
 * - The Redux Provider for state management
 * - System initialization with specified options
 * - The context menu provider
 */
export const KarmycProvider: React.FC<IKarmycProviderProps> = ({
    children,
    options = {},
    customStore
}) => {
    // Use the custom store if provided, otherwise use the default store
    const storeToUse = customStore || store;

    return (
        <Provider store={storeToUse}>
            <KarmycInitializer options={options} />
            <ContextMenuProvider>
                {children}
            </ContextMenuProvider>
        </Provider>
    );
}; 
