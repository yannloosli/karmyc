/**
 * Action system of the core module
 * This file exports the functionalities of the action system
 */

import {
    analyticsPlugin,
    historyPlugin,
    loggingPlugin,
    performancePlugin,
    predefinedRules,
    validationPlugin
} from './plugins';
import { actionRegistry } from './registry';

// Register default plugins
actionRegistry.registerPlugin(historyPlugin);
actionRegistry.registerPlugin(loggingPlugin);
actionRegistry.registerPlugin(performancePlugin);
actionRegistry.registerPlugin(validationPlugin);
actionRegistry.registerPlugin(analyticsPlugin);

// Register predefined validation rules
Object.values(predefinedRules).forEach(domain => {
    Object.values(domain).forEach(rule => {
        actionRegistry.registerValidator(rule.actionType, rule.validator);
    });
});

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
