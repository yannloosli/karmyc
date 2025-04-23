import { useEffect } from 'react';
import { actionRegistry } from '../actions/registry';
import { IInitializeOptions } from '../types/karmyc';
import { useAppDispatch } from './index';

export function useInitialize(options: IInitializeOptions = {}) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        // Register plugins
        const pluginIds: string[] = [];
        if (options.plugins) {
            options.plugins.forEach(plugin => {
                actionRegistry.registerPlugin(plugin);
                pluginIds.push(plugin.id);
            });
        }

        // Register validators
        if (options.validators) {
            options.validators.forEach(({ actionType, validator }) => {
                actionRegistry.registerValidator(actionType, validator);
            });
        }

        // Clean up on unmount
        return () => {
            pluginIds.forEach(id => {
                actionRegistry.unregisterPlugin(id);
            });
        };
    }, [dispatch, options]);
} 
