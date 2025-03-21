/**
 * Point d'entrée principal du module core
 * Ce fichier exporte l'API publique du module core
 */

// Exporter les hooks publics
export * from './hooks';

// Exporter les composants publics
export * from './components';

// Exporter les types publics
export type * from './types/actions';
export type { Area as AreaType } from './types/area';

// Exporter les constantes publiques
export * from './constants';

// Exporter le provider principal
export { CoreProvider } from './providers/CoreProvider';

// Exporter le store
export { store } from './store';

// Exporter les actions publiques
export {
    // Actions de area
    addArea,
    // Actions de project
    createProject, removeArea, setActiveArea, updateArea, updateProject
} from './store';

// Exporter les utilitaires
export * from './utils/history';

// Exporter le registre d'actions
export { actionRegistry } from './actions/registry';

// Export des hooks
export { useActions } from './hooks/useActions';

// Export des actions
export * from './actions/validators';

// Les exports ci-dessus sont commentés car les fichiers correspondants
// n'ont pas encore été implémentés. Ils seront décommentés au fur et à mesure
// de l'implémentation des différentes parties du système. 
