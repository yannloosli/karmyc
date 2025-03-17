import React from 'react';
import { Provider } from 'react-redux';
import { store } from '../store';
import { ICoreProviderProps } from '../types/core';
import { CoreInitializer } from './CoreInitializer';

/**
 * Provider principal qui initialise le système core
 * Gère le store Redux et l'initialisation des plugins
 */
export const CoreProvider: React.FC<ICoreProviderProps> = ({ 
  children, 
  options = {},
  customStore = store
}) => {
  // Utiliser React.createElement pour éviter les problèmes de typage
  return React.createElement(
    Provider as any,
    { store: customStore },
    <>
      <CoreInitializer options={options} />
      {children}
    </>
  );
}; 
