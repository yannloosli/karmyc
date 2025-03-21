import { useMemo } from 'react';
import { IKarmycOptions } from '../types/karmyc';

/**
 * Hook qui fournit une configuration pour le KarmycProvider
 * 
 * Ce hook est utilisé pour créer une configuration pour le KarmycProvider
 * et permet de configurer facilement le système de layout.
 * 
 * @param options - Options de configuration pour le système
 * @returns Configuration pour le KarmycProvider
 */
export function useKarmycLayoutProvider(options: IKarmycOptions = {}) {
    // Mémoriser les options pour éviter les re-rendus inutiles
    const memoizedOptions = useMemo(() => {
        return {
            // Valeurs par défaut
            enableLogging: options.enableLogging ?? false,
            plugins: options.plugins ?? [],
            validators: options.validators ?? [],
            initialAreas: options.initialAreas ?? [],
            customReducers: options.customReducers ?? {},
            keyboardShortcutsEnabled: options.keyboardShortcutsEnabled ?? true,
        };
    }, [
        options.enableLogging,
        options.plugins,
        options.validators,
        options.initialAreas,
        options.customReducers,
        options.keyboardShortcutsEnabled
    ]);

    return memoizedOptions;
} 
