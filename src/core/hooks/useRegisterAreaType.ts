import { useEffect } from 'react';
import { areaRegistry } from '../area/registry';
import { TAreaComponent, TAreaKeyboardShortcuts, TAreaReducer } from '../types/area';

/**
 * Hook pour enregistrer un type de zone
 * @param areaType - Type de zone à enregistrer
 * @param component - Composant React pour ce type de zone
 * @param reducer - Réducteur d'état pour ce type de zone
 * @param keyboardShortcuts - Raccourcis clavier pour ce type de zone (optionnel)
 * @param options - Options supplémentaires (optionnel)
 */
export function useRegisterAreaType<T extends string, S>(
  areaType: T,
  component: TAreaComponent<S>,
  reducer: TAreaReducer<S>,
  keyboardShortcuts?: TAreaKeyboardShortcuts,
  options?: {
    reactKey?: keyof S;
    displayName?: string;
    icon?: React.ComponentType;
  }
): void {
  useEffect(() => {
    // Enregistrer le composant
    areaRegistry.registerComponent(areaType, component);
    
    // Enregistrer le réducteur
    areaRegistry.registerReducer(areaType, reducer);
    
    // Enregistrer les raccourcis clavier si fournis
    if (keyboardShortcuts) {
      areaRegistry.registerKeyboardShortcuts(areaType, keyboardShortcuts);
    }
    
    // Enregistrer les options supplémentaires
    if (options) {
      if (options.reactKey) {
        areaRegistry.registerReactKey(areaType, options.reactKey);
      }
      
      if (options.displayName) {
        areaRegistry.registerDisplayName(areaType, options.displayName);
      }
      
      if (options.icon) {
        areaRegistry.registerIcon(areaType, options.icon);
      }
    }
    
    // Nettoyer lors du démontage du composant
    return () => {
      areaRegistry.unregisterAreaType(areaType);
    };
  }, [areaType, component, reducer, keyboardShortcuts, options]);
} 
