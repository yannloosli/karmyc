import { useEffect, useState } from 'react';
import { useKarmycStore } from '../../../src/store/areaStore';
import { useSpace } from '../../../src/hooks';
import { useSpaceStore } from '../../../src/store/spaceStore';

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
    state,
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
            <div><strong>LEAD area</strong> : {leadArea ? `${leadArea.type} (id : ${leadArea.id})` : 'Aucune'}</div>
            <div><strong>Espace du LEAD</strong> : {leadSpaceId || 'Aucun'}</div>
            <div>Couleur du space du LEAD : <span style={{ color: leadSpaceColor }}>{leadSpaceColor || 'N/A'}</span></div>
        </div>
    );
};
