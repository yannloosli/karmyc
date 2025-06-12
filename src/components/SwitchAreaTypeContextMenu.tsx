import React from 'react';
import { areaRegistry, useKarmycStore } from '../store';
import { AreaTypeValue, AREA_ROLE } from '../types/actions';
import { ControlledMenu } from '@szhsin/react-menu';
import { useContextMenuStore } from '../store/contextMenuStore';
import { useSpaceStore } from '../store/spaceStore';
import { useRegisterActionHandler } from '../actions/handlers/useRegisterActionHandler';
import { useTranslation } from '../hooks/useTranslation';
import { CircleHelp } from 'lucide-react';

// Récupère la map des rôles
const getRoleMap = () => (areaRegistry as any)._roleMap || {};

export const SwitchAreaTypeContextMenu: React.FC = () => {
    const { t } = useTranslation();
    const isVisible = useContextMenuStore((state) => state.isVisible && state.menuType === 'custom');
    const position = useContextMenuStore((state) => state.position);
    const closeContextMenu = useContextMenuStore((state) => state.closeContextMenu);
    const targetId = useContextMenuStore((state) => state.targetId) || "";

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

    return (
        <ControlledMenu
            anchorPoint={position}
            state={isVisible ? 'open' : 'closed'}
            onClose={closeContextMenu}
            transition
            direction="right"
            menuClassName={'switch-area-type-context-menu'}
        >
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
                                        backgroundColor: space.sharedState?.color || '#666' 
                                    }} />
                                    {t(`space.${spaceId}.name`, space.name)}
                                </div>
                            ))}
                        </>
                    )}
                </div>
            ))}
        </ControlledMenu>
    );
};
