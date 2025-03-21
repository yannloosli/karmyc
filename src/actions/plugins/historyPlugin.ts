import { AnyAction } from '@reduxjs/toolkit';
import { IAction } from '../../types/actions';
import { ActionPriority } from '../priorities';

// Liste des types d'actions qui doivent être enregistrées dans l'historique
const HISTORY_ACTION_TYPES = [
  'area/addArea',
  'area/removeArea',
  'area/updateArea',
  // Autres types d'actions...
];

export const historyPlugin: IAction = {
  id: 'history',
  type: 'history',
  priority: ActionPriority.HIGH,
  actionTypes: HISTORY_ACTION_TYPES,
  handler: (action: AnyAction) => {
    // Logique pour enregistrer l'action dans l'historique
    // Cette logique dépendra de l'implémentation du système d'historique
    console.log(`Action enregistrée dans l'historique: ${action.type}`);
  }
}; 
