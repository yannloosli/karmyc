import React from 'react';
import { useKarmycStore } from '../../core/store';
import { areaRegistry } from '../../core/registries/areaRegistry';
import { t } from '../../core/utils/translation';
import { AreaTypeValue, AREA_ROLE } from '../../core/types/actions';
import { useSpaceStore } from '../../core/spaceStore';
import { useRegisterActionHandler } from '../../hooks/useRegisterActionHandler';
import { CircleHelp } from 'lucide-react';

import '@szhsin/react-menu/dist/index.css';
import '@szhsin/react-menu/dist/transitions/zoom.css';

// Récupère la map des rôles
const getRoleMap = () => (areaRegistry as any)._roleMap || {};

export const SwitchAreaTypeContextMenu: React.FC = () => {
    
    const closeContextMenu = useKarmycStore((state) => state.contextMenu.closeContextMenu);
    const targetId = useKarmycStore((state) => state.contextMenu.targetId) || "";

    const roleMap = getRoleMap();
    const registeredTypes = Array.from(areaRegistry.getRegisteredTypes());
    const spaces = useSpaceStore((state) => state.spaces);
    const activeSpaceId = useSpaceStore((state) => state.activeSpaceId);

    // Group types by role
    const columns = [
        { role: AREA_ROLE.LEAD, title: t('area.role.lead', 'LEAD'), items: [] as string[] },
        { role: AREA_ROLE.FOLLOW, title: t('area.role.follow', 'FOLLOW'), items: [] as string[] },
        { role: AREA_ROLE.SELF, title: t('area.role.self', 'SELF'), items: [] as string[] },
    ];
    registeredTypes.forEach(type => {
        const role = roleMap[type] || AREA_ROLE.SELF;
        const col = columns.find(c => c.role === role);
        if (col) col.items.push(type);
    });

    const handleChangeType = (newType: AreaTypeValue) => {
        useKarmycStore.getState().updateArea({ id: targetId, type: newType });
        if (closeContextMenu) closeContextMenu();
    };

    const handleSetSpace = (spaceId: string) => {
        useKarmycStore.getState().updateArea({ id: targetId, spaceId });
        if (closeContextMenu) closeContextMenu();
    };

    useRegisterActionHandler('switch-area-type', (params) => {
        if (params?.areaId && params?.newType) {
            // Logic for changing area type
            console.log(t('area.switch.log', `Switching area ${params.areaId} to type ${params.newType}`));
        }
    });

    const menuItems: React.ReactNode = (
        <div className={'context-menu switch-area-type-context-menu'}>
            {columns.map(col => (
                <div key={col.role} style={{ flex: 1, margin: '0 8px', width: '250px' }}>
                    <div style={{ padding: '4px 0 16px', marginBottom: 8, textAlign: 'left', borderBottom: '2px ridge #444', paddingBottom: 4 }}>{col.title}</div>
                    {col.items.map(type => {
                        const Icon = areaRegistry.getIcon(type) || CircleHelp;
                        return (
                            <div
                                key={type}
                                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: 4 }}
                                onClick={() => handleChangeType(type)}
                                onMouseDown={e => e.preventDefault()}
                            >
                                <Icon style={{ width: 16, height: 16 }} />
                                {t(`area.type.${type}`, areaRegistry.getDisplayName(type))}
                            </div>
                        )
                    })}
                    {col.role === AREA_ROLE.LEAD && (
                        <>
                            <div style={{ padding: '4px 0 16px', marginTop: 16, marginBottom: 8, textAlign: 'left', borderBottom: '2px ridge #444', paddingBottom: 4 }}>{t('area.spaces.title', 'SPACES')}</div>
                            {Object.entries(spaces).map(([spaceId, space]) => (
                                <div
                                    key={spaceId}
                                    data-testid="space-switch-button"
                                    style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 8, 
                                        cursor: 'pointer', 
                                        marginBottom: 4,
                                        backgroundColor: spaceId === activeSpaceId ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
                                        padding: '4px 8px',
                                        borderRadius: 4
                                    }}
                                    onClick={() => handleSetSpace(spaceId)}
                                    onMouseDown={e => e.preventDefault()}
                                >
                                    <div style={{ 
                                        width: 12, 
                                        height: 12, 
                                        borderRadius: '50%', 
                                        backgroundColor: space.color || '#666' 
                                    }} />
                                    {t(`space.${spaceId}.name`, space.name)}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            ))}
        </div>
    );

    return menuItems
};
