import { AnyAction } from '@reduxjs/toolkit';
import { IActionPlugin } from '../../types/actions';

/**
 * Plugin qui gère l'historique des actions
 * Enregistre les actions dans l'historique pour permettre l'undo/redo
 */
export const historyPlugin: IActionPlugin = {
  id: 'history',
  priority: 100, // Priorité élevée pour s'assurer que l'historique est enregistré avant d'autres plugins
  actionTypes: null, // Gère tous les types d'actions
  handler: (action: AnyAction) => {
    // TODO: Implémenter la logique d'enregistrement dans l'historique
    // Cette implémentation sera complétée une fois que le système d'historique sera en place
    console.log('Action enregistrée dans l\'historique:', action.type);
  }
}; 
