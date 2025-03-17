import { useEffect } from 'react';
import { actionRegistry } from '../actions';
import { IActionPlugin } from '../actions/types';

/**
 * Hook pour initialiser et gérer les plugins d'actions
 * @param plugins Liste des plugins à enregistrer
 * @param options Options de configuration
 */
export function useActions(
  plugins: IActionPlugin[] = [],
  options: { enableLogging?: boolean } = {}
) {
  useEffect(() => {
    // Enregistrer les plugins
    const pluginIds: string[] = [];
    plugins.forEach(plugin => {
      actionRegistry.registerPlugin(plugin);
      pluginIds.push(plugin.id);
    });

    // Activer le logging si demandé
    if (options.enableLogging) {
      console.log('Plugins d\'actions enregistrés:', pluginIds);
    }

    // Nettoyer lors du démontage
    return () => {
      pluginIds.forEach(id => {
        actionRegistry.unregisterPlugin(id);
      });
    };
  }, [plugins, options.enableLogging]);
} 
