import { useMemo } from 'react';
import { IKarmycOptions } from '../types/karmyc';

/**
 * Hook that provides a configuration for the KarmycProvider
 * 
 * This hook is used to create a configuration for the KarmycProvider
 * and makes it easy to configure the layout system.
 */
export function useKarmycLayoutProvider(options: IKarmycOptions = {}) {
    // Memorize options to avoid unnecessary re-renders
    const memoizedOptions = useMemo(() => {
        return {
            // Default values
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
