import React from 'react';
import { Provider } from 'react-redux';
import { ContextMenuProvider } from '../components/context-menu/ContextMenuProvider';
import { store } from '../store';
import { IKarmycProviderProps } from '../types/karmyc';
import { KarmycInitializer } from './KarmycInitializer';

/**
 * Composant principal qui fournit le contexte global du système de layout
 * 
 * Ce composant encapsule:
 * - Le provider Redux pour la gestion de l'état
 * - L'initialisation du système avec les options spécifiées
 * - Le provider de menu contextuel
 * 
 * @param props - Propriétés du composant
 * @param props.children - Enfants du composant
 * @param props.options - Options de configuration (facultatif)
 * @param props.customStore - Store Redux personnalisé (facultatif)
 * @returns Composant React
 */
export const KarmycProvider: React.FC<IKarmycProviderProps> = ({
    children,
    options = {},
    customStore
}) => {
    // Utiliser le store personnalisé s'il est fourni, sinon utiliser le store par défaut
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
