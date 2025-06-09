import { Action, ActionPriority, IActionPlugin } from '../types/actions';
import { useTranslation } from '../hooks/useTranslation';

/**
 * List of action types that must be recorded in the history
 * Only these actions will be available for undo/redo
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
    // Drawing actions
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
 * Plugin that manages the action history
 * Records actions in the history to allow undo/redo
 */
export const historyPlugin: IActionPlugin = {
    id: 'history',
    priority: ActionPriority.HIGH, // High priority to run before other plugins
    actionTypes: HISTORY_ACTION_TYPES, // List of action types to record
    handler: (action: Action) => {
        // Record the action in the history
        const { type, payload } = action;

        // Generate a unique identifier for this history action
        const historyEntryId = `${type}-${Date.now()}`;

        // Record the history entry with important metadata
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
 * Generates a human-readable description for an action
 * Used to display messages in the history UI
 */
export function getActionDescription(type: string, payload: any): string {
    const { t } = useTranslation();
    
    switch (type) {
    case 'area/addArea':
        return t('action.area.add', `Add area ${payload.type || ''}`);
    case 'area/removeArea':
        return t('action.area.remove', 'Remove area');
    case 'area/updateArea':
        return t('action.area.update', 'Update area');
    case 'area/moveArea':
        return t('action.area.move', 'Move area');
    case 'area/resizeArea':
        return t('action.area.resize', 'Resize area');
    case 'composition/addElement':
        return t('action.composition.add', `Add element ${payload.elementType || ''}`);
    case 'composition/removeElement':
        return t('action.composition.remove', 'Remove element');
    case 'composition/updateElement':
        return t('action.composition.update', 'Update element');
    // Drawing actions
    case 'draw/addLine':
        return t('action.draw.addLine', 'Add line');
    case 'draw/updateLine':
        return t('action.draw.updateLine', 'Edit line');
    case 'draw/removeLine':
        return t('action.draw.removeLine', 'Remove line');
    case 'draw/updateStrokeWidth':
        return t('action.draw.updateStrokeWidth', `Change stroke width: ${payload.oldValue} → ${payload.newValue}`);
    case 'draw/updateColor':
        return t('action.draw.updateColor', `Change color: ${payload.oldValue} → ${payload.newValue}`);
    case 'draw/clearCanvas':
        return t('action.draw.clearCanvas', 'Clear drawing');
    default:
        return t('action.unknown', `Action ${type}`);
    }
} 
