import { useEffect, useState } from 'react';
import { useKarmycStore } from '../../../src/core/store';
import { useSpace } from '../../../src/hooks';
import { useSpaceStore } from '../../../src/core/spaceStore';
import { t } from '../../../src/core/utils/translation';
import { Info, Layers, Palette } from 'lucide-react';

interface DebugAreaProps {
    id: string;
    state: any;
    viewport: {
        width: number;
        height: number;
    };
    type?: string;
    targetSpace?: string;
}

export const Debug: React.FC<DebugAreaProps> = ({
    targetSpace,
}) => {
    const { activeSpaceId } = useSpace();
    const areaStore = useKarmycStore();
    const activeScreenId = areaStore.activeScreenId;
    const allAreas = areaStore.screens[activeScreenId]?.areas.areas || {};
    const lastLeadAreaId = areaStore.screens[activeScreenId]?.areas.lastLeadAreaId;

    const [selectedSpace, setSelectedSpace] = useState<string>(targetSpace || activeSpaceId || '');

    // Synchroniser le select sur l'espace du dernier LEAD sélectionné
    useEffect(() => {
        if (lastLeadAreaId && selectedSpace !== lastLeadAreaId) {
            setSelectedSpace(lastLeadAreaId);
        }
    }, [lastLeadAreaId]);

    // Récupérer l'area LEAD et son spaceId
    const leadArea = lastLeadAreaId ? allAreas[lastLeadAreaId] : null;
    const leadSpaceId = leadArea?.spaceId;

    // Couleur à afficher : priorité à la couleur du space du LEAD
    const spaceStore = useSpaceStore();
    const leadSpaceColor = leadSpaceId ? spaceStore.spaces[leadSpaceId]?.sharedState?.color : undefined;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '1rem',
            background: '#fff',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
            <div title={t('debug.leadArea', 'Currently selected LEAD area')}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={16} />
                    {t('debug.leadAreaLabel', 'LEAD area')}
                </strong> : {leadArea ? `${leadArea.type} (id : ${leadArea.id})` : t('debug.none', 'None')}
            </div>
            <div title={t('debug.leadSpace', 'Space associated with LEAD area')}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Layers size={16} />
                    {t('debug.leadSpaceLabel', 'LEAD space')}
                </strong> : {leadSpaceId || t('debug.none', 'None')}
            </div>
            <div title={t('debug.leadSpaceColor', 'Color of space associated with LEAD area')}>
                <strong style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Palette size={16} />
                    {t('debug.leadSpaceColorLabel', 'LEAD space color')}
                </strong> : <span style={{ color: leadSpaceColor }}>{leadSpaceColor || 'N/A'}</span>
            </div>
        </div>
    );
};
