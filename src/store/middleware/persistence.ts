/**
 * Middleware pour la persistance de l'état
 * 
 * Ce middleware est responsable de :
 * 1. La sauvegarde automatique de l'état dans le stockage local
 * 2. La restauration de l'état au démarrage de l'application
 * 3. La gestion des conflits de version
 * 
 * @see docs/StoreReduxDesign.md - Section 3.1 Configuration du Store
 */

import { Middleware } from '@reduxjs/toolkit';

const STORAGE_KEY = 'animation-editor-state';
const STATE_VERSION = '1.0.0';

interface PersistedState {
  version: string;
  state: any;
}

export const persistenceMiddleware: Middleware = store => next => action => {
  // Exécuter l'action normalement
  const result = next(action);
  
  // Sauvegarder l'état après chaque action
  const currentState = store.getState();
  const persistedState: PersistedState = {
    version: STATE_VERSION,
    state: currentState
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistedState));
  } catch (error) {
    console.warn('Failed to persist state:', error);
  }
  
  return result;
};

/**
 * Fonction utilitaire pour restaurer l'état persistant
 */
export const restorePersistedState = (): any | null => {
  try {
    const persistedData = localStorage.getItem(STORAGE_KEY);
    if (!persistedData) return null;
    
    const persistedState: PersistedState = JSON.parse(persistedData);
    
    // Vérifier la version
    if (persistedState.version !== STATE_VERSION) {
      console.warn('State version mismatch, clearing persisted state');
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return persistedState.state;
  } catch (error) {
    console.warn('Failed to restore persisted state:', error);
    return null;
  }
}; 
