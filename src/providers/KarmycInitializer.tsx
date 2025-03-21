import React, { useEffect } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {} }) => {
    useEffect(() => {
        // Enregistrer les plugins par défaut
        const defaultPlugins = [historyPlugin];
        const customPlugins = options.plugins || [];
        const allPlugins = [...defaultPlugins, ...customPlugins];

        const pluginIds: string[] = [];
        allPlugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
            pluginIds.push(plugin.id);
        });

        // Enregistrer les validateurs personnalisés
        if (options.validators) {
            options.validators.forEach(({ actionType, validator }) => {
                actionRegistry.registerValidator(actionType, validator);
            });
        }

        // Logging si activé
        if (options.enableLogging) {
            console.log('Karmyc initialisé avec:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0
            });
        }

        // Nettoyage
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [options]);

    return null;
}; 
