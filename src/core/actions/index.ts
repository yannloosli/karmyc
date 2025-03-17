/**
 * Système d'actions du module core
 * Ce fichier exporte les fonctionnalités du système d'actions
 */

// Le système d'actions sera implémenté et exporté ici au fur et à mesure
// de l'implémentation du système 

import {
    analyticsPlugin,
    historyPlugin,
    loggingPlugin,
    performancePlugin,
    predefinedRules,
    validationPlugin
} from './plugins';
import { actionRegistry } from './registry';

// Enregistrer les plugins par défaut
actionRegistry.registerPlugin(historyPlugin);
actionRegistry.registerPlugin(loggingPlugin);
actionRegistry.registerPlugin(performancePlugin);
actionRegistry.registerPlugin(validationPlugin);
actionRegistry.registerPlugin(analyticsPlugin);

// Enregistrer les règles de validation prédéfinies
Object.values(predefinedRules).forEach(domain => {
  Object.values(domain).forEach(rule => {
    actionRegistry.registerValidator(rule.actionType, rule.validator);
  });
});

// Export du registre d'actions
export { actionRegistry, ActionRegistry } from './registry';

// Export des types
export * from './types';

// Export des validateurs
export * from './validators';

// Export des plugins
export * from './plugins/history';

// Export des priorités
export * from './priorities';

export * from './plugins';
