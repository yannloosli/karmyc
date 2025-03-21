import React from 'react';
import { Provider } from 'react-redux';
import { ContextMenuProvider } from '../components/context-menu/ContextMenuProvider';
import { store } from '../store';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';

/**
 * Composant principal qui fournit le contexte global du système de layout
 * @param props - Propriétés du composant
 * @returns Composant React
 */
export const KarmycProvider: React.FC<IKarmycProviderProps> = ({
    children,
    options = {}
}) => {
    return (
        <Provider store={store}>
            <KarmycInitializer options={options} />
            <ContextMenuProvider>
                {children}
            </ContextMenuProvider>
        </Provider>
    );
}; 
