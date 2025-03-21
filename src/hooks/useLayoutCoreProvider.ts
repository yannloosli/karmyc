import React, { useMemo } from 'react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { rootReducer } from '../store/rootReducer';
import { actionsMiddleware } from '../store/middleware/actions';
import { historyMiddleware } from '../store/middleware/history';
import { persistenceMiddleware } from '../store/middleware/persistence';
import { ICoreConfig } from '../types/core';

/**
 * Hook pour créer un provider React pour le système de mise en page
 * @param config - Configuration du système
 * @returns Provider React
 */
export function useLayoutCoreProvider(config: ICoreConfig) {
  // Créer le store Redux
  const store = useMemo(() => {
    return configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: false,
          immutableCheck: true
        }).concat(actionsMiddleware, historyMiddleware, persistenceMiddleware),
      preloadedState: config.initialState
    });
  }, [config.initialState]);
  
  // Créer le provider
  const LayoutCoreProvider = useMemo(() => {
    return ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );
  }, [store]);
  
  return LayoutCoreProvider;
} 
