/**
 * Action system of the core module
 * This file exports the functionalities of the action system
 */

import { actionLogger } from './logger';
import {
    analyticsPlugin,
    historyPlugin,
    loggingPlugin,
    predefinedRules,
    validationPlugin
} from './plugins';
import { actionRegistry } from './registry';

// Register default plugins
actionRegistry.registerPlugin(historyPlugin);
actionRegistry.registerPlugin(loggingPlugin);
actionRegistry.registerPlugin(validationPlugin);
actionRegistry.registerPlugin(analyticsPlugin);

// Register predefined validation rules
if (predefinedRules) {
    Object.values(predefinedRules).forEach((rule: any) => {
        if (rule && typeof rule.id === 'string' && typeof rule.actionType === 'string' && typeof rule.validator === 'function') {
            actionRegistry.registerValidator(rule.actionType, rule.validator);
        }
    });
}

// Export action registry
export { actionRegistry, ActionRegistry } from './registry';

// Export types
export * from './types';

// Export validators
export * from './validators';

// Export plugins
export * from './plugins/history';

// Export priorities
export * from './priorities';

export * from './plugins';

export { actionLogger };
