import { Action, ActionPriority, IActionPlugin } from '../types/actions';
import { useTranslation } from '../hooks/useTranslation';

/**
 * Liste des types d'actions qui doivent être enregistrés dans l'historique
 * Seules ces actions seront disponibles pour l'annulation/rétablissement
 */
const HISTORY_ACTION_TYPES = [
    'area/addArea',
    'area/removeArea',
    'area/updateArea',
    'area/moveArea',
    'area/resizeArea',
    'composition/update',
    'composition/addElement',
    'composition/removeElement',
    'composition/updateElement',
    'project/update',
    // Actions de dessin
    'draw/addLine',
    'draw/updateLine',
    'draw/removeLine',
    'draw/updateStrokeWidth',
    'draw/updateColor',
    'draw/updateZoom',
    'draw/updatePan',
    'draw/clearCanvas'
];

/**
 * Plugin qui gère l'historique des actions
 * Enregistre les actions dans l'historique pour permettre l'undo/redo
 */
export const historyPlugin: IActionPlugin = {
    id: 'history',
    priority: ActionPriority.HIGH, // Priorité élevée pour s'exécuter avant d'autres plugins
    actionTypes: HISTORY_ACTION_TYPES, // Liste des types d'actions à enregistrer
    handler: (action: Action) => {
        // Enregistrer l'action dans l'historique
        const { type, payload } = action;

        // Générer un identifiant unique pour cette action dans l'historique
        const historyEntryId = `${type}-${Date.now()}`;

        // Enregistrer l'entrée d'historique avec les métadonnées importantes
        const historyEntry = {
            id: historyEntryId,
            type,
            payload,
            timestamp: Date.now(),
            description: getActionDescription(type, payload)
        };
    }
};

/**
 * Génère une description lisible par l'humain pour une action
 * Utilisé pour afficher des messages dans l'UI d'historique
 */
export function getActionDescription(type: string, payload: any): string {
    const { t } = useTranslation();
    
    switch (type) {
    case 'area/addArea':
        return t('action.area.add', `Ajout d'une zone ${payload.type || ''}`);
    case 'area/removeArea':
        return t('action.area.remove', 'Suppression d\'une zone');
    case 'area/updateArea':
        return t('action.area.update', 'Mise à jour d\'une zone');
    case 'area/moveArea':
        return t('action.area.move', 'Déplacement d\'une zone');
    case 'area/resizeArea':
        return t('action.area.resize', 'Redimensionnement d\'une zone');
    case 'composition/addElement':
        return t('action.composition.add', `Ajout d'un élément ${payload.elementType || ''}`);
    case 'composition/removeElement':
        return t('action.composition.remove', 'Suppression d\'un élément');
    case 'composition/updateElement':
        return t('action.composition.update', 'Mise à jour d\'un élément');
    // Actions de dessin
    case 'draw/addLine':
        return t('action.draw.addLine', 'Ajout d\'une ligne');
    case 'draw/updateLine':
        return t('action.draw.updateLine', 'Modification d\'une ligne');
    case 'draw/removeLine':
        return t('action.draw.removeLine', 'Suppression d\'une ligne');
    case 'draw/updateStrokeWidth':
        return t('action.draw.updateStrokeWidth', `Modification de l'épaisseur du trait : ${payload.oldValue} → ${payload.newValue}`);
    case 'draw/updateColor':
        return t('action.draw.updateColor', `Modification de la couleur : ${payload.oldValue} → ${payload.newValue}`);
    case 'draw/clearCanvas':
        return t('action.draw.clearCanvas', 'Effacement du dessin');
    default:
        return t('action.unknown', `Action ${type}`);
    }
} 
