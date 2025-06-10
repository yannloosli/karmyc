import { IKarmycConfig } from '../../types/karmyc';
import { actionRegistry } from '../../actions/handlers/actionRegistry';

interface ICoreRegistry {
    initialize: (config: IKarmycConfig) => void;
}

export const coreRegistry: ICoreRegistry = {
    initialize: (config: IKarmycConfig) => {
        // Initialize actions
        config.actions.plugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
        });

        config.actions.validators.forEach(({ actionType, validator }) => {
            actionRegistry.registerValidator(actionType, validator);
        });
    }
}; 
