import { useEffect } from 'react';
import { actionRegistry } from '../../actions/handlers/actionRegistry';
import { IActionPlugin } from '../../types/actions';

/**
 * Hook to initialize and manage action plugins
 */
export function useActions(
    plugins: IActionPlugin[] = [],
) {
    useEffect(() => {
        // Register plugins
        const pluginIds: string[] = [];
        plugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
            pluginIds.push(plugin.id);
        });

        // Clean up when component unmounts
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [plugins]);
} 
