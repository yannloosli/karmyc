import { useEffect } from 'react';
import { actionRegistry } from '../actions/registry';
import { IInitializeOptions } from '../types/core';
import { useAppDispatch } from './index';

export function useInitialize(options: IInitializeOptions = {}) {
  const dispatch = useAppDispatch();
  
  useEffect(() => {
    // Enregistrer les plugins
    const pluginIds: string[] = [];
    if (options.plugins) {
      options.plugins.forEach(plugin => {
        actionRegistry.registerPlugin(plugin);
        pluginIds.push(plugin.id);
      });
    }
    
    // Enregistrer les validateurs
    if (options.validators) {
      options.validators.forEach(({ actionType, validator }) => {
        actionRegistry.registerValidator(actionType, validator);
      });
    }
    
    // Nettoyer lors du démontage
    return () => {
      pluginIds.forEach(id => {
        actionRegistry.unregisterPlugin(id);
      });
    };
  }, [dispatch, options]);
} 
