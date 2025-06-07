import { IKarmycConfig } from '../../types/karmyc';
import { actionRegistry } from '../../actions/handlers/actionRegistry';

interface ICoreRegistry {
    initialize: (config: IKarmycConfig) => void;
    cleanup: () => void;
}

export const coreRegistry: ICoreRegistry = {
    initialize: (config: IKarmycConfig) => {
        // Initialize areas
        config.areas.types.forEach(type => {
            // Components and reducers will be registered via useRegisterAreaType
        });

        // Initialize actions
        config.actions.plugins.forEach(plugin => {
            actionRegistry.registerPlugin(plugin);
        });

        config.actions.validators.forEach(({ actionType, validator }) => {
            actionRegistry.registerValidator(actionType, validator);
        });

        // Initialize context menus
        config.contextMenu.actions.forEach(action => {
            // Actions will be registered via useRegisterContextMenuAction
        });
    },

    cleanup: () => {
        // Clean up areas
        // Note: Area cleanup is done automatically via useRegisterAreaType

        // Clean up actions
        // Note: Action cleanup is done automatically via useRegisterAction

        // Clean up context menus
        // Note: Context menu cleanup is done automatically via useRegisterContextMenuAction
    }
}; 
