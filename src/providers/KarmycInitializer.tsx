import React, { useEffect } from 'react';
import { historyPlugin } from '../actions/plugins/history';
import { actionRegistry } from '../actions/registry';
import { useArea } from '../hooks/useArea';
import { IKarmycOptions } from '../types/karmyc';

interface IKarmycInitializerProps {
    options?: IKarmycOptions;
}

export const KarmycInitializer: React.FC<IKarmycInitializerProps> = ({ options = {} }) => {
    // Utiliser le hook useArea pour créer des zones
    const { createArea } = useArea();

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

        // Initialiser les zones personnalisées si spécifiées
        if (options.initialAreas && options.initialAreas.length > 0) {
            options.initialAreas.forEach(area => {
                createArea(
                    area.type,
                    area.state,
                    area.position
                );
            });

            if (options.enableLogging) {
                console.log(`${options.initialAreas.length} zones initialisées`);
            }
        }

        // Enregistrer les reducers personnalisés
        if (options.customReducers) {
            // NOTE: L'intégration directe de reducers personnalisés dans un store existant
            // n'est pas possible après sa création. Dans une future itération, nous allons
            // implémenter une solution basée sur des réducteurs asynchrones ou un store configurable.
            // Pour l'instant, nous enregistrons uniquement les intentions.

            if (options.enableLogging) {
                console.log(`${Object.keys(options.customReducers).length} reducers personnalisés à enregistrer`);
                console.log('Note: L\'intégration des reducers personnalisés sera disponible dans une future version');
            }
        }

        // Logging si activé
        if (options.enableLogging) {
            console.log('Karmyc initialisé avec:', {
                plugins: pluginIds,
                validators: options.validators?.length || 0,
                initialAreas: options.initialAreas?.length || 0,
                customReducers: options.customReducers ? Object.keys(options.customReducers).length : 0,
                keyboardShortcutsEnabled: options.keyboardShortcutsEnabled || false
            });
        }

        // Nettoyage
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [options, createArea]);

    return null;
}; 
