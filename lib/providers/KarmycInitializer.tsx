import React, { useEffect } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { useArea } from '../hooks/useArea';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {} }) => {
    // Use the useArea hook to create zones
    const { createArea } = useArea();

    useEffect(() => {
        // Register default plugins
        const defaultPlugins = [historyPlugin];
        const customPlugins = options.plugins || [];
        const allPlugins = [...defaultPlugins, ...customPlugins];

        const pluginIds: string[] = [];
        allPlugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
            pluginIds.push(plugin.id);
        });

        // Register custom validators
        if (options.validators) {
            options.validators.forEach(({ actionType, validator }) => {
                actionRegistry.registerValidator(actionType, validator);
            });
        }

        // Initialize custom areas if specified
        if (options.initialAreas && options.initialAreas.length > 0) {
            options.initialAreas.forEach(area => {
                createArea(
                    area.type,
                    area.state,
                    area.position
                );
            });

            if (options.enableLogging) {
                console.log(`${options.initialAreas.length} zones initialized`);
            }
        }

        // Register custom reducers
        if (options.customReducers) {
            // NOTE: Direct integration of custom reducers in an existing store
            // is not possible after its creation. In a future iteration, we will
            // implement a solution based on async reducers or a configurable store.
            // For now, we only register the intentions.

            if (options.enableLogging) {
                console.log(`${Object.keys(options.customReducers).length} custom reducers to register`);
                console.log('Note: Integration of custom reducers will be available in a future version');
            }
        }

        // Logging if activated
        if (options.enableLogging) {
            console.log('Karmyc initialized with:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0,
                initialAreas: options.initialAreas?.length || 0,
                customReducers: options.customReducers ? Object.keys(options.customReducers).length : 0,
                keyboardShortcutsEnabled: options.keyboardShortcutsEnabled || false
            });
        }

        // Cleanup
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [options, createArea]);

    return null;
}; 
