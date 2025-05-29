import { useEffect } from 'react';
import { actionRegistry } from '../../actions/handlers/actionRegistry';
import { IActionPlugin } from '../../types/actions';

/**
 * Hook to initialize and manage action plugins
 */
export function useActions(
    plugins: IActionPlugin[] = [],
    options: { enableLogging?: boolean } = {}
) {
    useEffect(() => {
        // Register plugins
        const pluginIds: string[] = [];
        plugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
            pluginIds.push(plugin.id);
        });

        // Activate logging if requested
        if (options.enableLogging) {
            console.log('Action plugins registered:', pluginIds);
        }

        // Clean up when component unmounts
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [plugins, options.enableLogging]);
} 
