import { useTranslation } from './useTranslation';

export function useActionDescription() {
    const { t } = useTranslation();

    const getActionDescription = (type: string, payload: any): string => {
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
    };

    return { getActionDescription };
} 
